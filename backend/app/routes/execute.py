"""
Code Execution Routes - Sandbox for testing generated code
Uses Piston API for online code execution (supports 50+ languages)
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

# Piston API endpoint (free, no API key required)
PISTON_API_URL = "https://emkc.org/api/v2/piston/execute"

# Language mapping for Piston API (language name -> piston language id and version)
PISTON_LANGUAGES = {
    'python': {'language': 'python', 'version': '3.10.0'},
    'javascript': {'language': 'javascript', 'version': '18.15.0'},
    'typescript': {'language': 'typescript', 'version': '5.0.3'},
    'java': {'language': 'java', 'version': '15.0.2'},
    'cpp': {'language': 'c++', 'version': '10.2.0'},
    'c': {'language': 'c', 'version': '10.2.0'},
    'csharp': {'language': 'csharp', 'version': '6.12.0'},
    'ruby': {'language': 'ruby', 'version': '3.0.1'},
    'go': {'language': 'go', 'version': '1.16.2'},
    'php': {'language': 'php', 'version': '8.2.3'},
    'swift': {'language': 'swift', 'version': '5.3.3'},
    'kotlin': {'language': 'kotlin', 'version': '1.8.20'},
    'rust': {'language': 'rust', 'version': '1.68.2'},
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


def execute_with_piston(code, language, stdin=''):
    """Execute code using Piston API (online code execution)."""
    if language not in PISTON_LANGUAGES:
        return None, f'Language {language} not supported by Piston API'
    
    piston_config = PISTON_LANGUAGES[language]
    
    payload = {
        'language': piston_config['language'],
        'version': piston_config['version'],
        'files': [
            {
                'name': f'main{SUPPORTED_LANGUAGES[language]["extension"]}',
                'content': code
            }
        ],
        'stdin': stdin,
        'compile_timeout': 15000,
        'run_timeout': 15000,
        'compile_memory_limit': -1,
        'run_memory_limit': -1
    }
    
    try:
        print(f"[Piston] Executing {language} code...")
        response = requests.post(
            PISTON_API_URL,
            json=payload,
            timeout=60,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"[Piston] Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"[Piston] Result: {result}")
            
            # Handle compilation errors
            compile_result = result.get('compile')
            if compile_result:
                compile_stderr = compile_result.get('stderr', '')
                compile_code = compile_result.get('code', 0)
                if compile_code != 0 or compile_stderr:
                    return {
                        'success': False,
                        'output': compile_result.get('stdout', ''),
                        'error': f"Compilation error:\n{compile_stderr}" if compile_stderr else "Compilation failed",
                        'execution_time': 0
                    }, None
            
            # Get run results
            run_result = result.get('run', {})
            stdout = run_result.get('stdout', '')
            stderr = run_result.get('stderr', '')
            exit_code = run_result.get('code', 0)
            
            return {
                'success': exit_code == 0,
                'output': stdout[:MAX_OUTPUT_SIZE] if stdout else '',
                'error': stderr[:MAX_OUTPUT_SIZE] if stderr else None,
                'execution_time': 0
            }, None
        else:
            print(f"[Piston] Error response: {response.text}")
            return None, f'Piston API error: {response.status_code}'
            
    except requests.exceptions.Timeout:
        print("[Piston] Request timed out")
        return None, 'Code execution timed out'
    except requests.exceptions.RequestException as e:
        return None, f'API request failed: {str(e)}'


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
    
    # Languages that should use Piston API (compiled languages or those without local runtime)
    use_piston_languages = ['java', 'cpp', 'c', 'csharp', 'ruby', 'go', 'php', 'swift', 'kotlin', 'rust']
    
    # Try Piston API for languages that typically need compilation or lack local runtime
    if language in use_piston_languages:
        piston_result, piston_error = execute_with_piston(code, language, user_input)
        if piston_result:
            return jsonify(piston_result), 200
        # If Piston fails, try local execution as fallback
        print(f"Piston API failed for {language}: {piston_error}, trying local execution...")
    
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
                
    except FileNotFoundError as e:
        # Local runtime not available, try Piston API as fallback
        print(f"Local runtime not found for {language}, trying Piston API...")
        piston_result, piston_error = execute_with_piston(code, language, user_input)
        if piston_result:
            return jsonify(piston_result), 200
        return jsonify({
            'error': f'Runtime for {language} is not available locally, and online execution failed. Error: {piston_error}'
        }), 503
    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'error': 'Compilation timed out',
            'execution_time': 0
        }), 200
    except Exception as e:
        print(f"Execution error: {str(e)}")
        return jsonify({
            'success': False,
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
