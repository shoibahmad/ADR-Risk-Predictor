#!/usr/bin/env python3
"""
Test script to verify external drug functionality
"""

import requests
import json

def test_external_drugs():
    """Test the external drugs functionality"""
    
    # Test data with external drugs
    test_data = {
        "age": 65,
        "sex": "M",
        "weight": 80,
        "height": 175,
        "bmi": 26.1,
        "medication_name": "Warfarin",
        "index_drug_dose": 5,
        "external_drugs": [
            {"name": "Aspirin 81mg", "index": 1},
            {"name": "Metoprolol 50mg", "index": 2},
            {"name": "Amiodarone 200mg", "index": 3}
        ],
        "external_drugs_list": ["Aspirin 81mg", "Metoprolol 50mg", "Amiodarone 200mg"],
        "all_medications": ["Warfarin", "Aspirin 81mg", "Metoprolol 50mg", "Amiodarone 200mg"],
        "concomitant_drugs_count": 3,
        "creatinine": 1.2,
        "egfr": 75,
        "ast_alt": 35,
        "diabetes": 0,
        "liver_disease": 0,
        "ckd": 0,
        "cardiac_disease": 1,
        "hypertension": 1,
        "cyp2c9": "Intermediate",
        "cyp2d6": "EM",
        "bp_systolic": 145,
        "bp_diastolic": 90,
        "heart_rate": 72
    }
    
    try:
        # Test prediction endpoint
        print("Testing prediction with external drugs...")
        response = requests.post('http://localhost:5000/predict', 
                               json=test_data, 
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Prediction successful!")
            print(f"Risk Level: {result.get('risk_level')}")
            print(f"Predicted ADR: {result.get('predicted_adr_type')}")
            
            # Check comprehensive drug analysis
            drug_analysis = result.get('comprehensive_drug_analysis', {})
            print(f"\n📊 Comprehensive Drug Analysis:")
            print(f"Total medications analyzed: {len(drug_analysis.get('all_medications_analyzed', []))}")
            print(f"External drugs count: {drug_analysis.get('external_drugs_count', 0)}")
            print(f"Interaction risk score: {drug_analysis.get('interaction_risk_score', 0)}")
            print(f"High-risk drug count: {drug_analysis.get('high_risk_drug_count', 0)}")
            print(f"QT prolonging flag: {drug_analysis.get('qt_prolonging_flag', 0)}")
            print(f"Final interaction severity: {drug_analysis.get('final_drug_interaction_severity', 'Unknown')}")
            
            if drug_analysis.get('detected_drug_risks'):
                print(f"\n⚠️ Detected risks:")
                for risk in drug_analysis.get('detected_drug_risks', []):
                    print(f"  - {risk}")
            
            return True
        else:
            print(f"❌ Prediction failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing external drugs: {e}")
        return False

def test_without_external_drugs():
    """Test without external drugs for comparison"""
    
    test_data = {
        "age": 65,
        "sex": "M",
        "weight": 80,
        "height": 175,
        "bmi": 26.1,
        "medication_name": "Warfarin",
        "index_drug_dose": 5,
        "concomitant_drugs_count": 0,
        "creatinine": 1.2,
        "egfr": 75,
        "ast_alt": 35,
        "diabetes": 0,
        "liver_disease": 0,
        "ckd": 0,
        "cardiac_disease": 1,
        "hypertension": 1,
        "cyp2c9": "Intermediate",
        "cyp2d6": "EM",
        "bp_systolic": 145,
        "bp_diastolic": 90,
        "heart_rate": 72
    }
    
    try:
        print("\n" + "="*50)
        print("Testing prediction WITHOUT external drugs...")
        response = requests.post('http://localhost:5000/predict', 
                               json=test_data, 
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Prediction successful!")
            print(f"Risk Level: {result.get('risk_level')}")
            print(f"Predicted ADR: {result.get('predicted_adr_type')}")
            
            # Check comprehensive drug analysis
            drug_analysis = result.get('comprehensive_drug_analysis', {})
            print(f"\n📊 Comprehensive Drug Analysis:")
            print(f"Total medications analyzed: {len(drug_analysis.get('all_medications_analyzed', []))}")
            print(f"External drugs count: {drug_analysis.get('external_drugs_count', 0)}")
            print(f"Interaction risk score: {drug_analysis.get('interaction_risk_score', 0)}")
            
            return True
        else:
            print(f"❌ Prediction failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing without external drugs: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing External Drugs Functionality")
    print("="*50)
    
    # Test with external drugs
    success1 = test_external_drugs()
    
    # Test without external drugs for comparison
    success2 = test_without_external_drugs()
    
    print("\n" + "="*50)
    if success1 and success2:
        print("✅ All tests passed! External drugs functionality is working.")
    else:
        print("❌ Some tests failed. Check the implementation.")