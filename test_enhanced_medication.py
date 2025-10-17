#!/usr/bin/env python3
"""
Test the enhanced medication analysis with food and precautions
"""

import requests
import json

def test_enhanced_medication_analysis():
    """Test the enhanced medication analysis endpoint"""
    
    url = "http://localhost:5000/generate_medication_analysis"
    
    # Test data
    test_data = {
        "patient_data": {
            "age": 72,
            "medication_name": "Warfarin",
            "index_drug_dose": 5,
            "weight": 68,
            "egfr": 55,
            "ast_alt": 45,
            "cyp2c9": "intermediate",
            "cyp2d6": "normal",
            "concomitant_drugs_count": 2
        },
        "prediction_result": {
            "predicted_adr_type": "Cardiovascular",
            "risk_level": "High",
            "no_adr_probability": 15.2
        },
        "patient_name": "Enhanced Test Patient"
    }
    
    try:
        print("💊 Testing enhanced medication analysis with food & precautions...")
        
        response = requests.post(
            url,
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=60  # Longer timeout for Gemini
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Enhanced medication analysis successful!")
            print(f"AI Generated: {result.get('ai_generated', 'Unknown')}")
            print(f"Analysis length: {len(result.get('analysis', ''))}")
            
            # Check for food and precautions content
            analysis = result.get('analysis', '')
            has_food_content = any(keyword in analysis.lower() for keyword in 
                                 ['food', 'meal', 'eat', 'avoid', 'diet'])
            has_precautions = any(keyword in analysis.lower() for keyword in 
                                ['warning', 'precaution', 'avoid', 'danger', 'emergency'])
            
            print(f"Contains food recommendations: {'✅' if has_food_content else '❌'}")
            print(f"Contains precautions: {'✅' if has_precautions else '❌'}")
            
            print("\nAnalysis preview:")
            print("-" * 60)
            print(analysis[:1000] + "..." if len(analysis) > 1000 else analysis)
            
            return True
        else:
            print(f"❌ Request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Enhanced Medication Analysis")
    print("=" * 60)
    
    success = test_enhanced_medication_analysis()
    
    if success:
        print("\n🎉 Enhanced medication analysis with food & precautions working!")
    else:
        print("\n⚠️ Enhanced medication analysis test failed.")