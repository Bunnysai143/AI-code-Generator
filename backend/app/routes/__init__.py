"""
Routes Package
"""
from app.routes.auth import auth_bp
from app.routes.generate import generate_bp
from app.routes.explain import explain_bp
from app.routes.history import history_bp
from app.routes.favorites import favorites_bp
from app.routes.gist import gist_bp
from app.routes.execute import execute_bp

__all__ = ['auth_bp', 'generate_bp', 'explain_bp', 'history_bp', 'favorites_bp', 'gist_bp', 'execute_bp']
