"""
History Routes
"""
from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import require_auth
from app.services.db_service import DatabaseService

history_bp = Blueprint('history', __name__, url_prefix='/api')


@history_bp.route('/history', methods=['GET'])
@require_auth
def get_history(current_user):
    """Get user's code generation history."""
    # Get pagination parameters
    try:
        limit = int(request.args.get('limit', 20))
        skip = int(request.args.get('skip', 0))
    except ValueError:
        return jsonify({'error': 'Invalid pagination parameters'}), 400
    
    # Enforce limits
    limit = min(limit, 100)  # Max 100 items per request
    skip = max(skip, 0)
    
    try:
        history = DatabaseService.get_user_history(
            user_id=current_user['id'],
            limit=limit,
            skip=skip
        )
        
        return jsonify({
            'history': history,
            'limit': limit,
            'skip': skip
        }), 200
        
    except Exception as e:
        print(f"History fetch error: {str(e)}")
        return jsonify({'error': 'Failed to fetch history'}), 500


@history_bp.route('/history/<generation_id>', methods=['GET'])
@require_auth
def get_generation_detail(current_user, generation_id):
    """Get details of a specific code generation."""
    try:
        generation = DatabaseService.get_generation_by_id(
            generation_id=generation_id,
            user_id=current_user['id']
        )
        
        if not generation:
            return jsonify({'error': 'Generation not found'}), 404
        
        return jsonify({'generation': generation}), 200
        
    except Exception as e:
        print(f"Generation fetch error: {str(e)}")
        return jsonify({'error': 'Failed to fetch generation details'}), 500


@history_bp.route('/history/<generation_id>', methods=['DELETE'])
@require_auth
def delete_generation(current_user, generation_id):
    """Delete a code generation from history."""
    try:
        success = DatabaseService.delete_generation(
            generation_id=generation_id,
            user_id=current_user['id']
        )
        
        if not success:
            return jsonify({'error': 'Generation not found or access denied'}), 404
        
        return jsonify({'message': 'Generation deleted successfully'}), 200
        
    except Exception as e:
        print(f"Generation delete error: {str(e)}")
        return jsonify({'error': 'Failed to delete generation'}), 500


@history_bp.route('/stats', methods=['GET'])
@require_auth
def get_user_stats(current_user):
    """Get user's usage statistics."""
    try:
        stats = DatabaseService.get_user_stats(user_id=current_user['id'])
        return jsonify({'stats': stats}), 200
        
    except Exception as e:
        print(f"Stats fetch error: {str(e)}")
        return jsonify({'error': 'Failed to fetch statistics'}), 500
