"""
Authentication Middleware
"""
from functools import wraps
from flask import request, jsonify
from app.services.auth_service import AuthService


def require_auth(f):
    """Decorator to require authentication for a route."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Authorization header is required'}), 401
        
        # Extract token from "Bearer <token>" format
        parts = auth_header.split()
        
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid authorization header format'}), 401
        
        token = parts[1]
        
        # Verify token and get user
        result = AuthService.get_user_from_token(token)
        
        if not result['success']:
            return jsonify({'error': result['error']}), 401
        
        # Pass user info to the route function
        return f(result['user'], *args, **kwargs)
    
    return decorated


def optional_auth(f):
    """Decorator for optional authentication - passes None if not authenticated."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        current_user = None
        
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]
                result = AuthService.get_user_from_token(token)
                if result['success']:
                    current_user = result['user']
        
        return f(current_user, *args, **kwargs)
    
    return decorated
