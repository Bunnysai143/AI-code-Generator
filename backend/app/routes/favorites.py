"""
Favorites Routes
"""
from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import require_auth
from app.services.db_service import DatabaseService
from bson.objectid import ObjectId
from datetime import datetime

favorites_bp = Blueprint('favorites', __name__, url_prefix='/api')


@favorites_bp.route('/favorites', methods=['GET'])
@require_auth
def get_favorites(current_user):
    """Get user's favorite code generations."""
    try:
        favorites = DatabaseService.get_user_favorites(user_id=current_user['id'])
        return jsonify({'favorites': favorites}), 200
    except Exception as e:
        print(f"Favorites fetch error: {str(e)}")
        return jsonify({'error': 'Failed to fetch favorites'}), 500


@favorites_bp.route('/favorites', methods=['POST'])
@require_auth
def add_favorite(current_user):
    """Add a code generation to favorites."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    generation_id = data.get('generation_id')
    title = data.get('title', '')
    
    if not generation_id:
        return jsonify({'error': 'generation_id is required'}), 400
    
    try:
        # Verify the generation exists and belongs to user
        generation = DatabaseService.get_generation_by_id(
            generation_id=generation_id,
            user_id=current_user['id']
        )
        
        if not generation:
            return jsonify({'error': 'Generation not found'}), 404
        
        # Check if already favorited
        existing = DatabaseService.get_favorite_by_generation(
            user_id=current_user['id'],
            generation_id=generation_id
        )
        
        if existing:
            return jsonify({'error': 'Already in favorites'}), 400
        
        favorite = DatabaseService.add_favorite(
            user_id=current_user['id'],
            generation_id=generation_id,
            title=title or generation.get('prompt', '')[:100],
            language=generation.get('language', ''),
            prompt_preview=generation.get('prompt', '')[:100]
        )
        
        return jsonify({'favorite': favorite, 'message': 'Added to favorites'}), 201
        
    except Exception as e:
        print(f"Add favorite error: {str(e)}")
        return jsonify({'error': 'Failed to add favorite'}), 500


@favorites_bp.route('/favorites/<favorite_id>', methods=['PUT'])
@require_auth
def update_favorite(current_user, favorite_id):
    """Update a favorite's title."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    title = data.get('title')
    
    try:
        success = DatabaseService.update_favorite(
            favorite_id=favorite_id,
            user_id=current_user['id'],
            title=title
        )
        
        if not success:
            return jsonify({'error': 'Favorite not found'}), 404
        
        return jsonify({'message': 'Favorite updated'}), 200
        
    except Exception as e:
        print(f"Update favorite error: {str(e)}")
        return jsonify({'error': 'Failed to update favorite'}), 500


@favorites_bp.route('/favorites/<favorite_id>', methods=['DELETE'])
@require_auth
def remove_favorite(current_user, favorite_id):
    """Remove a code generation from favorites."""
    try:
        success = DatabaseService.remove_favorite(
            favorite_id=favorite_id,
            user_id=current_user['id']
        )
        
        if not success:
            return jsonify({'error': 'Favorite not found'}), 404
        
        return jsonify({'message': 'Removed from favorites'}), 200
        
    except Exception as e:
        print(f"Remove favorite error: {str(e)}")
        return jsonify({'error': 'Failed to remove favorite'}), 500
