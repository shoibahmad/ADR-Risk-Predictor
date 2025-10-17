#!/usr/bin/env python3
"""
Debug version of the ADR Risk Predictor app
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
from datetime import datetime
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Load the trained model and preprocessor
model = None
preprocessor = None

try:
    if os.path.exists('adr_model.pkl') and os.path.exists('adr_preprocessor.pkl'):
        model = joblib.load('adr_model.pkl')
        preprocessor = joblib.load('adr_preprocessor.pkl')
        logger.info("✅ Model and preprocessor loaded successfully")
    else:
        logger.warning("⚠️ Model files not found. Please run model_trainer.py first.")
except Exception as e:
    logger.error(f"❌ Error loading model: {e}")

@app.route('/')
def index():
    logger.info("📱 Welcome page accessed")
    return render_template('welcome.html')

@app.route('/assessment')
def assessment():
    logger.info("🔬 Assessment page accessed")
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict_adr():
    logger.info("🧠 Prediction request received")
    
    try:
        if model is None or preprocessor is None:
            logger.error("❌ Model not loaded")
            return jsonify({'error': 'Model not loaded properly'}), 500
        
        # Get data from request
        data = request.json
        logger.info(f"📊 Input data keys: {list(data.keys())}")
        
        # Create DataFrame from input data
        input_df = pd.DataFrame([data])
        logger.info(f"📋 DataFrame shape: {input_df.shape}")
        logger.info(f"📋 DataFrame columns: {list(input_df.columns)}")
        
        # Convert categorical columns to object type
        categorical_cols = ['sex', 'ethnicity', 'cyp2c9', 'cyp2d6', 'indication']
        for col in categorical_cols:
            if col in input_df.columns:
                input_df[col] = input_df[col].astype('object')
        
        # Make prediction
        logger.info("🔮 Making prediction...")
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
        
        logger.info(f"✅ Prediction successful: {prediction} ({risk_level} risk)")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Error in prediction: {e}")
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/sample_data/<sample_type>')
def get_sample_data(sample_type):
    logger.info(f"🧪 Sample data requested: {sample_type}")
    
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
        }
    }
    
    if sample_type in sample_patients:
        return jsonify(sample_patients[sample_type])
    else:
        return jsonify({'error': 'Sample type not found'}), 404

@app.route('/health')
def health_check():
    status = {
        'status': 'healthy',
        'model_loaded': model is not None,
        'preprocessor_loaded': preprocessor is not None,
        'model_files_exist': {
            'adr_model.pkl': os.path.exists('adr_model.pkl'),
            'adr_preprocessor.pkl': os.path.exists('adr_preprocessor.pkl')
        },
        'timestamp': datetime.now().isoformat()
    }
    logger.info(f"💊 Health check: {status}")
    return jsonify(status)

@app.route('/debug')
def debug_info():
    """Debug endpoint to show system information"""
    debug_data = {
        'python_version': os.sys.version,
        'current_directory': os.getcwd(),
        'files_in_directory': os.listdir('.'),
        'model_loaded': model is not None,
        'preprocessor_loaded': preprocessor is not None,
        'flask_version': Flask.__version__
    }
    
    if model is not None:
        debug_data['model_classes'] = list(model.classes_)
        debug_data['model_type'] = str(type(model))
    
    return jsonify(debug_data)

if __name__ == '__main__':
    print("🐛 ADR Risk Predictor - Debug Mode")
    print("=" * 50)
    print("📱 Web interface: http://localhost:5000")
    print("🔍 Debug info: http://localhost:5000/debug")
    print("💊 Health check: http://localhost:5000/health")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=8080)