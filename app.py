from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import google.generativeai as genai
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configure Gemini API
GEMINI_API_KEY = "AIzaSyDxALLzLCIsdADHTCLOGeJuL0rWwCtnm1w"
genai.configure(api_key=GEMINI_API_KEY)
model_gemini = genai.GenerativeModel('gemini-pro')

# Load the trained model and preprocessor
try:
    model = joblib.load('adr_model.pkl')
    preprocessor = joblib.load('adr_preprocessor.pkl')
    logger.info("Model and preprocessor loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {e}")
    model = None
    preprocessor = None

@app.route('/')
def index():
    return render_template('welcome.html')

@app.route('/assessment')
def assessment():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict_adr():
    try:
        if model is None or preprocessor is None:
            return jsonify({'error': 'Model not loaded properly'}), 500
        
        # Get data from request
        data = request.json
        logger.info(f"Received prediction request: {data}")
        
        # Create DataFrame from input data
        input_df = pd.DataFrame([data])
        
        # Convert categorical columns to object type
        categorical_cols = ['sex', 'ethnicity', 'cyp2c9', 'cyp2d6', 'indication']
        for col in categorical_cols:
            if col in input_df.columns:
                input_df[col] = input_df[col].astype('object')
        
        # Make prediction
        prediction = model.predict(input_df)[0]
        prediction_proba = model.predict_proba(input_df)[0]
        
        # Get class names and probabilities
        classes = model.classes_
        probabilities = dict(zip(classes, prediction_proba))
        
        # Sort probabilities in descending order
        sorted_probabilities = dict(sorted(probabilities.items(), key=lambda x: x[1], reverse=True))
        
        # Calculate risk level
        no_adr_prob = probabilities.get('No ADR', 0)
        risk_level = 'Low' if no_adr_prob > 0.7 else 'Medium' if no_adr_prob > 0.4 else 'High'
        
        result = {
            'predicted_adr_type': prediction,
            'risk_level': risk_level,
            'no_adr_probability': round(no_adr_prob * 100, 2),
            'top_adr_risks': {k: round(v * 100, 2) for k, v in list(sorted_probabilities.items())[:5]},
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Prediction result: {result}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/generate_report', methods=['POST'])
def generate_report():
    try:
        data = request.json
        patient_data = data.get('patient_data', {})
        prediction_result = data.get('prediction_result', {})
        
        # Get patient metadata
        patient_name = data.get('patient_name', 'Patient')
        patient_id = data.get('patient_id', '')
        clinician_name = data.get('clinician_name', 'Clinician')
        
        # Create a comprehensive prompt for Gemini
        prompt = f"""
        As a clinical pharmacologist, generate a comprehensive ADR risk assessment report for the following patient:

        PATIENT INFORMATION:
        - Patient Name: {patient_name}
        {f"- Patient ID: {patient_id}" if patient_id else ""}
        - Assessing Clinician: {clinician_name}
        - Age: {patient_data.get('age', 'N/A')} years
        - Sex: {patient_data.get('sex', 'N/A')}
        - Ethnicity: {patient_data.get('ethnicity', 'N/A')}
        - BMI: {patient_data.get('bmi', 'N/A')}
        - Indication: {patient_data.get('indication', 'N/A')}

        CLINICAL PARAMETERS:
        - Creatinine: {patient_data.get('creatinine', 'N/A')} mg/dL
        - eGFR: {patient_data.get('egfr', 'N/A')} mL/min/1.73m²
        - AST/ALT: {patient_data.get('ast_alt', 'N/A')} U/L
        - Albumin: {patient_data.get('albumin', 'N/A')} g/dL

        COMORBIDITIES:
        - Diabetes: {'Yes' if patient_data.get('diabetes') == 1 else 'No'}
        - Liver Disease: {'Yes' if patient_data.get('liver_disease') == 1 else 'No'}
        - CKD: {'Yes' if patient_data.get('ckd') == 1 else 'No'}
        - Cardiac Disease: {'Yes' if patient_data.get('cardiac_disease') == 1 else 'No'}

        MEDICATION PROFILE:
        - Index Drug Dose: {patient_data.get('index_drug_dose', 'N/A')} mg
        - Concomitant Drugs: {patient_data.get('concomitant_drugs_count', 'N/A')}
        - CYP2C9 Status: {patient_data.get('cyp2c9', 'N/A')}
        - CYP2D6 Status: {patient_data.get('cyp2d6', 'N/A')}

        PREDICTION RESULTS:
        - Predicted ADR Type: {prediction_result.get('predicted_adr_type', 'N/A')}
        - Risk Level: {prediction_result.get('risk_level', 'N/A')}
        - No ADR Probability: {prediction_result.get('no_adr_probability', 'N/A')}%

        Please provide a comprehensive clinical report with the following sections:

        ## RISK ASSESSMENT SUMMARY
        Provide an executive summary of the overall ADR risk profile.

        ## KEY RISK FACTORS IDENTIFIED
        List and explain the most significant risk factors contributing to ADR potential.

        ## CLINICAL RECOMMENDATIONS
        Provide specific, actionable clinical recommendations for this patient.

        ## MONITORING SUGGESTIONS
        Detail recommended monitoring parameters and frequency.

        ## PATIENT COUNSELING POINTS
        List key points for patient education and counseling.

        ## ADDITIONAL CONSIDERATIONS
        Include any other relevant clinical considerations or precautions.

        Format the report professionally for clinical documentation. Use clear headings and bullet points where appropriate.
        """
        
        # Generate report using Gemini
        response = model_gemini.generate_content(prompt)
        report = response.text
        
        return jsonify({
            'report': report,
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        return jsonify({'error': f'Failed to generate report: {str(e)}'}), 500

@app.route('/sample_data/<sample_type>')
def get_sample_data(sample_type):
    """Get sample patient data for testing"""
    sample_patients = {
        'high-risk': {
            'name': 'High Risk Patient',
            'age': 75, 'sex': 'M', 'ethnicity': 'White', 'bmi': 32.5,
            'creatinine': 2.1, 'egfr': 35, 'ast_alt': 95, 'bilirubin': 1.8, 'albumin': 2.8,
            'diabetes': 1, 'liver_disease': 1, 'ckd': 1, 'cardiac_disease': 1,
            'index_drug_dose': 200, 'concomitant_drugs_count': 12, 'indication': 'Cancer',
            'cyp2c9': 'Poor', 'cyp2d6': 'PM', 'bp_systolic': 165, 'bp_diastolic': 95,
            'heart_rate': 95, 'time_since_start_days': 45, 'cyp_inhibitors_flag': 1,
            'qt_prolonging_flag': 1, 'hla_risk_allele_flag': 1, 'inpatient_flag': 1,
            'prior_adr_history': 1
        },
        'medium-risk': {
            'name': 'Medium Risk Patient',
            'age': 55, 'sex': 'F', 'ethnicity': 'Asian', 'bmi': 27.2,
            'creatinine': 1.3, 'egfr': 65, 'ast_alt': 45, 'bilirubin': 0.8, 'albumin': 3.5,
            'diabetes': 1, 'liver_disease': 0, 'ckd': 0, 'cardiac_disease': 1,
            'index_drug_dose': 150, 'concomitant_drugs_count': 6, 'indication': 'Pain',
            'cyp2c9': 'Intermediate', 'cyp2d6': 'IM', 'bp_systolic': 140, 'bp_diastolic': 85,
            'heart_rate': 78, 'time_since_start_days': 30, 'cyp_inhibitors_flag': 0,
            'qt_prolonging_flag': 1, 'hla_risk_allele_flag': 0, 'inpatient_flag': 0,
            'prior_adr_history': 0
        },
        'low-risk': {
            'name': 'Low Risk Patient',
            'age': 35, 'sex': 'M', 'ethnicity': 'White', 'bmi': 24.1,
            'creatinine': 0.9, 'egfr': 95, 'ast_alt': 25, 'bilirubin': 0.5, 'albumin': 4.2,
            'diabetes': 0, 'liver_disease': 0, 'ckd': 0, 'cardiac_disease': 0,
            'index_drug_dose': 100, 'concomitant_drugs_count': 2, 'indication': 'Pain',
            'cyp2c9': 'Wild', 'cyp2d6': 'EM', 'bp_systolic': 120, 'bp_diastolic': 75,
            'heart_rate': 68, 'time_since_start_days': 14, 'cyp_inhibitors_flag': 0,
            'qt_prolonging_flag': 0, 'hla_risk_allele_flag': 0, 'inpatient_flag': 0,
            'prior_adr_history': 0
        }
    }
    
    if sample_type in sample_patients:
        return jsonify(sample_patients[sample_type])
    else:
        return jsonify({'error': 'Sample type not found'}), 404

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)