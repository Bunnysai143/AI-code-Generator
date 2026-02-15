"""
Gemini Service - Google Gemini API Integration
"""
import google.generativeai as genai
import os
from typing import Dict, Any
import re


class GeminiService:
    """Service class for interacting with Google Gemini Free API."""
    
    _initialized = False
    _model = None
    _current_api_key = None
    
    @classmethod
    def initialize(cls, force=False):
        """Initialize the Gemini API client with API key from environment."""
        api_key = os.getenv('GEMINI_API_KEY')
        
        # Reinitialize if API key changed or forced
        if force or not cls._initialized or cls._current_api_key != api_key:
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
            
            print(f"Initializing Gemini with API key: {api_key[:10]}...")
            genai.configure(api_key=api_key)
            # Use gemini-2.5-flash (free tier)
            cls._model = genai.GenerativeModel('gemini-2.5-flash')
            cls._initialized = True
            cls._current_api_key = api_key
    
    @classmethod
    def generate_code_with_explanation(cls, prompt: str, language: str) -> Dict[str, Any]:
        """
        Generate code with explanation from a natural language prompt.
        
        Args:
            prompt: User's natural language description of desired code
            language: Target programming language
            
        Returns:
            Dictionary containing success status, code, and explanation
        """
        cls.initialize()
        
        # Construct engineered prompt for structured output
        engineered_prompt = f"""You are an expert programming assistant. Generate code based on the following request.

**Request**: {prompt}
**Target Language**: {language}

Please provide your response in EXACTLY this format:

**CODE:**
```{language}
[Your generated code here]
```

**EXPLANATION:**
[Provide a comprehensive detailed explanation of the code including:
- What the code does overall
- Key programming concepts and techniques used
- Step-by-step breakdown of how the logic works
- Important considerations, edge cases, or best practices applied
- Any dependencies or requirements needed]

IMPORTANT CODE REQUIREMENTS:
1. Use ONLY single-line comments in the code (// or # depending on language)
2. Do NOT use multi-line or block comments (/* */ or ''' ''')
3. Keep inline comments brief - the detailed explanation goes in the EXPLANATION section
4. Code must be syntactically correct and follow best practices for {language}
5. Code should be complete and runnable where possible
"""
        
        try:
            response = cls._model.generate_content(engineered_prompt)
            
            if not response or not response.text:
                return {
                    'success': False,
                    'error': 'Empty response received from AI service'
                }
            
            # Parse the response to extract code and explanation
            parsed = cls._parse_response(response.text, language)
            
            return {
                'success': True,
                'code': parsed['code'],
                'explanation': parsed['explanation']
            }
            
        except Exception as e:
            error_message = str(e)
            error_lower = error_message.lower()
            
            print(f"Gemini API Error: {error_message}")  # Log actual error
            
            # Handle rate limiting
            if 'quota' in error_lower or 'rate' in error_lower or '429' in error_message:
                return {
                    'success': False,
                    'error': 'API rate limit reached. Please try again in a few moments.'
                }
            
            # Handle API key issues
            if 'api_key' in error_lower or 'api key' in error_lower or 'invalid' in error_lower or '401' in error_message or '403' in error_message:
                return {
                    'success': False,
                    'error': f'API key error: {error_message}'
                }
            
            # Return actual error for debugging
            return {
                'success': False,
                'error': f'Generation failed: {error_message}'
            }
    
    @classmethod
    def explain_code(cls, code: str, language: str) -> Dict[str, Any]:
        """
        Generate an explanation for existing code.
        
        Args:
            code: The code to explain
            language: Programming language of the code
            
        Returns:
            Dictionary containing success status and explanation
        """
        cls.initialize()
        
        engineered_prompt = f"""You are an expert programming instructor. Explain the following {language} code in detail.

**Code to Explain:**
```{language}
{code}
```

Please provide a comprehensive explanation including:
1. **Overview**: What does this code do overall?
2. **Step-by-Step Breakdown**: Explain each significant part of the code
3. **Key Concepts**: What programming concepts are being used?
4. **Best Practices**: Are there any notable best practices or potential improvements?
5. **Use Cases**: When would someone use code like this?

Make the explanation clear and educational, suitable for someone learning to program.
"""
        
        try:
            response = cls._model.generate_content(engineered_prompt)
            
            if not response or not response.text:
                return {
                    'success': False,
                    'error': 'Empty response received from AI service'
                }
            
            return {
                'success': True,
                'explanation': response.text.strip()
            }
            
        except Exception as e:
            error_message = str(e)
            error_lower = error_message.lower()
            
            print(f"Gemini API Error (explain): {error_message}")
            
            if 'quota' in error_lower or 'rate' in error_lower or '429' in error_message:
                return {
                    'success': False,
                    'error': 'API rate limit reached. Please try again in a few moments.'
                }
            
            return {
                'success': False,
                'error': f'Failed to generate explanation: {error_message}'
            }
    
    @classmethod
    def _parse_response(cls, response_text: str, language: str) -> Dict[str, str]:
        """Parse the AI response to extract code and explanation segments."""
        code = ""
        explanation = ""
        
        # Try to extract code block with regex
        code_pattern = rf"```(?:{language})?\s*\n(.*?)```"
        code_matches = re.findall(code_pattern, response_text, re.DOTALL | re.IGNORECASE)
        
        if code_matches:
            code = code_matches[0].strip()
        else:
            # Fallback: try to find any code block
            if "```" in response_text:
                parts = response_text.split("```")
                if len(parts) >= 3:
                    # Get content between first pair of ```
                    code_block = parts[1]
                    # Remove language identifier if present
                    lines = code_block.split('\n')
                    if lines[0].strip().lower() in ['python', 'javascript', 'java', 'cpp', 'c++', 'c', 'ruby', 'go', 'php', 'typescript', 'csharp', 'c#', 'rust', 'swift', 'kotlin']:
                        code = '\n'.join(lines[1:]).strip()
                    else:
                        code = code_block.strip()
        
        # Extract explanation
        explanation_patterns = [
            r"\*\*EXPLANATION:\*\*\s*(.*)",
            r"EXPLANATION:\s*(.*)",
            r"\*\*Explanation:\*\*\s*(.*)",
            r"Explanation:\s*(.*)"
        ]
        
        for pattern in explanation_patterns:
            match = re.search(pattern, response_text, re.DOTALL | re.IGNORECASE)
            if match:
                explanation = match.group(1).strip()
                break
        
        # Fallback: use text after the last code block as explanation
        if not explanation and "```" in response_text:
            last_code_end = response_text.rfind("```")
            if last_code_end != -1:
                explanation = response_text[last_code_end + 3:].strip()
        
        # If still no explanation, use everything except the code block
        if not explanation:
            explanation = response_text.strip()
        
        return {
            'code': code,
            'explanation': explanation
        }
    
    @classmethod
    def refine_code(cls, original_code: str, language: str, refinement_request: str,
                   conversation_history: list = None, original_prompt: str = '') -> Dict[str, Any]:
        """
        Refine existing code based on user feedback - conversational refinement.
        
        Args:
            original_code: The current code to refine
            language: Programming language
            refinement_request: User's request for changes
            conversation_history: Previous conversation messages
            original_prompt: Original generation prompt
            
        Returns:
            Dictionary containing success status, refined code, explanation, and changes list
        """
        cls.initialize()
        
        # Build conversation context
        context = ""
        if conversation_history:
            for msg in conversation_history[-5:]:  # Limit to last 5 messages
                role = "User" if msg.get('role') == 'user' else "Assistant"
                context += f"{role}: {msg.get('content', '')}\n"
        
        engineered_prompt = f"""You are an expert programming assistant helping to iteratively refine code.

**Original Request**: {original_prompt}

**Current Code** ({language}):
```{language}
{original_code}
```

**Conversation History**:
{context if context else "No previous conversation."}

**New Refinement Request**: {refinement_request}

Please refine the code based on the user's request. Provide your response in EXACTLY this format:

**CHANGES:**
- [List each specific change you made as a bullet point]
- [Be concise but clear about what was modified]

**CODE:**
```{language}
[Your complete refined code here - include the full code, not just changes]
```

**EXPLANATION:**
[Explain what changes were made and why. Be concise but helpful.]

IMPORTANT:
1. Provide the COMPLETE refined code, not just the changes
2. Maintain the original functionality unless asked to change it
3. Use only single-line comments in the code
4. Make sure the code is syntactically correct
5. If the request doesn't make sense or isn't possible, explain why and suggest alternatives
"""
        
        try:
            response = cls._model.generate_content(engineered_prompt)
            
            if not response or not response.text:
                return {
                    'success': False,
                    'error': 'Empty response received from AI service'
                }
            
            response_text = response.text
            
            # Parse the response
            parsed = cls._parse_response(response_text, language)
            
            # Extract changes list
            changes = []
            changes_match = re.search(r"\*\*CHANGES:\*\*\s*(.*?)\*\*CODE:", response_text, re.DOTALL | re.IGNORECASE)
            if changes_match:
                changes_text = changes_match.group(1).strip()
                for line in changes_text.split('\n'):
                    line = line.strip()
                    if line.startswith('- ') or line.startswith('* '):
                        changes.append(line[2:].strip())
            
            return {
                'success': True,
                'code': parsed['code'] if parsed['code'] else original_code,
                'explanation': parsed['explanation'],
                'changes': changes
            }
            
        except Exception as e:
            error_message = str(e)
            error_lower = error_message.lower()
            
            print(f"Gemini API Error (refine): {error_message}")
            
            if 'quota' in error_lower or 'rate' in error_lower or '429' in error_message:
                return {
                    'success': False,
                    'error': 'API rate limit reached. Please try again in a few moments.'
                }
            
            return {
                'success': False,
                'error': f'Failed to refine code: {error_message}'
            }
