"""
AI-Powered Code Generator - Flask Application Factory
"""
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', app.config['SECRET_KEY'])
    app.config['MONGODB_URI'] = os.getenv('MONGODB_URI')
    app.config['GEMINI_API_KEY'] = os.getenv('GEMINI_API_KEY')
    
    # Enable CORS - allow all origins for development
    CORS(app, origins="*", supports_credentials=True)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.generate import generate_bp
    from app.routes.history import history_bp
    from app.routes.explain import explain_bp
    from app.routes.favorites import favorites_bp
    from app.routes.gist import gist_bp
    from app.routes.execute import execute_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(generate_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(explain_bp)
    app.register_blueprint(favorites_bp)
    app.register_blueprint(gist_bp)
    app.register_blueprint(execute_bp)
    
    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return {'error': 'Bad request'}, 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return {'error': 'Authentication required'}, 401
    
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Resource not found'}, 404
    
    @app.errorhandler(429)
    def rate_limit_exceeded(error):
        return {'error': 'Too many requests. Please wait before trying again.'}, 429
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    # Root endpoint
    @app.route('/')
    def index():
        return {
            'name': 'AI Code Generator API',
            'status': 'running',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'auth': '/api/auth/*',
                'generate': '/api/generate',
                'explain': '/api/explain',
                'history': '/api/history'
            }
        }
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'API is running'}
    
    return app
