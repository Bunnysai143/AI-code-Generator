# AI-Powered Code Generator with Explanation

A full-stack web application that generates code from natural language descriptions using Google's Gemini Free API, with comprehensive explanations, code execution sandbox, GitHub Gist integration, and conversational refinement.

## Tech Stack

- **Frontend**: React.js with Monaco Editor
- **Backend**: Python Flask
- **Database**: MongoDB Atlas (Free Tier)
- **AI Service**: Google Gemini Free API
- **Code Editor**: Monaco Editor (VS Code's editor)

## Project Structure

```
code-Gen/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── routes/              # API routes
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── generate.py      # Code generation endpoints
│   │   │   ├── explain.py       # Code explanation endpoints
│   │   │   ├── history.py       # History endpoints
│   │   │   ├── favorites.py     # Favorites management
│   │   │   ├── gist.py          # GitHub Gist integration
│   │   │   └── execute.py       # Code execution sandbox
│   │   ├── services/            # Business logic
│   │   │   ├── auth_service.py  # Authentication logic
│   │   │   ├── db_service.py    # MongoDB operations
│   │   │   └── gemini_service.py # Gemini API integration
│   │   └── middleware/          # Request middleware
│   │       └── auth_middleware.py
│   ├── run.py                   # Entry point
│   ├── requirements.txt         # Python dependencies
│   └── .env.example            # Environment template
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Auth/           # Login, Register
│   │   │   ├── Common/         # Navbar, Loading, PrivateRoute, ThemeToggle
│   │   │   ├── Editor/         # Monaco Code Editor
│   │   │   ├── Favorites/      # Favorites management
│   │   │   ├── Generator/      # Code generator
│   │   │   ├── Gist/           # GitHub Gist integration
│   │   │   ├── History/        # History view and details
│   │   │   ├── Refinement/     # Conversational code refinement
│   │   │   └── Sandbox/        # Code execution sandbox
│   │   ├── context/            # React contexts
│   │   │   ├── AuthContext.js  # Authentication state
│   │   │   ├── FavoritesContext.js # Favorites state
│   │   │   └── ThemeContext.js # Dark/Light theme state
│   │   ├── services/           # API client
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
│
├── Project_doc.md              # Detailed project documentation
└── README.md
```

## Prerequisites

1. **Python 3.8+** installed
2. **Node.js 16+** installed
3. **MongoDB Atlas** account (free tier)
4. **Google Gemini API Key** (free)

## Setup Instructions

### 1. Get Your Free API Keys

#### MongoDB Atlas (Free Tier)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (M0 - Free tier)
4. Create a database user with password
5. Get your connection string (replace `<password>` with your password)

#### Google Gemini API (Free)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

# Edit .env with your credentials:
# - GEMINI_API_KEY=your_gemini_api_key
# - MONGODB_URI=your_mongodb_connection_string
# - SECRET_KEY=any_random_string

# Run the server
python run.py
```

The backend will start at `http://localhost:5000`

### 3. Frontend Setup

```bash
# Open new terminal, navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create .env file (optional, defaults work for local dev)
copy .env.example .env   # Windows

# Start the development server
npm start
```

The frontend will start at `http://localhost:3000`

### 4. Access the Application

1. Open your browser and go to `http://localhost:3000`
2. Register a new account
3. Start generating code!

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Code Generation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate` | Generate code from prompt |
| POST | `/api/explain` | Explain existing code |
| POST | `/api/generate/refine` | Refine code conversationally |
| GET | `/api/languages` | Get supported languages |

### History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history` | Get user's history |
| GET | `/api/history/:id` | Get specific generation |
| DELETE | `/api/history/:id` | Delete generation |

### Favorites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | Get user's favorites |
| POST | `/api/favorites` | Add to favorites |
| PUT | `/api/favorites/:id` | Update favorite title |
| DELETE | `/api/favorites/:id` | Remove from favorites |

### Code Execution (Sandbox)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/execute` | Execute code in sandbox |

### GitHub Gist
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gist/connect` | Connect GitHub account |
| POST | `/api/gist/create` | Create a new Gist |
| GET | `/api/gist/list` | List user's Gists |

## Supported Languages

- Python
- JavaScript
- TypeScript
- Java
- C++
- C
- C#
- Ruby
- Go
- PHP
- Swift
- Kotlin
- Rust

## Environment Variables

### Backend (.env)
```
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
MONGODB_URI=mongodb+srv://...
JWT_SECRET_KEY=your-jwt-secret
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Features

- **Code Generation**: Generate code from natural language descriptions
- **Code Explanation**: Get detailed explanations of generated code
- **Conversational Refinement**: Iteratively improve code through chat-based interactions
- **Code Execution Sandbox**: Run Python, JavaScript, and TypeScript code directly in the browser
- **GitHub Gist Integration**: Save and share code snippets directly to GitHub Gist
- **Favorites System**: Save and organize your best code generations
- **Monaco Editor**: Professional VS Code-like code editing experience
- **Multi-Language Support**: 13+ programming languages
- **Dark/Light Theme**: Toggle between dark and light modes
- **History Tracking**: Save and revisit previous generations
- **User Authentication**: Secure user accounts with JWT
- **Syntax Highlighting**: Beautiful code display with bracket pair colorization
- **Copy to Clipboard**: One-click code copying
- **Responsive Design**: Works on desktop and mobile

## Limitations

- Free tier API rate limits apply
- Generated code quality depends on AI model
- Code execution sandbox supports Python, JavaScript, and TypeScript only
- Requires internet connection

## License

This project is created for educational purposes.
