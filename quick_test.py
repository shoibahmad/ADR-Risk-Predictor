#!/usr/bin/env python3
"""
Quick test to verify the application is working
"""

import requests
import json

def test_prediction():
    """Test the prediction endpoint"""
    
    # Sample patient data
    sample_data = {
        "age": 65,
        "sex": "M",
        "ethnicity": "White",
        "bmi": 28.5,
        "creatinine": 1.2,
        "egfr": 75,
        "ast_alt": 35,
        "bilirubin": 0.8,
        "albumin": 4.0,
        "diabetes": 0,
        "liver_disease": 0,
        "ckd": 0,
        "cardiac_disease": 1,
        "index_drug_dose": 100,
        "concomitant_drugs_count": 5,
        "indication": "Pain",
        "cyp2c9": "Wild",
        "cyp2d6": "EM",
        "bp_systolic": 130,
        "bp_diastolic": 80,
        "heart_rate": 72,
        "time_since_start_days": 30,
        "cyp_inhibitors_flag": 0,
        "qt_prolonging_flag": 0,
        "hla_risk_allele_flag": 0,
        "inpatient_flag": 0,
        "prior_adr_history": 0,
        "polypharmacy_flag": 0,
        "cumulative_dose_mg": 3000,
        "dose_density_mg_day": 100
    }
    
    try:
        print("🧪 Testing prediction endpoint...")
        response = requests.post('http://localhost:5000/predict', 
                               json=sample_data, 
                               timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Prediction successful!")
            print(f"   Predicted ADR: {result.get('predicted_adr_type')}")
            print(f"   Risk Level: {result.get('risk_level')}")
            print(f"   No ADR Probability: {result.get('no_adr_probability')}%")
            return result
        else:
            print(f"❌ Prediction failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_report_generation(prediction_result):
    """Test the report generation endpoint"""
    
    if not prediction_result:
        print("⏭️ Skipping report test (no prediction result)")
        return
    
    report_data = {
        "patient_data": {
            "age": 65,
            "sex": "M",
            "ethnicity": "White",
            "indication": "Pain"
        },
        "prediction_result": prediction_result,
        "patient_name": "Test Patient",
        "patient_id": "TEST-001",
        "clinician_name": "Dr. Test"
    }
    
    try:
        print("\n📋 Testing report generation...")
        response = requests.post('http://localhost:5000/generate_report', 
                               json=report_data, 
                               timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Report generation successful!")
            print(f"   Report length: {len(result.get('report', ''))} characters")
            print(f"   AI Generated: {result.get('ai_generated', 'Unknown')}")
        else:
            print(f"❌ Report generation failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Quick Test - ADR Risk Predictor")
    print("=" * 40)
    
    # Test prediction
    result = test_prediction()
    
    # Test report generation
    test_report_generation(result)
    
    print("\n🎉 Testing completed!")
    print("🌐 Open http://localhost:5000 in your browser to use the web interface")