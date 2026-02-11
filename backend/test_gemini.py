"""
Test script to check Gemini API directly
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 50)
print("GEMINI API TEST SCRIPT")
print("=" * 50)

# Check API key
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print("ERROR: GEMINI_API_KEY not found in .env file")
    exit(1)

print(f"API Key found: {api_key[:15]}...{api_key[-5:]}")
print(f"API Key length: {len(api_key)}")

# Try to import and configure
try:
    import google.generativeai as genai
    print(f"google-generativeai version: {genai.__version__}")
except ImportError:
    print("ERROR: google-generativeai not installed. Run: pip install google-generativeai")
    exit(1)

# Configure API
print("\nConfiguring Gemini API...")
genai.configure(api_key=api_key)

# Try different models
models_to_try = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']

for model_name in models_to_try:
    print(f"\n--- Testing model: {model_name} ---")
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say 'Hello, test successful!' in one line.")
        
        if response and response.text:
            print(f"SUCCESS! Response: {response.text[:100]}")
            print(f"\nWorking model found: {model_name}")
            break
        else:
            print(f"Empty response from {model_name}")
            
    except Exception as e:
        print(f"ERROR with {model_name}: {type(e).__name__}: {str(e)}")

print("\n" + "=" * 50)
print("Test complete!")
print("=" * 50)
