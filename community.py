"""Community and peer learning routes"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
sys.path.insert(0, '..')
from utils.db import insert_one, find_one, find_all, update_one, upsert_one

community_bp = Blueprint('community', __name__)

# Community Management
@community_bp.route('/communities', methods=['GET'])
def get_communities():
    """Get all communities or filter by career"""
    career = request.args.get('career')
    query = {'career': career} if career else None
    communities = find_all('communities', query)
    return jsonify(communities)

@community_bp.route('/communities/<community_id>', methods=['GET'])
def get_community(community_id):
    """Get specific community details"""
    community = find_one('communities', {'_id': community_id})
    if not community:
        return jsonify({'error': 'Community not found'}), 404

    # Get community members
    members = find_all('community_members', {'community_id': community_id})
    community['members'] = members
    community['member_count'] = len(members)

    return jsonify(community)

@community_bp.route('/communities/<community_id>/join', methods=['POST'])
@jwt_required()
def join_community(community_id):
    """Join a community"""
    user_id = get_jwt_identity()

    # Check if community exists
    community = find_one('communities', {'_id': community_id})
    if not community:
        return jsonify({'error': 'Community not found'}), 404

    # Check if already a member
    existing = find_one('community_members', {'community_id': community_id, 'user_id': user_id})
    if existing:
        return jsonify({'error': 'Already a member'}), 409

    # Add member
    member_id = insert_one('community_members', {
        'community_id': community_id,
        'user_id': user_id,
        'role': 'member',
        'joined_at': None,  # Will be set by insert_one
        'reputation': 0,
        'is_active': True
    })

    # Update community member count
    update_one('communities', {'_id': community_id}, {'member_count': community.get('member_count', 0) + 1})

    return jsonify({'message': 'Joined community successfully', 'member_id': member_id})

@community_bp.route('/communities/<community_id>/leave', methods=['POST'])
@jwt_required()
def leave_community(community_id):
    """Leave a community"""
    user_id = get_jwt_identity()

    # Remove member
    from utils.db import delete_one
    deleted = delete_one('community_members', {'community_id': community_id, 'user_id': user_id})
    if not deleted:
        return jsonify({'error': 'Not a member of this community'}), 404

    # Update community member count
    community = find_one('communities', {'_id': community_id})
    if community:
        update_one('communities', {'_id': community_id}, {'member_count': max(0, community.get('member_count', 1) - 1)})

    return jsonify({'message': 'Left community successfully'})

# Messaging
@community_bp.route('/messages', methods=['GET'])
@jwt_required()
def get_messages():
    """Get messages (direct or community)"""
    user_id = get_jwt_identity()
    recipient_id = request.args.get('recipient_id')
    community_id = request.args.get('community_id')
    limit = int(request.args.get('limit', 50))

    if recipient_id:
        # Direct messages
        messages = find_all('messages', {
            '$or': [
                {'sender_id': user_id, 'recipient_id': recipient_id},
                {'sender_id': recipient_id, 'recipient_id': user_id}
            ]
        })
    elif community_id:
        # Community messages
        messages = find_all('messages', {'community_id': community_id})
    else:
        return jsonify({'error': 'Must specify recipient_id or community_id'}), 400

    # Sort by timestamp and limit
    messages.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    messages = messages[:limit]

    return jsonify(messages)

@community_bp.route('/messages', methods=['POST'])
@jwt_required()
def send_message():
    """Send a message"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('content'):
        return jsonify({'error': 'Message content required'}), 400

    message_data = {
        'sender_id': user_id,
        'content': data['content'],
        'message_type': data.get('message_type', 'text'),
        'is_read': False
    }

    if 'recipient_id' in data:
        message_data['recipient_id'] = data['recipient_id']
    elif 'community_id' in data:
        message_data['community_id'] = data['community_id']
    else:
        return jsonify({'error': 'Must specify recipient_id or community_id'}), 400

    message_id = insert_one('messages', message_data)
    return jsonify({'message_id': message_id, 'message': 'Message sent'}), 201

# Forums
@community_bp.route('/forums/<community_id>', methods=['GET'])
@jwt_required()
def get_forum_posts(community_id):
    """Get forum posts for a community"""
    posts = find_all('forum_posts', {'community_id': community_id})
    posts.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return jsonify(posts)

@community_bp.route('/forums/posts', methods=['POST'])
@jwt_required()
def create_forum_post():
    """Create a forum post"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('title') or not data.get('content') or not data.get('community_id'):
        return jsonify({'error': 'Title, content, and community_id required'}), 400

    post_data = {
        'community_id': data['community_id'],
        'author_id': user_id,
        'title': data['title'],
        'content': data['content'],
        'replies': [],
        'likes': 0,
        'is_pinned': False
    }

    post_id = insert_one('forum_posts', post_data)
    return jsonify({'post_id': post_id, 'message': 'Post created'}), 201

@community_bp.route('/forums/posts/<post_id>/reply', methods=['POST'])
@jwt_required()
def reply_to_post(post_id):
    """Reply to a forum post"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('content'):
        return jsonify({'error': 'Reply content required'}), 400

    post = find_one('forum_posts', {'_id': post_id})
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    reply = {
        'author_id': user_id,
        'content': data['content'],
        'created_at': None  # Will be set by insert_one
    }

    # Add reply to post
    replies = post.get('replies', [])
    replies.append(reply)
    update_one('forum_posts', {'_id': post_id}, {'replies': replies})

    return jsonify({'message': 'Reply added'}), 201

# Leaderboard & Reputation
@community_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get community leaderboard"""
    community_id = request.args.get('community_id')
    limit = int(request.args.get('limit', 20))

    query = {'community_id': community_id} if community_id else None
    members = find_all('community_members', query)

    # Sort by reputation
    members.sort(key=lambda x: x.get('reputation', 0), reverse=True)
    members = members[:limit]

    return jsonify(members)

@community_bp.route('/reputation/<user_id>', methods=['GET'])
@jwt_required()
def get_user_reputation(user_id):
    """Get user reputation across communities"""
    members = find_all('community_members', {'user_id': user_id})
    total_reputation = sum(member.get('reputation', 0) for member in members)

    return jsonify({
        'user_id': user_id,
        'total_reputation': total_reputation,
        'communities': members
    })

# Study Rooms & Challenges
@community_bp.route('/study-rooms', methods=['GET'])
@jwt_required()
def get_study_rooms():
    """Get available study rooms"""
    community_id = request.args.get('community_id')
    query = {'community_id': community_id} if community_id else None
    rooms = find_all('study_rooms', query)
    return jsonify(rooms)

@community_bp.route('/study-rooms', methods=['POST'])
@jwt_required()
def create_study_room():
    """Create a study room"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('name') or not data.get('community_id'):
        return jsonify({'error': 'Name and community_id required'}), 400

    room_data = {
        'community_id': data['community_id'],
        'creator_id': user_id,
        'name': data['name'],
        'description': data.get('description', ''),
        'max_participants': data.get('max_participants', 10),
        'current_participants': [user_id],
        'is_active': True,
        'session_start': None,
        'goals': data.get('goals', [])
    }

    room_id = insert_one('study_rooms', room_data)
    return jsonify({'room_id': room_id, 'message': 'Study room created'}), 201

@community_bp.route('/challenges', methods=['GET'])
@jwt_required()
def get_challenges():
    """Get community challenges"""
    community_id = request.args.get('community_id')
    query = {'community_id': community_id} if community_id else None
    challenges = find_all('challenges', query)
    return jsonify(challenges)

@community_bp.route('/challenges/<challenge_id>/join', methods=['POST'])
@jwt_required()
def join_challenge(challenge_id):
    """Join a challenge"""
    user_id = get_jwt_identity()

    challenge = find_one('challenges', {'_id': challenge_id})
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    # Check if already joined
    participants = challenge.get('participants', [])
    if user_id in participants:
        return jsonify({'error': 'Already joined this challenge'}), 409

    participants.append(user_id)
    update_one('challenges', {'_id': challenge_id}, {'participants': participants})

    return jsonify({'message': 'Joined challenge successfully'})