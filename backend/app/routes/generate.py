"""
Code Generation Routes
"""
from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import require_auth
from app.services.gemini_service import GeminiService
from app.services.db_service import DatabaseService

generate_bp = Blueprint('generate', __name__, url_prefix='/api')

# Supported programming languages
SUPPORTED_LANGUAGES = [
    'python', 'javascript', 'typescript', 'java', 'cpp', 'c',
    'csharp', 'ruby', 'go', 'php', 'swift', 'kotlin', 'rust'
]


@generate_bp.route('/generate', methods=['POST'])
@require_auth
def generate_code(current_user):
    """Generate code from natural language prompt using Gemini API."""
    data = request.get_json()
    
    # Validate request body
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    # Validate prompt
    prompt = data.get('prompt', '').strip()
    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400
    
    if len(prompt) < 10:
        return jsonify({'error': 'Prompt is too short. Please provide more details.'}), 400
    
    if len(prompt) > 2000:
        return jsonify({'error': 'Prompt exceeds maximum length of 2000 characters'}), 400
    
    # Validate language
    language = data.get('language', 'python').lower().strip()
    if language not in SUPPORTED_LANGUAGES:
        return jsonify({
            'error': f'Unsupported language. Supported: {", ".join(SUPPORTED_LANGUAGES)}'
        }), 400
    
    try:
        # Call Gemini API through service layer
        result = GeminiService.generate_code_with_explanation(
            prompt=prompt,
            language=language
        )
        
        if not result['success']:
            return jsonify({'error': result['error']}), 503
        
        # Store generation in database
        generation_id = DatabaseService.save_generation(
            user_id=current_user['id'],
            prompt=prompt,
            language=language,
            code=result['code'],
            explanation=result['explanation']
        )
        
        return jsonify({
            'id': generation_id,
            'code': result['code'],
            'explanation': result['explanation'],
            'language': language,
            'prompt': prompt
        }), 200
        
    except Exception as e:
        print(f"Generation error: {str(e)}")
        return jsonify({'error': 'An error occurred during code generation'}), 500


@generate_bp.route('/generate/refine', methods=['POST'])
@require_auth
def refine_code(current_user):
    """Refine existing code based on user feedback - conversational refinement."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    generation_id = data.get('generation_id')
    message = data.get('message', '').strip()
    conversation_history = data.get('conversation_history', [])
    
    if not generation_id:
        return jsonify({'error': 'generation_id is required'}), 400
    
    if not message:
        return jsonify({'error': 'Refinement message is required'}), 400
    
    if len(message) > 1000:
        return jsonify({'error': 'Message exceeds maximum length of 1000 characters'}), 400
    
    try:
        # Get the original generation
        generation = DatabaseService.get_generation_by_id(
            generation_id=generation_id,
            user_id=current_user['id']
        )
        
        if not generation:
            return jsonify({'error': 'Generation not found'}), 404
        
        original_code = generation.get('generated_code', '')
        language = generation.get('language', 'python')
        original_prompt = generation.get('prompt', '')
        
        # Call Gemini API for refinement
        result = GeminiService.refine_code(
            original_code=original_code,
            language=language,
            refinement_request=message,
            conversation_history=conversation_history,
            original_prompt=original_prompt
        )
        
        if not result['success']:
            return jsonify({'error': result['error']}), 503
        
        # Update the generation in database
        DatabaseService.update_generation_code(
            generation_id=generation_id,
            user_id=current_user['id'],
            new_code=result['code'],
            refinement_note=message
        )
        
        return jsonify({
            'code': result['code'],
            'explanation': result['explanation'],
            'changes': result.get('changes', []),
            'generation_id': generation_id
        }), 200
        
    except Exception as e:
        print(f"Refinement error: {str(e)}")
        return jsonify({'error': 'An error occurred during code refinement'}), 500


@generate_bp.route('/languages', methods=['GET'])
def get_supported_languages():
    """Get list of supported programming languages."""
    language_info = [
        {'id': 'python', 'name': 'Python', 'extension': '.py'},
        {'id': 'javascript', 'name': 'JavaScript', 'extension': '.js'},
        {'id': 'typescript', 'name': 'TypeScript', 'extension': '.ts'},
        {'id': 'java', 'name': 'Java', 'extension': '.java'},
        {'id': 'cpp', 'name': 'C++', 'extension': '.cpp'},
        {'id': 'c', 'name': 'C', 'extension': '.c'},
        {'id': 'csharp', 'name': 'C#', 'extension': '.cs'},
        {'id': 'ruby', 'name': 'Ruby', 'extension': '.rb'},
        {'id': 'go', 'name': 'Go', 'extension': '.go'},
        {'id': 'php', 'name': 'PHP', 'extension': '.php'},
        {'id': 'swift', 'name': 'Swift', 'extension': '.swift'},
        {'id': 'kotlin', 'name': 'Kotlin', 'extension': '.kt'},
        {'id': 'rust', 'name': 'Rust', 'extension': '.rs'}
    ]
    return jsonify({'languages': language_info}), 200
