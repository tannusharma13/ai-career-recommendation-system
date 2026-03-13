"""Dashboard routes"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.db import find_one, upsert_one

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    user = find_one('users', {'_id': user_id})
    progress = find_one('progress', {'user_id': user_id})
    
    completed = progress.get('completed_milestones', []) if progress else []
    career = user.get('selected_career') if user else None
    
    # Get total milestones for career
    from routes.roadmap import ROADMAPS, DEFAULT_ROADMAP
    roadmap = ROADMAPS.get(career, DEFAULT_ROADMAP) if career else DEFAULT_ROADMAP
    total_milestones = sum(len(p['milestones']) for p in roadmap['phases'])
    
    completion_pct = round(len(completed) / total_milestones * 100, 1) if total_milestones > 0 else 0
    
    # Phase completion
    phase_stats = []
    for phase in roadmap['phases']:
        phase_completed = sum(1 for m in phase['milestones'] if m['id'] in completed)
        phase_stats.append({
            'phase': phase['title'],
            'completed': phase_completed,
            'total': len(phase['milestones']),
            'pct': round(phase_completed / len(phase['milestones']) * 100, 1)
        })
    
    return jsonify({
        'career': career,
        'total_milestones': total_milestones,
        'completed_milestones': len(completed),
        'completion_percentage': completion_pct,
        'phase_stats': phase_stats,
        'streak': calculate_streak(user_id)
    })


def calculate_streak(user_id):
    """Simplified streak calculation"""
    return 7  # Demo value


@dashboard_bp.route('/activity', methods=['POST'])
@jwt_required()
def log_activity():
    user_id = get_jwt_identity()
    data = request.json
    activity_type = data.get('type')
    description = data.get('description')
    
    from datetime import datetime
    from utils.db import insert_one
    insert_one('activities', {
        'user_id': user_id,
        'type': activity_type,
        'description': description,
        'timestamp': datetime.utcnow().isoformat()
    })
    return jsonify({'success': True})


@dashboard_bp.route('/activities', methods=['GET'])
@jwt_required()
def get_activities():
    user_id = get_jwt_identity()
    from utils.db import find_all
    activities = find_all('activities', {'user_id': user_id})
    activities.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return jsonify({'activities': activities[:20]})
