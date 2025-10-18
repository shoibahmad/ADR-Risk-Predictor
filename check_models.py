#!/usr/bin/env python3
"""
Check available Gemini models
"""

import google.generativeai as genai

def check_available_models():
    """Check what models are available"""
    
    # Configure Gemini API
    GEMINI_API_KEY = "AIzaSyDxALLzLCIsdADHTCLOGeJuL0rWwCtnm1w"
    
    try:
        print("🔍 Checking available Gemini models...")
        genai.configure(api_key=GEMINI_API_KEY)
        
        models = genai.list_models()
        
        print("Available models:")
        for model in models:
            print(f"- {model.name}")
            if hasattr(model, 'supported_generation_methods'):
                print(f"  Supported methods: {model.supported_generation_methods}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking models: {e}")
        return False

if __name__ == "__main__":
    check_available_models()