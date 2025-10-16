#!/usr/bin/env python3
"""
Simple test script to check if the ADR Risk Predictor is working
"""

import os
import sys
import requests
import time

def test_application():
    """Test the application endpoints"""
    base_url = "http://localhost:5000"
    
    print("🧪 Testing ADR Risk Predictor Application")
    print("=" * 50)
    
    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed")
            print(f"   Model loaded: {data.get('model_loaded', False)}")
        else:
            print("❌ Health check failed")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to application: {e}")
        print("💡 Make sure to run 'python app.py' first")
        return False
    
    # Test 2: Sample data endpoint
    try:
        response = requests.get(f"{base_url}/sample_data/high-risk", timeout=5)
        if response.status_code == 200:
            print("✅ Sample data endpoint working")
        else:
            print("❌ Sample data endpoint failed")
    except requests.exceptions.RequestException as e:
        print(f"❌ Sample data test failed: {e}")
    
    # Test 3: Prediction endpoint with sample data
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
            print("✅ Prediction endpoint working")
            print(f"   Predicted ADR: {result.get('predicted_adr_type', 'N/A')}")
            print(f"   Risk Level: {result.get('risk_level', 'N/A')}")
        else:
            print(f"❌ Prediction failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Prediction test failed: {e}")
    
    print("\n🎉 Application testing completed!")
    print(f"🌐 Access the web interface at: {base_url}")
    return True

if __name__ == "__main__":
    test_application()