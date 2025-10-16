#!/usr/bin/env python3
"""
List available Gemini models
"""

import google.generativeai as genai

def list_available_models():
    """List all available Gemini models"""
    
    GEMINI_API_KEY = "AIzaSyDxALLzLCIsdADHTCLOGeJuL0rWwCtnm1w"
    
    try:
        print("🔍 Listing available Gemini models...")
        genai.configure(api_key=GEMINI_API_KEY)
        
        models = genai.list_models()
        
        print("\n📋 Available Models:")
        for model in models:
            print(f"- {model.name}")
            if hasattr(model, 'supported_generation_methods'):
                print(f"  Supported methods: {model.supported_generation_methods}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error listing models: {e}")
        return False

if __name__ == "__main__":
    list_available_models()