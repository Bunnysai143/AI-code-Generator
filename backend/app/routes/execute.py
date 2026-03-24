"""
Code Execution Routes - Sandbox for testing generated code
 Uses Judge0 API for online code execution (supports 50+ languages)
"""
from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import require_auth
import subprocess
import tempfile
import os
import time
import threading
import sys
import requests

execute_bp = Blueprint('execute', __name__, url_prefix='/api')

# Judge0 API endpoint (local Docker instance)
JUDGE0_API_URL = "http://localhost:2358"

# Language mapping for Judge0 API (language name -> Judge0 language_id)
JUDGE0_LANGUAGES = {
    'python': 71,       # Python (3.8.1)
    'javascript': 63,   # JavaScript (Node.js 12.14.0)
    'typescript': 74,   # TypeScript (3.7.4)
    'java': 62,         # Java (OpenJDK 13.0.1)
    'cpp': 54,          # C++ (GCC 9.2.0)
    'c': 50,            # C (GCC 9.2.0)
    'csharp': 51,       # C# (Mono 6.6.0.161)
    'ruby': 72,         # Ruby (2.7.0)
    'go': 60,           # Go (1.13.5)
    'php': 68,          # PHP (7.4.1)
    'swift': 83,        # Swift (5.2.3)
    'kotlin': 78,       # Kotlin (1.3.70)
    'rust': 73,         # Rust (1.40.0)
}

# Supported languages for execution
SUPPORTED_LANGUAGES = {
    'python': {
        'extension': '.py',
        'command': ['python'],
        'timeout': 10,
        'compile': None
    },
    'javascript': {
        'extension': '.js',
        'command': ['node'],
        'timeout': 10,
        'compile': None
    },
    'typescript': {
        'extension': '.ts',
        'command': ['npx', 'ts-node'],
        'timeout': 15,
        'compile': None
    },
    'java': {
        'extension': '.java',
        'command': ['java'],
        'timeout': 15,
        'compile': ['javac'],
        'class_based': True
    },
    'cpp': {
        'extension': '.cpp',
        'command': None,  # Will be set after compilation
        'timeout': 10,
        'compile': ['g++', '-o'],
        'compiled': True
    },
    'c': {
        'extension': '.c',
        'command': None,
        'timeout': 10,
        'compile': ['gcc', '-o'],
        'compiled': True
    },
    'csharp': {
        'extension': '.cs',
        'command': ['dotnet', 'script'],
        'timeout': 15,
        'compile': None,
        'alt_command': ['csc']  # Alternative: compile with csc
    },
    'ruby': {
        'extension': '.rb',
        'command': ['ruby'],
        'timeout': 10,
        'compile': None
    },
    'go': {
        'extension': '.go',
        'command': ['go', 'run'],
        'timeout': 15,
        'compile': None
    },
    'php': {
        'extension': '.php',
        'command': ['php'],
        'timeout': 10,
        'compile': None
    },
    'swift': {
        'extension': '.swift',
        'command': ['swift'],
        'timeout': 15,
        'compile': None
    },
    'kotlin': {
        'extension': '.kt',
        'command': ['kotlin'],
        'timeout': 20,
        'compile': ['kotlinc', '-include-runtime', '-d'],
        'jar_based': True
    },
    'rust': {
        'extension': '.rs',
        'command': None,
        'timeout': 15,
        'compile': ['rustc', '-o'],
        'compiled': True
    }
}

# Maximum output size (in characters)
MAX_OUTPUT_SIZE = 50000

# Maximum execution time (in seconds)
MAX_EXECUTION_TIME = 10


def run_with_timeout(process, timeout, stdin_input=''):
    """Run process with timeout and return output."""
    result = {'stdout': '', 'stderr': '', 'timed_out': False}

    def target():
        try:
            # Pass stdin input to the process
            stdout, stderr = process.communicate(input=stdin_input if stdin_input else None)
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


def execute_with_judge0(code, language, stdin=''):
    """Execute code using Judge0 API (local Docker instance)."""
    if language not in JUDGE0_LANGUAGES:
        return None, f'Language {language} not supported by Judge0 API'
    
    language_id = JUDGE0_LANGUAGES[language]
    
    payload = {
        'language_id': language_id,
        'source_code': code,
        'stdin': stdin or ''
    }
    
    try:
        print(f"[Judge0] Executing {language} code (language_id={language_id})...")
        
        response = requests.post(
            f"{JUDGE0_API_URL}/submissions/?base64_encoded=false&wait=true",
            json=payload,
            timeout=60,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"[Judge0] Response status: {response.status_code}")
        
        if response.status_code in (200, 201):
            result = response.json()
            print(f"[Judge0] Result: {result}")
            
            status = result.get('status', {})
            status_id = status.get('id', 0)
            stdout = result.get('stdout') or ''
            stderr = result.get('stderr') or ''
            compile_output = result.get('compile_output') or ''
            execution_time = float(result.get('time') or 0)
            
            # Status 6 = Compilation Error
            if status_id == 6:
                return {
                    'success': False,
                    'output': '',
                    'error': f"Compilation error:\n{compile_output}" if compile_output else "Compilation failed",
                    'execution_time': execution_time
                }, None
            
            # Status 5 = Time Limit Exceeded
            if status_id == 5:
                return {
                    'success': False,
                    'output': stdout[:MAX_OUTPUT_SIZE],
                    'error': 'Execution timed out',
                    'execution_time': execution_time
                }, None
            
            # Status 13 = Internal Error (sandbox/isolate failure)
            if status_id == 13:
                message = result.get('message') or ''
                print(f"[Judge0] Internal Error: {message}")
                return None, f'Judge0 sandbox error: {message}. The Judge0 sandbox (isolate) may not be configured correctly.'
            
            # Status 3 = Accepted (successful execution)
            # Status 4 = Wrong Answer (still ran successfully)
            if status_id == 3:
                return {
                    'success': True,
                    'output': stdout[:MAX_OUTPUT_SIZE],
                    'error': stderr[:MAX_OUTPUT_SIZE] if stderr else None,
                    'execution_time': execution_time
                }, None
            
            # Status 7-12 = Runtime errors
            error_msg = stderr or compile_output or status.get('description', 'Execution failed')
            return {
                'success': False,
                'output': stdout[:MAX_OUTPUT_SIZE],
                'error': error_msg[:MAX_OUTPUT_SIZE],
                'execution_time': execution_time
            }, None
        else:
            print(f"[Judge0] Error response: {response.text}")
            return None, f'Judge0 API error: {response.status_code}'
            
    except requests.exceptions.Timeout:
        print("[Judge0] Request timed out")
        return None, 'Code execution timed out'
    except requests.exceptions.RequestException as e:
        return None, f'Judge0 API request failed: {str(e)}'


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
    
    # Security checks - block dangerous operations per language
    dangerous_patterns = {
        'common': [
            'rm -rf', 'del /f', 'format c:', 'rmdir', 'deltree',
            'shutdown', 'reboot', ':(){:|:&};:'  # Fork bomb
        ],
        'python': [
            'import os', 'import subprocess', 'import sys',
            'eval(', 'exec(', '__import__', 'compile(',
            'socket', 'requests.', 'urllib', 'http.client',
            'open(', 'with open', 'os.system', 'os.popen',
            'pty.', 'fcntl.'
        ],
        'javascript': [
            'require("child_process")', 'require("fs")',
            'require(\'child_process\')', 'require(\'fs\')',
            'process.exit', 'process.env', 'process.kill',
            'spawn(', 'exec(', 'execSync', 'execFile',
            'fs.writeFile', 'fs.unlink', 'fs.rmdir'
        ],
        'typescript': [
            'require("child_process")', 'require("fs")',
            'require(\'child_process\')', 'require(\'fs\')',
            'process.exit', 'process.env', 'process.kill',
            'spawn(', 'exec(', 'execSync', 'execFile'
        ],
        'java': [
            'Runtime.getRuntime().exec', 'ProcessBuilder',
            'System.exit', 'FileWriter', 'FileOutputStream',
            'FileInputStream', 'new File(', 'Files.delete',
            'SecurityManager'
        ],
        'cpp': [
            'system(', 'popen(', 'exec(', 'fork(',
            'remove(', 'unlink(', 'fopen(', 'freopen(',
            '#include <fstream>', '#include <cstdlib>',
            'asm(', '__asm'
        ],
        'c': [
            'system(', 'popen(', 'exec(', 'fork(',
            'remove(', 'unlink(', 'fopen(', 'freopen(',
            'asm(', '__asm'
        ],
        'csharp': [
            'Process.Start', 'System.Diagnostics.Process',
            'File.Delete', 'File.WriteAllText', 'FileStream',
            'StreamWriter', 'Environment.Exit'
        ],
        'ruby': [
            'system(', 'exec(', '`', '%x{', 'IO.popen',
            'File.open', 'File.delete', 'FileUtils',
            'Kernel.exit', 'Process.kill'
        ],
        'go': [
            'os/exec', 'os.Remove', 'os.Exit',
            'syscall.', 'os.OpenFile'
        ],
        'php': [
            'exec(', 'shell_exec', 'system(', 'passthru(',
            'popen(', 'proc_open', 'pcntl_exec',
            'file_put_contents', 'unlink(', 'rmdir('
        ],
        'swift': [
            'Process()', 'FileManager', 'shell(',
            'NSTask', 'exit('
        ],
        'kotlin': [
            'Runtime.getRuntime().exec', 'ProcessBuilder',
            'System.exit', 'File(', 'FileWriter'
        ],
        'rust': [
            'std::process::Command', 'std::fs::remove',
            'std::process::exit', 'std::fs::write'
        ]
    }
    
    # Get patterns to check based on language
    patterns_to_check = dangerous_patterns.get('common', []) + dangerous_patterns.get(language, [])
    
    # Check for dangerous patterns in code
    code_lower = code.lower()
    for pattern in patterns_to_check:
        if pattern.lower() in code_lower:
            return jsonify({
                'error': f'Potentially dangerous operation detected: {pattern}. Code execution is restricted for security.'
            }), 400
    
    lang_config = SUPPORTED_LANGUAGES[language]
    
    # Languages that should use Judge0 API (compiled languages or those without local runtime)
    use_judge0_languages = ['java', 'cpp', 'c', 'csharp', 'ruby', 'go', 'php', 'swift', 'kotlin', 'rust']
    
    # Try Judge0 API for languages that typically need compilation or lack local runtime
    if language in use_judge0_languages:
        judge0_result, judge0_error = execute_with_judge0(code, language, user_input)
        if judge0_result:
            return jsonify(judge0_result), 200
        # If Judge0 fails, try local execution as fallback
        print(f"Judge0 API failed for {language}: {judge0_error}, trying local execution...")
    
    # Local execution for Python, JavaScript, TypeScript, or as fallback
    temp_files = []  # Track all temp files for cleanup
    
    try:
        temp_dir = tempfile.gettempdir()
        
        # Handle Java specially - needs class name to match filename
        if language == 'java':
            # Extract public class name from code
            import re
            class_match = re.search(r'public\s+class\s+(\w+)', code)
            if class_match:
                class_name = class_match.group(1)
            else:
                class_name = 'Main'
                # Wrap code in a Main class if no public class found
                if 'class ' not in code:
                    code = f'public class Main {{\n    public static void main(String[] args) {{\n        {code}\n    }}\n}}'
            
            temp_file = os.path.join(temp_dir, f'{class_name}.java')
            with open(temp_file, 'w', encoding='utf-8') as f:
                f.write(code)
            temp_files.append(temp_file)
            
            # Compile Java
            compile_process = subprocess.run(
                ['javac', temp_file],
                capture_output=True,
                text=True,
                cwd=temp_dir,
                timeout=30
            )
            
            if compile_process.returncode != 0:
                return jsonify({
                    'success': False,
                    'output': '',
                    'error': f'Compilation error:\n{compile_process.stderr}',
                    'execution_time': 0
                }), 200
            
            class_file = os.path.join(temp_dir, f'{class_name}.class')
            temp_files.append(class_file)
            
            command = ['java', '-cp', temp_dir, class_name]
        
        # Handle Kotlin
        elif language == 'kotlin':
            # Create temp file
            temp_file = tempfile.NamedTemporaryFile(
                mode='w', suffix='.kt', delete=False, 
                encoding='utf-8', dir=temp_dir
            )
            temp_file.write(code)
            temp_file.close()
            temp_files.append(temp_file.name)
            
            # Try direct kotlin script execution first
            command = ['kotlin', temp_file.name]
        
        # Handle compiled languages (C, C++, Rust)
        elif lang_config.get('compiled'):
            temp_file = tempfile.NamedTemporaryFile(
                mode='w', suffix=lang_config['extension'], 
                delete=False, encoding='utf-8', dir=temp_dir
            )
            temp_file.write(code)
            temp_file.close()
            temp_files.append(temp_file.name)
            
            # Create output executable name
            exe_suffix = '.exe' if sys.platform == 'win32' else ''
            output_file = temp_file.name.rsplit('.', 1)[0] + exe_suffix
            temp_files.append(output_file)
            
            # Build compile command
            compile_cmd = lang_config['compile'] + [output_file, temp_file.name]
            
            compile_process = subprocess.run(
                compile_cmd,
                capture_output=True,
                text=True,
                cwd=temp_dir,
                timeout=30
            )
            
            if compile_process.returncode != 0:
                return jsonify({
                    'success': False,
                    'output': '',
                    'error': f'Compilation error:\n{compile_process.stderr}',
                    'execution_time': 0
                }), 200
            
            command = [output_file]
        
        # Handle C# with dotnet-script or csc
        elif language == 'csharp':
            temp_file = tempfile.NamedTemporaryFile(
                mode='w', suffix='.csx', delete=False, 
                encoding='utf-8', dir=temp_dir
            )
            temp_file.write(code)
            temp_file.close()
            temp_files.append(temp_file.name)
            
            # Try dotnet-script first
            command = ['dotnet', 'script', temp_file.name]
        
        # Handle interpreted languages (Python, JS, Ruby, PHP, Go, Swift)
        else:
            temp_file = tempfile.NamedTemporaryFile(
                mode='w', suffix=lang_config['extension'], 
                delete=False, encoding='utf-8', dir=temp_dir
            )
            temp_file.write(code)
            temp_file.close()
            temp_files.append(temp_file.name)
            
            command = lang_config['command'] + [temp_file.name]
        
        # Execute the code
        start_time = time.time()
        
        process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=temp_dir,
            env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'}
        )
        
        result = run_with_timeout(process, lang_config['timeout'], user_input)
        
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
                
    except FileNotFoundError as e:
        # Local runtime not available, try Judge0 API as fallback
        print(f"Local runtime not found for {language}, trying Judge0 API...")
        judge0_result, judge0_error = execute_with_judge0(code, language, user_input)
        if judge0_result:
            return jsonify(judge0_result), 200
        return jsonify({
            'error': f'Runtime for {language} is not available locally, and Judge0 execution failed. Error: {judge0_error}'
        }), 503
    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'output': '',
            'error': 'Compilation timed out',
            'execution_time': 0
        }), 200
    except Exception as e:
        print(f"Execution error: {str(e)}")
        return jsonify({
            'error': f'Execution error: {str(e)}'
        }), 500
    finally:
        # Clean up all temp files
        for f in temp_files:
            try:
                if os.path.exists(f):
                    os.unlink(f)
            except:
                pass


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
