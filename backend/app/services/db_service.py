"""
Database Service - MongoDB Operations
"""
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
from datetime import datetime


class DatabaseService:
    """Service class for MongoDB operations."""
    
    _client = None
    _db = None
    
    @classmethod
    def initialize(cls):
        """Initialize MongoDB connection using URI from environment."""
        if cls._client is None:
            mongo_uri = os.getenv('MONGODB_URI')
            if not mongo_uri:
                raise ValueError("MONGODB_URI not found in environment variables")
            
            cls._client = MongoClient(mongo_uri)
            cls._db = cls._client['code_generator']
            
            # Create indexes
            cls._create_indexes()
    
    @classmethod
    def _create_indexes(cls):
        """Create database indexes for optimized queries."""
        try:
            cls._db.users.create_index('email', unique=True)
            cls._db.code_generations.create_index('user_id')
            cls._db.code_generations.create_index('created_at')
            cls._db.history.create_index([('user_id', 1), ('timestamp', -1)])
            cls._db.explanations.create_index('generation_id')
        except Exception as e:
            print(f"Index creation warning: {e}")
    
    @classmethod
    def get_db(cls):
        """Get database instance."""
        cls.initialize()
        return cls._db
    
    # User Operations
    @classmethod
    def create_user(cls, email: str, password_hash: str, name: str = '') -> dict:
        """Create a new user."""
        db = cls.get_db()
        
        user_doc = {
            'email': email,
            'password_hash': password_hash,
            'name': name,
            'created_at': datetime.utcnow(),
            'last_login': None,
            'preferences': {
                'default_language': 'python',
                'theme': 'light'
            }
        }
        
        result = db.users.insert_one(user_doc)
        user_doc['_id'] = result.inserted_id
        return user_doc
    
    @classmethod
    def find_user_by_email(cls, email: str) -> dict:
        """Find user by email address."""
        db = cls.get_db()
        return db.users.find_one({'email': email})
    
    @classmethod
    def find_user_by_id(cls, user_id: str) -> dict:
        """Find user by ID."""
        db = cls.get_db()
        return db.users.find_one({'_id': ObjectId(user_id)})
    
    @classmethod
    def update_last_login(cls, user_id: str):
        """Update user's last login timestamp."""
        db = cls.get_db()
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'last_login': datetime.utcnow()}}
        )
    
    # Code Generation Operations
    @classmethod
    def save_generation(cls, user_id: str, prompt: str, language: str,
                       code: str, explanation: str) -> str:
        """Save a code generation to the database."""
        db = cls.get_db()
        timestamp = datetime.utcnow()
        
        # Insert code generation
        generation_doc = {
            'user_id': ObjectId(user_id),
            'prompt': prompt,
            'language': language,
            'generated_code': code,
            'created_at': timestamp,
            'success': True
        }
        generation_result = db.code_generations.insert_one(generation_doc)
        generation_id = generation_result.inserted_id
        
        # Insert explanation
        explanation_doc = {
            'generation_id': generation_id,
            'explanation_text': explanation,
            'created_at': timestamp
        }
        db.explanations.insert_one(explanation_doc)
        
        # Add to history
        history_doc = {
            'user_id': ObjectId(user_id),
            'generation_id': generation_id,
            'action_type': 'generate',
            'timestamp': timestamp,
            'metadata': {
                'language': language,
                'prompt_preview': prompt[:100] if len(prompt) > 100 else prompt
            }
        }
        db.history.insert_one(history_doc)
        
        return str(generation_id)
    
    @classmethod
    def get_generation_by_id(cls, generation_id: str, user_id: str = None) -> dict:
        """Get a specific code generation with its explanation."""
        db = cls.get_db()
        
        query = {'_id': ObjectId(generation_id)}
        if user_id:
            query['user_id'] = ObjectId(user_id)
        
        generation = db.code_generations.find_one(query)
        
        if generation:
            # Get associated explanation
            explanation = db.explanations.find_one({'generation_id': generation['_id']})
            generation['explanation'] = explanation['explanation_text'] if explanation else ''
            generation['_id'] = str(generation['_id'])
            generation['user_id'] = str(generation['user_id'])
        
        return generation
    
    @classmethod
    def get_user_history(cls, user_id: str, limit: int = 20, skip: int = 0) -> list:
        """Retrieve user's generation history."""
        db = cls.get_db()
        
        pipeline = [
            {'$match': {'user_id': ObjectId(user_id)}},
            {'$sort': {'timestamp': -1}},
            {'$skip': skip},
            {'$limit': limit},
            {'$lookup': {
                'from': 'code_generations',
                'localField': 'generation_id',
                'foreignField': '_id',
                'as': 'generation'
            }},
            {'$unwind': {'path': '$generation', 'preserveNullAndEmptyArrays': True}}
        ]
        
        history = list(db.history.aggregate(pipeline))
        
        # Convert ObjectIds to strings
        for item in history:
            item['_id'] = str(item['_id'])
            item['user_id'] = str(item['user_id'])
            item['generation_id'] = str(item['generation_id'])
            if 'generation' in item and item['generation']:
                item['generation']['_id'] = str(item['generation']['_id'])
                item['generation']['user_id'] = str(item['generation']['user_id'])
        
        return history
    
    @classmethod
    def delete_generation(cls, generation_id: str, user_id: str) -> bool:
        """Delete a code generation and its related data."""
        db = cls.get_db()
        
        # Verify ownership
        generation = db.code_generations.find_one({
            '_id': ObjectId(generation_id),
            'user_id': ObjectId(user_id)
        })
        
        if not generation:
            return False
        
        # Delete related documents
        db.explanations.delete_many({'generation_id': ObjectId(generation_id)})
        db.history.delete_many({'generation_id': ObjectId(generation_id)})
        db.code_generations.delete_one({'_id': ObjectId(generation_id)})
        
        return True
    
    @classmethod
    def get_user_stats(cls, user_id: str) -> dict:
        """Get user's usage statistics."""
        db = cls.get_db()
        
        total_generations = db.code_generations.count_documents({'user_id': ObjectId(user_id)})
        
        # Get language distribution
        pipeline = [
            {'$match': {'user_id': ObjectId(user_id)}},
            {'$group': {'_id': '$language', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        language_stats = list(db.code_generations.aggregate(pipeline))
        
        return {
            'total_generations': total_generations,
            'language_distribution': language_stats
        }
    
    # Update generation code (for refinement)
    @classmethod
    def update_generation_code(cls, generation_id: str, user_id: str, 
                               new_code: str, refinement_note: str = '') -> bool:
        """Update a generation's code after refinement."""
        db = cls.get_db()
        
        result = db.code_generations.update_one(
            {'_id': ObjectId(generation_id), 'user_id': ObjectId(user_id)},
            {
                '$set': {'generated_code': new_code},
                '$push': {
                    'refinements': {
                        'note': refinement_note,
                        'timestamp': datetime.utcnow()
                    }
                }
            }
        )
        return result.modified_count > 0
    
    # Favorites Operations
    @classmethod
    def add_favorite(cls, user_id: str, generation_id: str, title: str,
                     language: str = '', prompt_preview: str = '') -> dict:
        """Add a generation to user's favorites."""
        db = cls.get_db()
        
        favorite_doc = {
            'user_id': ObjectId(user_id),
            'generation_id': generation_id,
            'title': title,
            'language': language,
            'prompt_preview': prompt_preview,
            'created_at': datetime.utcnow()
        }
        
        result = db.favorites.insert_one(favorite_doc)
        favorite_doc['_id'] = str(result.inserted_id)
        favorite_doc['user_id'] = str(favorite_doc['user_id'])
        favorite_doc['favorite_id'] = str(result.inserted_id)
        
        return favorite_doc
    
    @classmethod
    def get_user_favorites(cls, user_id: str) -> list:
        """Get user's favorite generations."""
        db = cls.get_db()
        
        favorites = list(db.favorites.find(
            {'user_id': ObjectId(user_id)}
        ).sort('created_at', -1))
        
        for fav in favorites:
            fav['_id'] = str(fav['_id'])
            fav['user_id'] = str(fav['user_id'])
            fav['favorite_id'] = str(fav['_id'])
        
        return favorites
    
    @classmethod
    def get_favorite_by_generation(cls, user_id: str, generation_id: str) -> dict:
        """Get a favorite by generation ID."""
        db = cls.get_db()
        return db.favorites.find_one({
            'user_id': ObjectId(user_id),
            'generation_id': generation_id
        })
    
    @classmethod
    def update_favorite(cls, favorite_id: str, user_id: str, title: str) -> bool:
        """Update a favorite's title."""
        db = cls.get_db()
        result = db.favorites.update_one(
            {'_id': ObjectId(favorite_id), 'user_id': ObjectId(user_id)},
            {'$set': {'title': title}}
        )
        return result.modified_count > 0
    
    @classmethod
    def remove_favorite(cls, favorite_id: str, user_id: str) -> bool:
        """Remove a favorite."""
        db = cls.get_db()
        result = db.favorites.delete_one({
            '_id': ObjectId(favorite_id),
            'user_id': ObjectId(user_id)
        })
        return result.deleted_count > 0
    
    # GitHub/Gist Operations
    @classmethod
    def save_github_token(cls, user_id: str, github_token: str, github_username: str = ''):
        """Save user's GitHub token."""
        db = cls.get_db()
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'github_token': github_token,
                'github_username': github_username,
                'github_connected_at': datetime.utcnow()
            }}
        )
    
    @classmethod
    def get_user_github_token(cls, user_id: str) -> str:
        """Get user's GitHub token."""
        db = cls.get_db()
        user = db.users.find_one({'_id': ObjectId(user_id)}, {'github_token': 1})
        return user.get('github_token') if user else None
    
    @classmethod
    def remove_github_token(cls, user_id: str):
        """Remove user's GitHub token."""
        db = cls.get_db()
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$unset': {'github_token': '', 'github_username': '', 'github_connected_at': ''}}
        )
    
    @classmethod
    def save_gist_reference(cls, user_id: str, gist_id: str, html_url: str,
                           description: str = '', language: str = ''):
        """Save a reference to a created gist."""
        db = cls.get_db()
        
        gist_doc = {
            'user_id': ObjectId(user_id),
            'gist_id': gist_id,
            'html_url': html_url,
            'description': description,
            'language': language,
            'created_at': datetime.utcnow()
        }
        
        db.gists.insert_one(gist_doc)
    
    @classmethod
    def get_user_gists(cls, user_id: str) -> list:
        """Get user's created gists."""
        db = cls.get_db()
        
        gists = list(db.gists.find(
            {'user_id': ObjectId(user_id)}
        ).sort('created_at', -1))
        
        for gist in gists:
            gist['_id'] = str(gist['_id'])
            gist['user_id'] = str(gist['user_id'])
        
        return gists
