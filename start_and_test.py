#!/usr/bin/env python3
"""
Start the application and run tests
"""

import subprocess
import time
import requests
import threading
import sys
import os

def start_server():
    """Start the Flask server"""
    try:
        print("🚀 Starting Flask server...")
        # Start the server in a subprocess
        process = subprocess.Popen([sys.executable, 'app.py'], 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE)
        return process
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return None

def test_endpoints():
    """Test the application endpoints"""
    
    # Wait for server to start
    print("⏳ Waiting for server to start...")
    time.sleep(3)
    
    base_url = "http://localhost:5000"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False
    
    # Test Gemini endpoint
    try:
        response = requests.get(f"{base_url}/test_gemini", timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Gemini test: {result.get('status')}")
        else:
            print(f"❌ Gemini test failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Gemini test error: {e}")
    
    # Test prediction with sample data
    sample_data = {
        "age": 65, "sex": "M", "ethnicity": "White", "bmi": 28.5,
        "creatinine": 1.2, "egfr": 75, "ast_alt": 35, "bilirubin": 0.8, "albumin": 4.0,
        "diabetes": 0, "liver_disease": 0, "ckd": 0, "cardiac_disease": 1,
        "index_drug_dose": 100, "concomitant_drugs_count": 5, "indication": "Pain",
        "cyp2c9": "Wild", "cyp2d6": "EM", "bp_systolic": 130, "bp_diastolic": 80,
        "heart_rate": 72, "time_since_start_days": 30, "cyp_inhibitors_flag": 0,
        "qt_prolonging_flag": 0, "hla_risk_allele_flag": 0, "inpatient_flag": 0,
        "prior_adr_history": 0, "polypharmacy_flag": 0, "cumulative_dose_mg": 3000,
        "dose_density_mg_day": 100
    }
    
    try:
        response = requests.post(f"{base_url}/predict", json=sample_data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Prediction working: {result.get('predicted_adr_type')} ({result.get('risk_level')} risk)")
            
            # Test report generation
            report_data = {
                "patient_data": sample_data,
                "prediction_result": result,
                "patient_name": "Test Patient",
                "clinician_name": "Dr. Test"
            }
            
            response = requests.post(f"{base_url}/generate_report", json=report_data, timeout=30)
            if response.status_code == 200:
                report_result = response.json()
                print(f"✅ Report generation working (AI: {report_result.get('ai_generated')})")
                print(f"   Report length: {len(report_result.get('report', ''))} characters")
            else:
                print(f"❌ Report generation failed: {response.status_code}")
                
        else:
            print(f"❌ Prediction failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Prediction error: {e}")
    
    return True

def main():
    print("🏥 ADR Risk Predictor - Start and Test")
    print("=" * 50)
    
    # Check if model files exist
    if not os.path.exists('adr_model.pkl'):
        print("❌ Model file not found. Running model trainer...")
        try:
            subprocess.run([sys.executable, 'model_trainer.py'], check=True)
            print("✅ Model trained successfully")
        except Exception as e:
            print(f"❌ Model training failed: {e}")
            return
    
    # Start server
    server_process = start_server()
    if not server_process:
        return
    
    try:
        # Run tests
        test_endpoints()
        
        print("\n🎉 All tests completed!")
        print("🌐 Application is running at: http://localhost:5000")
        print("⏹️ Press Ctrl+C to stop the server")
        
        # Keep the server running
        server_process.wait()
        
    except KeyboardInterrupt:
        print("\n👋 Stopping server...")
        server_process.terminate()
        server_process.wait()

if __name__ == "__main__":
    main()