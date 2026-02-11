"""
Code Explanation Routes
"""
from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import require_auth
from app.services.gemini_service import GeminiService

explain_bp = Blueprint('explain', __name__, url_prefix='/api')


@explain_bp.route('/explain', methods=['POST'])
@require_auth
def explain_code(current_user):
    """Generate explanation for existing code."""
    data = request.get_json()
    
    # Validate request body
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    # Validate code
    code = data.get('code', '').strip()
    if not code:
        return jsonify({'error': 'Code is required'}), 400
    
    if len(code) < 5:
        return jsonify({'error': 'Code is too short'}), 400
    
    if len(code) > 5000:
        return jsonify({'error': 'Code exceeds maximum length of 5000 characters'}), 400
    
    # Get language (optional, will be auto-detected if not provided)
    language = data.get('language', 'python').lower().strip()
    
    try:
        # Call Gemini API for explanation
        result = GeminiService.explain_code(code=code, language=language)
        
        if not result['success']:
            return jsonify({'error': result['error']}), 503
        
        return jsonify({
            'explanation': result['explanation'],
            'language': language
        }), 200
        
    except Exception as e:
        print(f"Explanation error: {str(e)}")
        return jsonify({'error': 'An error occurred while generating explanation'}), 500
