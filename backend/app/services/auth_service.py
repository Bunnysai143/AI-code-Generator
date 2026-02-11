"""
Authentication Service - User Authentication & JWT Management
"""
import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from typing import Dict, Any
from app.services.db_service import DatabaseService


class AuthService:
    """Service class for user authentication operations."""
    
    @classmethod
    def get_jwt_secret(cls) -> str:
        """Get JWT secret key from environment."""
        return os.getenv('JWT_SECRET_KEY', os.getenv('SECRET_KEY', 'default-secret'))
    
    @classmethod
    def get_token_expiry_hours(cls) -> int:
        """Get token expiry time in hours."""
        return int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 24))
    
    @classmethod
    def hash_password(cls, password: str) -> str:
        """Hash a password using bcrypt."""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @classmethod
    def verify_password(cls, password: str, password_hash: str) -> bool:
        """Verify a password against its hash."""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    
    @classmethod
    def generate_token(cls, user_id: str, email: str) -> str:
        """Generate a JWT token for a user."""
        payload = {
            'user_id': user_id,
            'email': email,
            'exp': datetime.utcnow() + timedelta(hours=cls.get_token_expiry_hours()),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, cls.get_jwt_secret(), algorithm='HS256')
    
    @classmethod
    def verify_token(cls, token: str) -> Dict[str, Any]:
        """Verify a JWT token and return payload."""
        try:
            payload = jwt.decode(token, cls.get_jwt_secret(), algorithms=['HS256'])
            return {'valid': True, 'payload': payload}
        except jwt.ExpiredSignatureError:
            return {'valid': False, 'error': 'Token has expired'}
        except jwt.InvalidTokenError:
            return {'valid': False, 'error': 'Invalid token'}
    
    @classmethod
    def register_user(cls, email: str, password: str, name: str = '') -> Dict[str, Any]:
        """
        Register a new user.
        
        Returns:
            Dictionary with success status, token (if successful), or error message
        """
        # Check if email already exists
        existing_user = DatabaseService.find_user_by_email(email)
        if existing_user:
            return {'success': False, 'error': 'Email already registered'}
        
        # Validate password strength
        if len(password) < 6:
            return {'success': False, 'error': 'Password must be at least 6 characters'}
        
        # Hash password and create user
        password_hash = cls.hash_password(password)
        
        try:
            user = DatabaseService.create_user(email, password_hash, name)
            token = cls.generate_token(str(user['_id']), email)
            
            return {
                'success': True,
                'token': token,
                'user': {
                    'id': str(user['_id']),
                    'email': user['email'],
                    'name': user['name']
                }
            }
        except Exception as e:
            return {'success': False, 'error': 'Failed to create user'}
    
    @classmethod
    def authenticate_user(cls, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate a user with email and password.
        
        Returns:
            Dictionary with success status, token and user info (if successful), or error
        """
        user = DatabaseService.find_user_by_email(email)
        
        if not user:
            return {'success': False, 'error': 'Invalid credentials'}
        
        if not cls.verify_password(password, user['password_hash']):
            return {'success': False, 'error': 'Invalid credentials'}
        
        # Update last login
        DatabaseService.update_last_login(str(user['_id']))
        
        # Generate token
        token = cls.generate_token(str(user['_id']), email)
        
        return {
            'success': True,
            'token': token,
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'name': user.get('name', '')
            }
        }
    
    @classmethod
    def get_user_from_token(cls, token: str) -> Dict[str, Any]:
        """Get user info from a valid token."""
        result = cls.verify_token(token)
        
        if not result['valid']:
            return {'success': False, 'error': result['error']}
        
        user_id = result['payload']['user_id']
        user = DatabaseService.find_user_by_id(user_id)
        
        if not user:
            return {'success': False, 'error': 'User not found'}
        
        return {
            'success': True,
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'name': user.get('name', '')
            }
        }
