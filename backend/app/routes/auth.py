"""
Authentication Routes
"""
from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService
from app.middleware.auth_middleware import require_auth
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user account."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    # Validate required fields
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Attempt registration
    result = AuthService.register_user(email=email, password=password, name=name)
    
    if result['success']:
        return jsonify({
            'message': 'Registration successful',
            'token': result['token'],
            'user': result['user']
        }), 201
    else:
        return jsonify({'error': result['error']}), 400


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    result = AuthService.authenticate_user(email=email, password=password)
    
    if result['success']:
        return jsonify({
            'message': 'Login successful',
            'token': result['token'],
            'user': result['user']
        }), 200
    else:
        return jsonify({'error': result['error']}), 401


@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user(current_user):
    """Get current authenticated user's information."""
    return jsonify({
        'user': current_user
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout(current_user):
    """Logout user (client should discard token)."""
    return jsonify({
        'message': 'Logout successful'
    }), 200
