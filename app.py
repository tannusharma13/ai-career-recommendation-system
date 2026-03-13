"""
Career AI - Flask Backend Application
"""
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
import logging
from datetime import timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
jwt_secret = os.environ.get('JWT_SECRET_KEY')
if not jwt_secret:
    if os.environ.get('FLASK_ENV') == 'production':
        raise ValueError("JWT_SECRET_KEY environment variable is required in production")
    jwt_secret = 'career-ai-dev-secret-key-2024'  # Development fallback

app.config['JWT_SECRET_KEY'] = jwt_secret
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})
jwt = JWTManager(app)

# Import and register blueprints
from routes.auth import auth_bp
from routes.quiz import quiz_bp
from routes.roadmap import roadmap_bp
from routes.dashboard import dashboard_bp
from routes.resume import resume_bp
from routes.community import community_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(quiz_bp, url_prefix='/api/quiz')
app.register_blueprint(roadmap_bp, url_prefix='/api/roadmap')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(resume_bp, url_prefix='/api/resume')
app.register_blueprint(community_bp, url_prefix='/api/community')

@app.route('/api/health')
def health():
    return {'status': 'ok', 'message': 'Career AI API is running'}

@app.errorhandler(400)
def bad_request(error):
    logger.warning(f"Bad request: {error}")
    return jsonify({'error': 'Bad request'}), 400

@app.errorhandler(401)
def unauthorized(error):
    logger.warning(f"Unauthorized access: {error}")
    return jsonify({'error': 'Unauthorized'}), 401

@app.errorhandler(404)
def not_found(error):
    logger.warning(f"Resource not found: {error}")
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting Career AI API on port {port}")
    app.run(debug=os.environ.get('FLASK_ENV') == 'development', port=port)
