# AI-Powered Code Generator with Explanation

## A Full-Stack Web Application Using React, Flask, and MongoDB

---

## 1. ABSTRACT

This project presents the design and implementation of an AI-Powered Code Generator with Explanation, a web-based application that leverages free cloud-based artificial intelligence services to assist developers and learners in generating programming code along with comprehensive explanations. The system employs a modern three-tier architecture comprising a React.js frontend client, a Python Flask backend server, and MongoDB Atlas as the database layer. The core functionality utilizes the Google Gemini Free API to process natural language prompts and produce syntactically correct code snippets accompanied by detailed explanations of the underlying logic and programming concepts.

The application addresses the growing need for accessible programming assistance tools that can bridge the gap between conceptual understanding and practical implementation. By integrating a free-tier AI service, the system ensures accessibility without requiring users to incur API costs or maintain local computational resources. The React-based frontend provides an intuitive user interface for submitting code generation requests, while the Flask backend manages API communication, user authentication, and data persistence. MongoDB Atlas serves as the document-oriented database, storing user profiles, generation history, and code explanations in a flexible schema structure.

The proposed system demonstrates practical application of RESTful API design principles, secure credential management through environment variables, and effective integration of third-party AI services. This project contributes to the domain of educational technology by providing a functional tool that supports both novice programmers seeking to learn through example and experienced developers requiring quick code scaffolding with explanatory context.

---

## 2. INTRODUCTION

The landscape of software development has undergone significant transformation with the emergence of artificial intelligence-powered assistance tools. These systems leverage large language models to interpret natural language descriptions and generate corresponding programming code, thereby reducing the cognitive load on developers and accelerating the development process. However, many existing solutions either require substantial computational resources for local model deployment or mandate subscription fees for cloud-based services, creating barriers to accessibility for students and independent developers.

This project addresses these accessibility concerns by developing a web application that harnesses free-tier AI APIs to deliver code generation and explanation capabilities without financial burden. The Google Gemini API, offered by Google under a free usage tier, provides the foundational AI capabilities for processing user prompts and generating contextually relevant code with accompanying explanations. This approach eliminates the need for local GPU resources, model training, or dataset management, making the system deployable on standard computing hardware.

The architectural design follows established software engineering principles, separating concerns across three distinct layers. The presentation layer, implemented using React.js, delivers a responsive and component-based user interface that communicates with the backend through RESTful API endpoints. The application layer, built with Python Flask, handles business logic, API key management, request validation, and orchestrates communication between the frontend and external AI services. The data layer employs MongoDB Atlas, a cloud-hosted document database, to persist user data and generation history in a flexible, schema-less format suitable for the variable nature of generated content.

This documentation provides a comprehensive overview of the system architecture, implementation details, and deployment considerations, structured to meet the requirements of an academic final-year project submission while maintaining practical applicability for real-world usage scenarios.

---

## 3. PROBLEM STATEMENT

The proliferation of programming education and software development has created a demand for intelligent assistance tools that can help individuals write code more efficiently. However, several challenges impede the accessibility and effectiveness of existing solutions:

**Accessibility Barriers in AI-Powered Tools**: Many contemporary code generation tools rely on proprietary APIs that require paid subscriptions or consumption-based billing. This pricing model creates financial barriers for students, hobbyists, and developers in resource-constrained environments who could benefit significantly from AI-assisted programming.

**Complexity of Local Model Deployment**: Open-source language models capable of code generation typically require substantial computational resources, including high-performance GPUs and significant memory allocations. The technical expertise required to configure, deploy, and maintain such systems places them beyond the reach of many potential users who lack specialized hardware or system administration skills.

**Lack of Explanatory Context**: While code generation itself provides immediate utility, the absence of accompanying explanations limits the educational value of such tools. Users receive code snippets without understanding the underlying logic, design decisions, or programming concepts, thereby missing opportunities for skill development and knowledge acquisition.

**Fragmented User Experience**: Existing solutions often lack integrated history tracking and user management features, requiring users to maintain external records of their queries and generated outputs. This fragmentation reduces productivity and complicates the process of revisiting or refining previous code generation sessions.

**Security Concerns in API Integration**: Many implementations expose API credentials in client-side code or fail to implement proper security measures, creating vulnerabilities that could lead to credential theft or service abuse.

The proposed system addresses these challenges by providing a secure, free-to-use, explanation-inclusive code generation platform that combines ease of access with educational value.

---

## 4. PROPOSED SOLUTION

The proposed solution is a web-based AI-Powered Code Generator with Explanation that utilizes exclusively free-tier services to deliver accessible programming assistance. The system architecture integrates the Google Gemini Free API as the primary AI service provider, ensuring that users can access code generation capabilities without incurring costs or requiring credit card registration.

### 4.1 Solution Overview

The application operates as a three-tier web system where users interact with a React.js frontend to submit natural language descriptions of desired code functionality. These requests are transmitted to a Python Flask backend server via RESTful API calls. The Flask server processes incoming requests, appends appropriate prompt engineering context, and forwards the enhanced queries to the Google Gemini Free API. Upon receiving the AI-generated response, the backend parses the output to separate code content from explanatory text, stores the interaction in MongoDB Atlas, and returns the structured response to the frontend for display.

### 4.2 Utilization of Free AI API (Google Gemini)

The Google Gemini API provides a generous free tier that supports the operational requirements of this project without financial commitment. The Gemini API offers the following advantages for this implementation:

- **Zero-Cost Access**: The free tier provides sufficient API calls per minute and per day to support individual and small-group usage patterns typical of educational and personal development contexts.

- **No Credit Card Requirement**: Unlike many AI APIs that require payment method registration even for free tiers, the Gemini API can be accessed with a standard Google account, reducing barriers to initial setup.

- **High-Quality Output**: The Gemini model family demonstrates competent performance in code generation tasks across multiple programming languages, producing syntactically correct and logically sound code snippets.

- **Explanation Capability**: The model can generate not only code but also detailed explanations of the generated content when prompted appropriately, serving the educational objectives of this project.

The backend implementation includes prompt engineering techniques that structure requests to the Gemini API in a manner that elicits both code generation and explanatory content. Rate limiting and error handling mechanisms are incorporated to gracefully manage API quota constraints inherent to free-tier usage.

### 4.3 Technology Stack Summary

| Layer | Technology | Justification |
|-------|------------|---------------|
| Frontend | React.js | Component-based architecture, virtual DOM efficiency, extensive ecosystem |
| Backend | Python Flask | Lightweight framework, Python AI library compatibility, RESTful design |
| Database | MongoDB Atlas | Free tier availability, document flexibility, JSON-native storage |
| AI Service | Google Gemini Free API | Zero cost, no local compute requirements, quality output |

---

## 5. SYSTEM ARCHITECTURE

The system follows a layered architecture pattern that separates concerns across presentation, application, and data tiers. This design promotes modularity, maintainability, and scalability while enabling independent development and testing of each layer.

### 5.1 Architectural Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                                   │
│                                                                          │
│    ┌──────────────────────────────────────────────────────────────┐     │
│    │                    REACT.JS CLIENT                            │     │
│    │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐  │     │
│    │  │   Login    │  │   Code     │  │      History           │  │     │
│    │  │ Component  │  │  Editor    │  │      Viewer            │  │     │
│    │  └────────────┘  └────────────┘  └────────────────────────┘  │     │
│    │                                                               │     │
│    │  ┌────────────────────────────────────────────────────────┐  │     │
│    │  │              API Service Layer (Axios)                  │  │     │
│    │  └────────────────────────────────────────────────────────┘  │     │
│    └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/REST
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLASK BACKEND SERVER                             │
│                                                                          │
│    ┌──────────────────────────────────────────────────────────────┐     │
│    │                    API ROUTES LAYER                           │     │
│    │  /api/auth/*  │  /api/generate  │  /api/history  │  /api/explain   │
│    └──────────────────────────────────────────────────────────────┘     │
│                                    │                                     │
│    ┌──────────────────────────────────────────────────────────────┐     │
│    │                   SERVICE LAYER                               │     │
│    │  ┌────────────┐  ┌────────────────┐  ┌──────────────────┐    │     │
│    │  │  Auth      │  │  Gemini        │  │   Database       │    │     │
│    │  │  Service   │  │  Service       │  │   Service        │    │     │
│    │  └────────────┘  └────────────────┘  └──────────────────┘    │     │
│    └──────────────────────────────────────────────────────────────┘     │
│                                    │                                     │
│    ┌──────────────────────────────────────────────────────────────┐     │
│    │              CONFIGURATION (.env)                             │     │
│    │  GEMINI_API_KEY  │  MONGODB_URI  │  SECRET_KEY               │     │
│    └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
            │                                           │
            │ HTTPS                                     │ MongoDB Protocol
            ▼                                           ▼
┌───────────────────────────┐               ┌───────────────────────────┐
│   GOOGLE GEMINI API       │               │    MONGODB ATLAS          │
│   (Free Tier)             │               │    (Free Tier M0)         │
│                           │               │                           │
│   - Code Generation       │               │   Collections:            │
│   - Explanation           │               │   - users                 │
│   - Multi-language        │               │   - code_generations      │
│                           │               │   - explanations          │
│                           │               │   - history               │
└───────────────────────────┘               └───────────────────────────┘
```

### 5.2 Request Flow

The typical request flow for a code generation operation proceeds as follows:

1. **User Input**: The user enters a natural language description of desired code functionality in the React frontend interface.

2. **Frontend Validation**: The React client performs preliminary validation of the input, checking for empty submissions and enforcing character limits.

3. **API Request**: The frontend's API service layer constructs an HTTP POST request containing the user's prompt and desired programming language, then transmits this request to the Flask backend.

4. **Backend Processing**: The Flask server receives the request through the `/api/generate` route. The authentication middleware verifies the user's JWT token, and the request handler extracts the prompt content.

5. **Prompt Engineering**: The Gemini service module constructs an enhanced prompt that instructs the AI model to generate both code and a comprehensive explanation. This prompt includes formatting directives to ensure consistent, parseable output.

6. **External API Call**: The backend transmits the engineered prompt to the Google Gemini Free API using the API key stored in environment variables.

7. **Response Processing**: Upon receiving the Gemini API response, the backend parses the content to extract the code segment and explanation segment separately. Error handling captures any API failures or malformed responses.

8. **Data Persistence**: The interaction is recorded in the MongoDB Atlas database, storing the original prompt, generated code, explanation, timestamp, and user identifier.

9. **Response Delivery**: The structured response containing code and explanation is returned to the React frontend via the HTTP response.

10. **Display Rendering**: The frontend renders the code in a syntax-highlighted code block and displays the explanation in a formatted text section.

### 5.3 Security Architecture

Security considerations are addressed at multiple levels:

- **API Key Protection**: The Gemini API key is stored exclusively in server-side environment variables and is never transmitted to or accessible by the frontend client.

- **Authentication**: User authentication employs JSON Web Tokens (JWT) with appropriate expiration policies, preventing unauthorized access to user-specific features.

- **Input Sanitization**: All user inputs are sanitized on the backend before processing to prevent injection attacks.

- **HTTPS Communication**: All communication between client and server, as well as between server and external APIs, occurs over encrypted HTTPS connections.

---

## 6. FRONTEND DESIGN (React Client)

The frontend is implemented as a single-page application using React.js, providing a responsive and interactive user experience. The component-based architecture facilitates code reuse, testing, and maintenance.

### 6.1 Component Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── AuthContext.jsx
│   ├── CodeGenerator/
│   │   ├── PromptInput.jsx
│   │   ├── LanguageSelector.jsx
│   │   ├── CodeOutput.jsx
│   │   └── ExplanationPanel.jsx
│   ├── History/
│   │   ├── HistoryList.jsx
│   │   └── HistoryItem.jsx
│   ├── Common/
│   │   ├── Navbar.jsx
│   │   ├── Loading.jsx
│   │   └── ErrorBoundary.jsx
│   └── Layout/
│       └── MainLayout.jsx
├── services/
│   └── api.js
├── hooks/
│   ├── useAuth.js
│   └── useCodeGeneration.js
├── utils/
│   └── validators.js
├── App.jsx
└── index.jsx
```

### 6.2 Key Components Description

**PromptInput Component**: This component provides a multi-line text area for users to enter their natural language code descriptions. It includes character counting, placeholder text with example prompts, and submission button. The component maintains local state for the input value and triggers the code generation process upon form submission.

**LanguageSelector Component**: A dropdown component that allows users to specify the target programming language for code generation. Supported languages include Python, JavaScript, Java, C++, and others commonly used in educational contexts. The selected language is included in the API request to guide the AI model's output.

**CodeOutput Component**: Displays the generated code using a syntax-highlighted code block. This component integrates a code highlighting library to render the output with appropriate language-specific formatting. A copy-to-clipboard button facilitates easy transfer of generated code to external editors.

**ExplanationPanel Component**: Renders the AI-generated explanation in a readable format. The component parses the explanation text and applies formatting for improved readability, including paragraph separation and bullet point rendering where applicable.

**HistoryList Component**: Retrieves and displays the user's previous code generation requests. Each history item shows a truncated version of the original prompt, the generation timestamp, and the target language. Clicking a history item navigates to a detailed view of that generation.

### 6.3 API Service Layer

The frontend communicates with the Flask backend through a centralized API service module. This module utilizes Axios for HTTP request handling and implements the following functionality:

```javascript
// services/api.js - Conceptual Structure

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
};

export const codeAPI = {
  generate: (prompt, language) => apiClient.post('/generate', { prompt, language }),
  getHistory: () => apiClient.get('/history'),
  getGeneration: (id) => apiClient.get(`/history/${id}`),
};

export const explainAPI = {
  explainCode: (code, language) => apiClient.post('/explain', { code, language }),
};
```

### 6.4 State Management

The application employs React's Context API for global state management, avoiding the complexity of external state management libraries for this scope of application. The AuthContext provides authentication state throughout the component tree, while component-level state handles local UI concerns.

### 6.5 User Interface Design Principles

The frontend design adheres to the following principles:

- **Simplicity**: The interface presents focused functionality without overwhelming users with options. The primary code generation feature is immediately accessible upon login.

- **Responsiveness**: CSS flexbox and grid layouts ensure the application renders appropriately across desktop and mobile viewports.

- **Feedback**: Loading indicators, success messages, and error notifications provide users with clear feedback regarding the status of their requests.

- **Accessibility**: Semantic HTML elements and appropriate ARIA labels support screen reader compatibility and keyboard navigation.

---

## 7. BACKEND IMPLEMENTATION (Flask)

The backend server is implemented using Python Flask, providing a lightweight yet capable foundation for RESTful API development. Flask's minimalist design philosophy allows for focused implementation without unnecessary framework overhead.

### 7.1 Application Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── generate.py
│   │   ├── history.py
│   │   └── explain.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── gemini_service.py
│   │   ├── auth_service.py
│   │   └── db_service.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── generation.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── auth_middleware.py
│   └── utils/
│       ├── __init__.py
│       ├── validators.py
│       └── response_helpers.py
├── .env
├── .env.example
├── requirements.txt
└── run.py
```

### 7.2 Flask Routes Implementation

**Authentication Routes (`/api/auth/`)**:

```python
# routes/auth.py - Conceptual Implementation

from flask import Blueprint, request, jsonify
from services.auth_service import AuthService
from utils.validators import validate_registration, validate_login

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user account."""
    data = request.get_json()
    
    # Validate input
    validation_error = validate_registration(data)
    if validation_error:
        return jsonify({'error': validation_error}), 400
    
    # Attempt registration
    result = AuthService.register_user(
        email=data['email'],
        password=data['password'],
        name=data.get('name', '')
    )
    
    if result['success']:
        return jsonify({
            'message': 'Registration successful',
            'token': result['token']
        }), 201
    else:
        return jsonify({'error': result['error']}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token."""
    data = request.get_json()
    
    validation_error = validate_login(data)
    if validation_error:
        return jsonify({'error': validation_error}), 400
    
    result = AuthService.authenticate_user(
        email=data['email'],
        password=data['password']
    )
    
    if result['success']:
        return jsonify({
            'message': 'Login successful',
            'token': result['token'],
            'user': result['user']
        }), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401
```

**Code Generation Route (`/api/generate`)**:

```python
# routes/generate.py - Conceptual Implementation

from flask import Blueprint, request, jsonify
from middleware.auth_middleware import require_auth
from services.gemini_service import GeminiService
from services.db_service import DatabaseService
import time

generate_bp = Blueprint('generate', __name__, url_prefix='/api')

@generate_bp.route('/generate', methods=['POST'])
@require_auth
def generate_code(current_user):
    """Generate code from natural language prompt using Gemini API."""
    data = request.get_json()
    
    # Validate required fields
    if not data or 'prompt' not in data:
        return jsonify({'error': 'Prompt is required'}), 400
    
    prompt = data['prompt'].strip()
    language = data.get('language', 'python')
    
    # Validate prompt length
    if len(prompt) < 10:
        return jsonify({'error': 'Prompt too short'}), 400
    if len(prompt) > 2000:
        return jsonify({'error': 'Prompt exceeds maximum length'}), 400
    
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
            explanation=result['explanation'],
            timestamp=time.time()
        )
        
        return jsonify({
            'id': generation_id,
            'code': result['code'],
            'explanation': result['explanation'],
            'language': language
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'An error occurred during code generation'}), 500
```

### 7.3 Gemini Service Implementation

The Gemini service module encapsulates all interactions with the Google Gemini Free API:

```python
# services/gemini_service.py - Conceptual Implementation

import google.generativeai as genai
import os
from typing import Dict, Any

class GeminiService:
    """Service class for interacting with Google Gemini Free API."""
    
    _initialized = False
    _model = None
    
    @classmethod
    def initialize(cls):
        """Initialize the Gemini API client with API key from environment."""
        if not cls._initialized:
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
            
            genai.configure(api_key=api_key)
            cls._model = genai.GenerativeModel('gemini-pro')
            cls._initialized = True
    
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
        engineered_prompt = f"""
You are an expert programming assistant. Generate code based on the following request.

**Request**: {prompt}
**Target Language**: {language}

Please provide your response in the following format:

**CODE:**
```{language}
[Your generated code here]
```

**EXPLANATION:**
[Detailed explanation of the code, including:
- What the code does
- Key programming concepts used
- How the logic works step by step
- Any important considerations or best practices applied]

Ensure the code is:
1. Syntactically correct
2. Well-commented
3. Following best practices for {language}
4. Complete and runnable where possible
"""
        
        try:
            response = cls._model.generate_content(engineered_prompt)
            
            if not response or not response.text:
                return {
                    'success': False,
                    'error': 'Empty response received from AI service'
                }
            
            # Parse the response to extract code and explanation
            parsed = cls._parse_response(response.text)
            
            return {
                'success': True,
                'code': parsed['code'],
                'explanation': parsed['explanation']
            }
            
        except Exception as e:
            error_message = str(e)
            
            # Handle rate limiting
            if 'quota' in error_message.lower() or 'rate' in error_message.lower():
                return {
                    'success': False,
                    'error': 'API rate limit reached. Please try again in a few moments.'
                }
            
            return {
                'success': False,
                'error': 'Failed to generate code. Please try again.'
            }
    
    @classmethod
    def _parse_response(cls, response_text: str) -> Dict[str, str]:
        """Parse the AI response to extract code and explanation segments."""
        code = ""
        explanation = ""
        
        # Extract code block
        if "```" in response_text:
            code_start = response_text.find("```")
            code_end = response_text.find("```", code_start + 3)
            if code_end > code_start:
                code_block = response_text[code_start:code_end + 3]
                # Remove language identifier from code block
                lines = code_block.split('\n')
                if len(lines) > 2:
                    code = '\n'.join(lines[1:-1])
        
        # Extract explanation
        if "**EXPLANATION:**" in response_text:
            explanation = response_text.split("**EXPLANATION:**")[1].strip()
        elif "EXPLANATION:" in response_text:
            explanation = response_text.split("EXPLANATION:")[1].strip()
        else:
            # Fallback: use text after code block as explanation
            if "```" in response_text:
                last_code_block = response_text.rfind("```")
                explanation = response_text[last_code_block + 3:].strip()
        
        return {
            'code': code.strip(),
            'explanation': explanation.strip()
        }
```

### 7.4 Request/Response Flow Details

**Request Processing Pipeline**:

1. **CORS Handling**: The Flask application is configured with Flask-CORS to accept requests from the React frontend origin.

2. **JSON Parsing**: The `request.get_json()` method parses incoming JSON request bodies.

3. **Authentication Verification**: The `@require_auth` decorator extracts and validates JWT tokens from the Authorization header.

4. **Input Validation**: Request data is validated for required fields, data types, and constraint compliance.

5. **Service Invocation**: Validated requests are passed to appropriate service classes for processing.

6. **Response Formatting**: Service results are formatted as JSON responses with appropriate HTTP status codes.

**Response Structure Standards**:

```python
# Successful response
{
    "id": "generation_id",
    "code": "def hello():\n    print('Hello')",
    "explanation": "This function prints a greeting...",
    "language": "python"
}

# Error response
{
    "error": "Description of what went wrong"
}
```

### 7.5 Error Handling Strategy

The backend implements comprehensive error handling:

```python
# utils/response_helpers.py

from flask import jsonify

def error_response(message: str, status_code: int = 400):
    """Create standardized error response."""
    return jsonify({'error': message}), status_code

def success_response(data: dict, status_code: int = 200):
    """Create standardized success response."""
    return jsonify(data), status_code

# Global error handlers in app/__init__.py

@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Authentication required'}), 401

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(429)
def rate_limit_exceeded(error):
    return jsonify({'error': 'Too many requests. Please wait before trying again.'}), 429

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
```

### 7.6 Rate Limit Handling

Given the constraints of free-tier API usage, the backend implements rate limiting awareness:

```python
# middleware/rate_limiter.py

from flask import request, jsonify
import time

class RateLimiter:
    """Simple in-memory rate limiter for API endpoints."""
    
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}  # user_id -> [(timestamp, ...)]
    
    def is_allowed(self, user_id: str) -> bool:
        """Check if user is within rate limits."""
        current_time = time.time()
        
        if user_id not in self.requests:
            self.requests[user_id] = []
        
        # Remove expired timestamps
        self.requests[user_id] = [
            ts for ts in self.requests[user_id]
            if current_time - ts < self.window_seconds
        ]
        
        if len(self.requests[user_id]) >= self.max_requests:
            return False
        
        self.requests[user_id].append(current_time)
        return True
```

---

## 8. DATABASE DESIGN (MongoDB)

MongoDB Atlas Free Tier (M0 cluster) serves as the database layer for this application. The selection of MongoDB is justified by several factors relevant to this project's requirements.

### 8.1 Justification for MongoDB Selection

**Document-Oriented Structure**: The data entities in this application, particularly code generations and explanations, have variable structures that benefit from MongoDB's schema-flexible document model. Generated code length, explanation depth, and metadata can vary significantly between requests, making a rigid relational schema less suitable.

**JSON-Native Storage**: Since both the React frontend and Flask backend communicate using JSON, MongoDB's native JSON document storage (BSON) eliminates the need for object-relational mapping and simplifies data flow throughout the application.

**Free Tier Availability**: MongoDB Atlas provides a free M0 cluster with 512MB storage, which is sufficient for a prototype or small-scale deployment. This aligns with the project's emphasis on free-tier services.

**Ease of Integration**: The PyMongo library provides straightforward integration between Flask and MongoDB, with intuitive query syntax that mirrors the document structure.

**Horizontal Scalability**: While not a primary concern for this project's scope, MongoDB's scaling capabilities provide a growth path if the application's usage expands.

### 8.2 Collection Schemas

**Users Collection**:

```javascript
// Collection: users
{
    "_id": ObjectId("..."),
    "email": "user@example.com",
    "password_hash": "$2b$12$...",  // bcrypt hashed
    "name": "User Name",
    "created_at": ISODate("2026-01-15T10:30:00Z"),
    "last_login": ISODate("2026-02-09T08:45:00Z"),
    "preferences": {
        "default_language": "python",
        "theme": "dark"
    }
}
```

The users collection stores authentication credentials and user preferences. Passwords are stored as bcrypt hashes to ensure security. The email field is indexed for efficient lookup during authentication.

**Code Generations Collection**:

```javascript
// Collection: code_generations
{
    "_id": ObjectId("..."),
    "user_id": ObjectId("..."),  // Reference to users collection
    "prompt": "Create a function that sorts a list of numbers",
    "language": "python",
    "generated_code": "def sort_numbers(numbers):\n    return sorted(numbers)",
    "created_at": ISODate("2026-02-09T14:20:00Z"),
    "execution_time_ms": 1250,
    "success": true,
    "model_version": "gemini-pro"
}
```

The code_generations collection stores each code generation request and its output. The user_id field enables filtering by user for history retrieval. Execution time is recorded for performance monitoring.

**Explanations Collection**:

```javascript
// Collection: explanations
{
    "_id": ObjectId("..."),
    "generation_id": ObjectId("..."),  // Reference to code_generations
    "explanation_text": "This function takes a list of numbers...",
    "key_concepts": ["sorting", "built-in functions", "return values"],
    "complexity_level": "beginner",
    "created_at": ISODate("2026-02-09T14:20:02Z")
}
```

The explanations collection stores detailed explanations separately from code generations, allowing for independent querying and potential future expansion of explanation metadata.

**History Collection**:

```javascript
// Collection: history
{
    "_id": ObjectId("..."),
    "user_id": ObjectId("..."),
    "generation_id": ObjectId("..."),
    "action_type": "generate",  // generate, explain, copy, export
    "timestamp": ISODate("2026-02-09T14:20:00Z"),
    "metadata": {
        "language": "python",
        "prompt_preview": "Create a function that sorts..."
    }
}
```

The history collection provides a time-ordered log of user activities, enabling features such as recent activity display and usage analytics.

### 8.3 Database Service Implementation

```python
# services/db_service.py - Conceptual Implementation

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
    
    @classmethod
    def get_db(cls):
        """Get database instance."""
        cls.initialize()
        return cls._db
    
    @classmethod
    def save_generation(cls, user_id: str, prompt: str, language: str,
                       code: str, explanation: str, timestamp: float) -> str:
        """Save a code generation to the database."""
        db = cls.get_db()
        
        # Insert code generation
        generation_result = db.code_generations.insert_one({
            'user_id': ObjectId(user_id),
            'prompt': prompt,
            'language': language,
            'generated_code': code,
            'created_at': datetime.fromtimestamp(timestamp),
            'success': True
        })
        
        generation_id = generation_result.inserted_id
        
        # Insert explanation
        db.explanations.insert_one({
            'generation_id': generation_id,
            'explanation_text': explanation,
            'created_at': datetime.fromtimestamp(timestamp)
        })
        
        # Add to history
        db.history.insert_one({
            'user_id': ObjectId(user_id),
            'generation_id': generation_id,
            'action_type': 'generate',
            'timestamp': datetime.fromtimestamp(timestamp),
            'metadata': {
                'language': language,
                'prompt_preview': prompt[:100]
            }
        })
        
        return str(generation_id)
    
    @classmethod
    def get_user_history(cls, user_id: str, limit: int = 20) -> list:
        """Retrieve user's generation history."""
        db = cls.get_db()
        
        history = db.history.find(
            {'user_id': ObjectId(user_id)}
        ).sort('timestamp', -1).limit(limit)
        
        return list(history)
```

### 8.4 Indexing Strategy

The following indexes are created to optimize common query patterns:

```python
# Database initialization script
db.users.create_index('email', unique=True)
db.code_generations.create_index('user_id')
db.code_generations.create_index('created_at')
db.history.create_index([('user_id', 1), ('timestamp', -1)])
db.explanations.create_index('generation_id')
```

---

## 9. API & ENVIRONMENT CONFIGURATION

Proper configuration management is essential for security and deployment flexibility. This section details the configuration approach used in the application.

### 9.1 Environment Variables (.env)

The application uses environment variables for all sensitive configuration values. This approach ensures that credentials are never committed to version control and can be easily changed across deployment environments.

**Backend .env File Structure**:

```
# .env.example - Template for configuration

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=your-secret-key-here-change-in-production

# Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/code_generator?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ACCESS_TOKEN_EXPIRES=3600

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

**Frontend .env File Structure**:

```
# React frontend .env.example

REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=AI Code Generator
```

### 9.2 Configuration Loading

```python
# app/config.py

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration class."""
    
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    DEBUG = os.getenv('FLASK_DEBUG', '0') == '1'
    
    # Database settings
    MONGODB_URI = os.getenv('MONGODB_URI')
    
    # API settings
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    
    # JWT settings
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))
    
    # CORS settings
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    
    @classmethod
    def validate(cls):
        """Validate that required configuration is present."""
        required = ['MONGODB_URI', 'GEMINI_API_KEY']
        missing = [key for key in required if not getattr(cls, key)]
        
        if missing:
            raise ValueError(f"Missing required configuration: {', '.join(missing)}")
```

### 9.3 API Key Security

The following security measures protect API credentials:

1. **Server-Side Storage Only**: The Gemini API key is stored exclusively in the Flask backend's environment variables. It is never transmitted to the frontend or included in API responses.

2. **Environment Variable Injection**: In production deployments, environment variables are injected by the hosting platform rather than stored in files.

3. **Git Ignore Configuration**: The `.env` file is added to `.gitignore` to prevent accidental commits of credentials.

4. **Access Logging**: API key usage is logged (without exposing the key itself) to monitor for unusual patterns that might indicate compromise.

### 9.4 Requirements.txt

The Python dependencies are specified in `requirements.txt`:

```
# requirements.txt

# Web Framework
Flask==3.0.0
flask-cors==4.0.0

# Authentication
PyJWT==2.8.0
bcrypt==4.1.2

# Database
pymongo==4.6.1

# Google Gemini API
google-generativeai==0.3.2

# Environment Management
python-dotenv==1.0.0

# Request Validation
marshmallow==3.20.1

# Production Server
gunicorn==21.2.0
```

**Dependency Explanations**:

- **Flask**: Lightweight WSGI web application framework for Python, providing routing, request handling, and response generation.

- **flask-cors**: Extension for handling Cross-Origin Resource Sharing (CORS), enabling the React frontend to communicate with the Flask backend.

- **PyJWT**: Library for encoding and decoding JSON Web Tokens, used for user authentication.

- **bcrypt**: Secure password hashing library implementing the bcrypt algorithm.

- **pymongo**: Official MongoDB driver for Python, providing database connectivity.

- **google-generativeai**: Official Google library for accessing the Gemini API.

- **python-dotenv**: Library for loading environment variables from .env files during development.

- **marshmallow**: Object serialization and validation library for ensuring request data integrity.

- **gunicorn**: Production-grade WSGI HTTP server for deploying Flask applications.

### 9.5 Localhost Deployment

**Backend Deployment Steps**:

```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate virtual environment (Windows)
.\venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file with required variables
copy .env.example .env
# Edit .env with actual values

# 5. Run development server
python run.py
```

**Frontend Deployment Steps**:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env file
copy .env.example .env
# Edit if needed

# 4. Start development server
npm start
```

### 9.6 Optional Free Cloud Deployment

For extended testing or demonstration purposes, the application can be deployed to free-tier cloud platforms:

- **Backend**: Render (free tier) or Railway (limited free tier) can host the Flask application.
- **Frontend**: Vercel or Netlify offer free hosting for React applications.
- **Database**: MongoDB Atlas M0 cluster provides free cloud database hosting.

---

## 10. KEY FEATURES

The AI-Powered Code Generator with Explanation provides the following key features:

**Natural Language Code Generation**: Users can describe desired functionality in plain English, and the system generates corresponding code in the specified programming language. This feature democratizes programming by lowering the barrier for those who understand concepts but struggle with syntax.

**Comprehensive Code Explanations**: Unlike simple code generators, this system provides detailed explanations accompanying each generated code snippet. Explanations cover the purpose of the code, key programming concepts utilized, step-by-step logic description, and relevant best practices.

**Multi-Language Support**: The system supports code generation in multiple programming languages, including Python, JavaScript, Java, C++, C#, Ruby, Go, and PHP. Users can select their target language based on project requirements or learning objectives.

**Generation History Tracking**: All code generation requests are saved to the user's history, enabling easy reference to previous queries. Users can revisit past generations to continue work or review explanations.

**User Authentication**: Secure user registration and login functionality ensures that generation history is private and personalized. JWT-based authentication provides stateless session management.

**Copy-to-Clipboard Functionality**: Generated code can be copied with a single click, facilitating quick transfer to external development environments.

**Responsive User Interface**: The React frontend adapts to various screen sizes, providing a consistent experience across desktop and mobile devices.

**Rate-Limit Awareness**: The system gracefully handles API rate limits, providing clear feedback when limits are reached and suggesting appropriate wait times.

---

## 11. SUPPORTED USE CASES

The application addresses several practical use cases within educational and development contexts:

**Learning Programming Concepts**: Students can describe a programming concept they wish to understand and receive both code examples and explanations. This supports active learning by connecting theoretical knowledge to practical implementation.

**Homework Assistance**: When stuck on programming assignments, students can describe their problem and receive guidance in the form of code and explanations. The explanatory component encourages understanding rather than mere copying.

**Rapid Prototyping**: Developers can quickly generate boilerplate code or implement standard algorithms without writing from scratch. The time saved can be redirected to more complex aspects of their projects.

**Syntax Reference**: When working in unfamiliar languages, developers can describe operations they know how to perform in their primary language and receive equivalent implementations in the target language.

**Code Review Preparation**: By generating explanations for existing code logic, users can prepare for code reviews by understanding what different components of their codebase accomplish.

**Interview Preparation**: Users preparing for technical interviews can practice by requesting implementations of common algorithms and data structures, then study the explanations to deepen their understanding.

**Teaching and Tutoring**: Instructors can use the system to generate example code and explanations for teaching materials, reducing preparation time while ensuring explanations are comprehensive.

---

## 12. EXPECTED OUTCOMES

The implementation of this project is expected to achieve the following outcomes:

**Functional Web Application**: A complete, deployable web application that successfully integrates React frontend, Flask backend, MongoDB database, and Gemini AI API to provide code generation with explanation capabilities.

**Accessible Programming Assistance**: A tool that provides AI-powered programming assistance without financial barriers, demonstrating that useful applications can be built using free-tier services.

**Educational Value**: A system that produces not only code but also educational content, helping users learn programming concepts through practical examples with explanations.

**Practical Full-Stack Development Experience**: Completion of a project encompassing frontend development, backend API design, database integration, third-party API consumption, and deployment considerations.

**Documented Architecture**: Comprehensive documentation of system architecture, implementation decisions, and deployment procedures suitable for academic submission and future maintenance.

**Usable Prototype**: A functioning prototype that can be demonstrated during academic evaluation, showcasing the integration of modern web technologies with AI services.

It is important to note that outcomes are contingent on the availability and performance of the Google Gemini Free API. The quality of generated code will reflect the capabilities and limitations of the underlying AI model.

---

## 13. LIMITATIONS

The system is subject to several limitations that should be acknowledged:

**API Rate Limits**: The Google Gemini Free API imposes usage limits on requests per minute and per day. Under heavy usage, users may encounter rate limiting, requiring them to wait before making additional requests. This constraint is inherent to free-tier API usage.

**AI Model Limitations**: The generated code quality depends on the Gemini model's capabilities. Complex or highly specialized requests may yield imperfect results. The model may occasionally produce code with logical errors, outdated syntax, or suboptimal implementations.

**No Code Execution**: The system generates code but does not execute it. Users must test generated code in their own development environments to verify correctness.

**Limited Context Awareness**: Each code generation request is processed independently without awareness of previous requests or the user's broader project context. This may result in inconsistencies when generating related code segments.

**Internet Dependency**: The application requires internet connectivity to communicate with both the backend server and the Gemini API. Offline usage is not supported.

**Free Tier Storage Constraints**: MongoDB Atlas M0 cluster provides 512MB of storage. Extended usage or large-scale deployment would require upgrading to paid tiers.

**Single Language Output**: Each request generates code in one programming language. Simultaneous multi-language output is not supported.

**No Real-Time Collaboration**: The current implementation does not support multi-user collaboration on the same code generation session.

---

## 14. FUTURE ENHANCEMENTS

The following enhancements could extend the system's capabilities in future iterations:

**Code Execution Sandbox**: Integration of a sandboxed code execution environment would allow users to test generated code directly within the application, providing immediate feedback on correctness.

**Conversation Context**: Implementing session-based context retention would enable users to iteratively refine code by referring to previous generations within the same session.

**Code Quality Analysis**: Static analysis tools could be integrated to evaluate generated code for common issues, providing quality metrics alongside the AI output.

**Export Functionality**: Features to export generated code to files or directly to GitHub repositories would streamline the workflow for developers.

**Additional AI Providers**: Support for multiple free AI APIs could provide redundancy and allow comparison of outputs from different models.

**Collaborative Features**: Real-time collaboration capabilities would enable multiple users to work together on code generation sessions.

**Mobile Application**: Native mobile applications for iOS and Android could provide optimized experiences for on-the-go usage.

**Offline Caching**: Caching previous generations locally would provide limited offline access to historical content.

**Custom Templates**: Users could define templates for common code patterns, pre-filling portions of the prompt for frequently needed structures.

**Accessibility Improvements**: Enhanced screen reader support, keyboard navigation, and high-contrast themes would improve accessibility for users with disabilities.

---

## 15. CONCLUSION

This project presents the design and implementation of an AI-Powered Code Generator with Explanation, a web application that leverages free-tier cloud services to deliver accessible programming assistance. By utilizing the Google Gemini Free API, the system eliminates the computational and financial barriers typically associated with AI-powered development tools.

The three-tier architecture comprising React frontend, Flask backend, and MongoDB database demonstrates practical application of modern web development practices while maintaining simplicity appropriate for an academic project. The system successfully integrates these components to provide a seamless user experience from prompt input through code generation to explanation display and history management.

The emphasis on explanation alongside code generation distinguishes this project from simple code completion tools, providing educational value that supports learning rather than mere task completion. Users gain insight into programming concepts through contextual explanations that accompany each generated code segment.

While the system is subject to limitations inherent in free-tier API usage, it successfully demonstrates that meaningful AI-powered applications can be developed without significant resource investment. The project provides practical experience in full-stack development, API integration, and deployment considerations that are valuable for aspiring software professionals.

The documented architecture and modular code structure support future enhancements and serve as a foundation for more advanced implementations. The project fulfills its objectives of providing accessible code generation with educational explanations using exclusively free services.

---

## 16. KEYWORDS

Artificial Intelligence, Code Generation, Natural Language Processing, React.js, Python Flask, MongoDB, Google Gemini API, RESTful API, Web Application, Free-Tier Services, Educational Technology, Full-Stack Development, Explanation Generation, Programming Assistance, JavaScript, NoSQL Database, JWT Authentication, Environment Configuration, API Integration, Component-Based Architecture

---

## APPENDIX A: API Endpoint Reference

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | /api/auth/register | Register new user | None |
| POST | /api/auth/login | User login | None |
| POST | /api/auth/logout | User logout | Required |
| POST | /api/generate | Generate code with explanation | Required |
| POST | /api/explain | Explain existing code | Required |
| GET | /api/history | Get user's generation history | Required |
| GET | /api/history/:id | Get specific generation details | Required |
| DELETE | /api/history/:id | Delete history item | Required |

---

## APPENDIX B: Sample API Requests and Responses

**Code Generation Request**:
```json
POST /api/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
    "prompt": "Create a function that checks if a number is prime",
    "language": "python"
}
```

**Code Generation Response**:
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "code": "def is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n ** 0.5) + 1):\n        if n % i == 0:\n            return False\n    return True",
    "explanation": "This function determines whether a given number is prime. A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.\n\nThe function works as follows:\n1. First, it checks if the number is less than 2. Since prime numbers must be greater than 1, any number less than 2 returns False.\n2. The function then iterates through potential divisors from 2 up to the square root of n. We only need to check up to the square root because if n has a divisor larger than its square root, it must also have a corresponding divisor smaller than the square root.\n3. If any divisor evenly divides n (i.e., n % i == 0), the function returns False, indicating n is not prime.\n4. If no divisors are found, the function returns True, confirming n is prime.\n\nThis approach is efficient with O(√n) time complexity, making it suitable for checking primality of reasonably large numbers.",
    "language": "python"
}
```

---

*Document prepared for academic submission - B.Tech/BE Final Year Project*

*Last Updated: February 2026*
