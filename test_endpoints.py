#!/usr/bin/env python3
"""
Test all endpoints to debug the 404 error
"""

import requests
import json
import time

def test_endpoint(url, method='GET', data=None, timeout=10):
    """Test a single endpoint"""
    try:
        if method == 'GET':
            response = requests.get(url, timeout=timeout)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=timeout)
        
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"  Response: {str(result)[:100]}...")
            except:
                print(f"  Response: {response.text[:100]}...")
        else:
            print(f"  Error: {response.text[:200]}")
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"  Error: {e}")
        return False

def main():
    base_url = "http://localhost:5000"
    
    print("🧪 Testing ADR Risk Predictor Endpoints")
    print("=" * 50)
    
    # Test basic endpoints
    endpoints = [
        ("/health", "GET"),
        ("/debug", "GET"),
        ("/generate_report", "GET"),  # Test GET first
    ]
    
    for endpoint, method in endpoints:
        print(f"\n🔍 Testing {method} {endpoint}")
        test_endpoint(f"{base_url}{endpoint}", method)
    
    # Test POST endpoints with data
    print(f"\n🔍 Testing POST /predict")
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
    
    prediction_success = test_endpoint(f"{base_url}/predict", "POST", sample_data)
    
    if prediction_success:
        print(f"\n🔍 Testing POST /generate_report")
        report_data = {
            "patient_data": sample_data,
            "prediction_result": {
                "predicted_adr_type": "No ADR",
                "risk_level": "Low",
                "no_adr_probability": 75.5
            },
            "patient_name": "Test Patient",
            "clinician_name": "Dr. Test"
        }
        
        test_endpoint(f"{base_url}/generate_report", "POST", report_data, timeout=30)
    
    print("\n🎉 Endpoint testing completed!")

if __name__ == "__main__":
    print("⏳ Waiting for server to start...")
    time.sleep(2)
    main()