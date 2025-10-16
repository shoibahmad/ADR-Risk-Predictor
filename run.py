#!/usr/bin/env python3
"""
ADR Risk Predictor - Startup Script
"""

import os
import sys
from app import app

def check_model_files():
    """Check if required model files exist"""
    required_files = ['adr_model.pkl', 'adr_preprocessor.pkl']
    missing_files = []
    
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print("❌ Missing required model files:")
        for file in missing_files:
            print(f"   - {file}")
        print("\n💡 Please run 'python model_trainer.py' first to generate the model files.")
        return False
    
    print("✅ All required model files found.")
    return True

def main():
    print("🏥 ADR Risk Predictor - Clinical Decision Support System")
    print("=" * 60)
    
    # Check if model files exist
    if not check_model_files():
        print("\n🔧 Generating model files...")
        try:
            import subprocess
            result = subprocess.run([sys.executable, 'model_trainer.py'], 
                                  capture_output=True, text=True, timeout=120)
            if result.returncode == 0:
                print("✅ Model files generated successfully!")
            else:
                print(f"❌ Failed to generate model files: {result.stderr}")
                sys.exit(1)
        except Exception as e:
            print(f"❌ Error generating model files: {e}")
            sys.exit(1)
    
    print("🚀 Starting Flask application...")
    print("📱 Access the application at: http://localhost:5000")
    print("🔧 Debug mode: Enabled")
    print("💡 Use Ctrl+C to stop the server")
    print("=" * 60)
    
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user.")
    except Exception as e:
        print(f"\n❌ Error starting application: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()