"""Authentication routes"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
import sys
sys.path.insert(0, '..')
from utils.db import insert_one, find_one, update_one

auth_bp = Blueprint('auth', __name__)

"""Authentication routes"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
import re
import sys
sys.path.insert(0, '..')
from utils.db import insert_one, find_one, update_one

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, ""

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON data'}), 400

        name = data.get('name', '').strip()
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')

        if not all([name, email, password]):
            return jsonify({'error': 'All fields are required'}), 400

        if len(name) < 2 or len(name) > 50:
            return jsonify({'error': 'Name must be between 2 and 50 characters'}), 400

        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400

        is_valid, password_error = validate_password(password)
        if not is_valid:
            return jsonify({'error': password_error}), 400

        if find_one('users', {'email': email}):
            return jsonify({'error': 'Email already registered'}), 409

        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        user_id = insert_one('users', {
            'name': name,
            'email': email,
            'password': hashed,
            'quiz_completed': False,
            'selected_career': None,
            'top_careers': []
        })

        token = create_access_token(identity=user_id)
        return jsonify({
            'token': token,
            'user': {'id': user_id, 'name': name, 'email': email, 'quiz_completed': False}
        }), 201

    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON data'}), 400

        email = data.get('email', '').lower().strip()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400

        user = find_one('users', {'email': email})
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401

        if not bcrypt.checkpw(password.encode(), user['password'].encode()):
            return jsonify({'error': 'Invalid credentials'}), 401

        token = create_access_token(identity=user['_id'])
        return jsonify({
            'token': token,
            'user': {
                'id': user['_id'],
                'name': user['name'],
                'email': user['email'],
                'quiz_completed': user.get('quiz_completed', False),
                'selected_career': user.get('selected_career')
            }
        })

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    try:
        user_id = get_jwt_identity()
        user = find_one('users', {'_id': user_id})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Remove sensitive data
        user_data = user.copy()
        user_data.pop('password', None)
        return jsonify(user_data)

    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({'error': 'Failed to get user data'}), 500
