"""
Code Execution Routes - Sandbox for testing generated code
"""
from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import require_auth
import subprocess
import tempfile
import os
import time
import threading
import sys

execute_bp = Blueprint('execute', __name__, url_prefix='/api')

# Supported languages for execution
SUPPORTED_LANGUAGES = {
    'python': {
        'extension': '.py',
        'command': ['python'],
        'timeout': 10
    },
    'javascript': {
        'extension': '.js',
        'command': ['node'],
        'timeout': 10
    },
    'typescript': {
        'extension': '.ts',
        'command': ['npx', 'ts-node'],
        'timeout': 15
    }
}

# Maximum output size (in characters)
MAX_OUTPUT_SIZE = 50000

# Maximum execution time (in seconds)
MAX_EXECUTION_TIME = 10


def run_with_timeout(process, timeout):
    """Run process with timeout and return output."""
    result = {'stdout': '', 'stderr': '', 'timed_out': False}
    
    def target():
        try:
            stdout, stderr = process.communicate()
            result['stdout'] = stdout
            result['stderr'] = stderr
        except Exception as e:
            result['stderr'] = str(e)
    
    thread = threading.Thread(target=target)
    thread.start()
    thread.join(timeout)
    
    if thread.is_alive():
        process.kill()
        thread.join()
        result['timed_out'] = True
    
    return result


@execute_bp.route('/execute', methods=['POST'])
@require_auth
def execute_code(current_user):
    """Execute code in a sandboxed environment."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    code = data.get('code', '').strip()
    language = data.get('language', 'python').lower()
    user_input = data.get('input', '')
    
    if not code:
        return jsonify({'error': 'Code is required'}), 400
    
    if language not in SUPPORTED_LANGUAGES:
        return jsonify({
            'error': f'Language "{language}" is not supported for execution. Supported: {", ".join(SUPPORTED_LANGUAGES.keys())}'
        }), 400
    
    # Security checks - block dangerous operations
    dangerous_patterns = [
        'import os', 'import subprocess', 'import sys',
        'eval(', 'exec(', '__import__',
        'require("child_process")', 'require("fs")',
        'process.exit', 'process.env',
        'rm -rf', 'del /f', 'format c:',
        'socket', 'requests.', 'urllib',
        'open(', 'with open'  # File operations
    ]
    
    # Allow some safe patterns
    safe_patterns = ['open(', 'with open']
    
    code_lower = code.lower()
    for pattern in dangerous_patterns:
        if pattern.lower() in code_lower and pattern not in safe_patterns:
            return jsonify({
                'error': f'Potentially dangerous operation detected: {pattern}. Code execution is restricted for security.'
            }), 400
    
    lang_config = SUPPORTED_LANGUAGES[language]
    
    try:
        # Create temporary file for code
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix=lang_config['extension'],
            delete=False,
            encoding='utf-8'
        ) as f:
            f.write(code)
            temp_file = f.name
        
        try:
            # Build command
            command = lang_config['command'] + [temp_file]
            
            # Execute with timeout
            start_time = time.time()
            
            process = subprocess.Popen(
                command,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=tempfile.gettempdir(),
                env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'}
            )
            
            result = run_with_timeout(process, lang_config['timeout'])
            
            execution_time = time.time() - start_time
            
            if result['timed_out']:
                return jsonify({
                    'success': False,
                    'output': '',
                    'error': f'Execution timed out after {lang_config["timeout"]} seconds',
                    'execution_time': lang_config['timeout']
                }), 200
            
            stdout = result['stdout'][:MAX_OUTPUT_SIZE] if result['stdout'] else ''
            stderr = result['stderr'][:MAX_OUTPUT_SIZE] if result['stderr'] else ''
            
            # Check return code
            return_code = process.returncode
            
            if return_code == 0:
                return jsonify({
                    'success': True,
                    'output': stdout,
                    'error': stderr if stderr else None,
                    'execution_time': round(execution_time, 3)
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'output': stdout,
                    'error': stderr or 'Execution failed with non-zero exit code',
                    'execution_time': round(execution_time, 3)
                }), 200
                
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file)
            except:
                pass
                
    except FileNotFoundError:
        return jsonify({
            'error': f'Runtime for {language} is not available on this server'
        }), 503
    except Exception as e:
        print(f"Execution error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Execution error: {str(e)}'
        }), 500


@execute_bp.route('/execute/languages', methods=['GET'])
def get_supported_execution_languages():
    """Get list of languages supported for code execution."""
    languages = []
    for lang_id, config in SUPPORTED_LANGUAGES.items():
        languages.append({
            'id': lang_id,
            'name': lang_id.capitalize(),
            'timeout': config['timeout']
        })
    return jsonify({'languages': languages}), 200
