#!/usr/bin/env python3
"""
Test the complete flow: prediction + detailed analysis
"""

import requests
import json
import time

def test_prediction_endpoint():
    """Test the prediction endpoint"""
    
    url = "http://localhost:5000/predict"
    
    # Complete patient data
    patient_data = {
        "age": 68,
        "sex": "male",
        "ethnicity": "caucasian",
        "height": 175,
        "weight": 85,
        "bmi": 27.8,
        "creatinine": 1.8,
        "egfr": 45,
        "ast_alt": 65,
        "bilirubin": 1.2,
        "albumin": 3.5,
        "medication_name": "Warfarin",
        "index_drug_dose": 5,
        "concomitant_drugs_count": 3,
        "drug_interactions": 1,
        "indication": "atrial_fibrillation",
        "cyp2c9": "normal",
        "cyp2d6": "normal",
        "bp_systolic": 145,
        "bp_diastolic": 90,
        "heart_rate": 78,
        "time_since_start_days": 30,
        "diabetes": 1,
        "liver_disease": 0,
        "ckd": 1,
        "cardiac_disease": 1,
        "hypertension": 1,
        "respiratory_disease": 0,
        "neurological_disease": 0,
        "autoimmune_disease": 0,
        "cyp_inhibitors_flag": 0,
        "qt_prolonging_flag": 0,
        "hla_risk_allele_flag": 0,
        "inpatient_flag": 0,
        "prior_adr_history": 0,
        "polypharmacy_flag": 0,
        "cumulative_dose_mg": 150,
        "dose_density_mg_day": 5
    }
    
    try:
        print("🧪 Testing prediction endpoint...")
        
        response = requests.post(
            url,
            json=patient_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Prediction successful!")
            print(f"Risk Level: {result.get('risk_level', 'Unknown')}")
            print(f"Predicted ADR: {result.get('predicted_adr_type', 'Unknown')}")
            print(f"No ADR Probability: {result.get('no_adr_probability', 0)}%")
            return result, patient_data
        else:
            print(f"❌ Prediction failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return None, None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, None

def test_detailed_analysis(patient_data, prediction_result):
    """Test the detailed analysis endpoint"""
    
    url = "http://localhost:5000/generate_detailed_analysis"
    
    analysis_data = {
        "patient_data": patient_data,
        "prediction_result": prediction_result,
        "patient_name": "Test Patient",
        "patient_id": "PT25101700003",
        "clinician_name": "Dr. Test"
    }
    
    try:
        print("\n🧪 Testing detailed analysis endpoint...")
        
        response = requests.post(
            url,
            json=analysis_data,
            headers={'Content-Type': 'application/json'},
            timeout=45
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Detailed analysis successful!")
            print(f"AI Generated: {result.get('ai_generated', 'Unknown')}")
            print(f"Analysis length: {len(result.get('analysis', ''))}")
            return True
        else:
            print(f"❌ Analysis failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🚀 Testing Complete ADR Assessment Flow")
    print("=" * 60)
    
    # Test prediction
    prediction_result, patient_data = test_prediction_endpoint()
    
    if prediction_result and patient_data:
        # Test detailed analysis
        analysis_success = test_detailed_analysis(patient_data, prediction_result)
        
        if analysis_success:
            print("\n🎉 Complete flow test successful!")
            print("\n📋 Summary:")
            print(f"✅ Prediction: {prediction_result.get('risk_level')} risk")
            print(f"✅ Analysis: Generated successfully")
            print("\n🌐 Frontend should now work properly!")
        else:
            print("\n⚠️ Analysis test failed")
    else:
        print("\n⚠️ Prediction test failed")

if __name__ == "__main__":
    main()