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
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configure Gemini API
GEMINI_API_KEY = "AIzaSyDxALLzLCIsdADHTCLOGeJuL0rWwCtnm1w"
genai.configure(api_key=GEMINI_API_KEY)
model_gemini = genai.GenerativeModel('gemini-2.5-flash')

# Load the trained model and preprocessor
try:
    model = joblib.load('adr_model.pkl')
    preprocessor = joblib.load('adr_preprocessor.pkl')
    logger.info("✅ Model and preprocessor loaded successfully")
except Exception as e:
    logger.error(f"❌ Error loading model: {e}")
    model = None
    preprocessor = None

@app.route('/')
def index():
    logger.info("📱 Welcome page accessed")
    return render_template('welcome.html')

@app.route('/assessment')
def assessment():
    logger.info("🔬 Assessment page accessed")
    return render_template('index.html')

@app.route('/debug')
def debug_info():
    """Debug endpoint to show all available routes"""
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'rule': str(rule)
        })
    
    return jsonify({
        'available_routes': routes,
        'model_loaded': model is not None,
        'gemini_configured': True,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/generate_report', methods=['POST', 'GET'])
def generate_report():
    logger.info(f"🔥 Generate report endpoint called with method: {request.method}")
    
    if request.method == 'GET':
        return jsonify({
            'message': 'Report generation endpoint is working',
            'method': 'GET',
            'expected_method': 'POST'
        })
    
    try:
        logger.info("📊 Processing report generation request...")
        
        if not request.json:
            logger.error("❌ No JSON data received")
            return jsonify({'error': 'No JSON data provided'}), 400
        
        data = request.json
        logger.info(f"📋 Received data keys: {list(data.keys())}")
        
        patient_data = data.get('patient_data', {})
        prediction_result = data.get('prediction_result', {})
        
        # Get patient metadata
        patient_name = data.get('patient_name', 'Patient')
        patient_id = data.get('patient_id', '')
        clinician_name = data.get('clinician_name', 'Clinician')
        
        logger.info(f"👤 Patient: {patient_name}, Clinician: {clinician_name}")
        
        # Try Gemini first
        logger.info("🤖 Attempting Gemini AI generation...")
        try:
            prompt = f"""Generate a brief clinical ADR risk assessment for:
            Patient: {patient_name}
            Risk Level: {prediction_result.get('risk_level', 'Unknown')}
            Predicted ADR: {prediction_result.get('predicted_adr_type', 'Unknown')}
            
            Provide a short professional clinical report."""
            
            response = model_gemini.generate_content(prompt)
            report = response.text
            ai_generated = True
            logger.info("✅ Gemini report generated successfully")
            
        except Exception as gemini_error:
            logger.error(f"❌ Gemini error: {gemini_error}")
            logger.info("🔄 Using fallback report...")
            report = generate_fallback_report(patient_data, prediction_result, patient_name, clinician_name)
            ai_generated = False
        
        result = {
            'report': report,
            'generated_at': datetime.now().isoformat(),
            'ai_generated': ai_generated,
            'report_length': len(report)
        }
        
        logger.info(f"✅ Report generated successfully (AI: {ai_generated}, Length: {len(report)})")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Error generating report: {e}")
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to generate report: {str(e)}'}), 500

@app.route('/predict', methods=['POST'])
def predict_adr():
    logger.info("🧠 Prediction endpoint called")
    
    try:
        if model is None or preprocessor is None:
            logger.error("❌ Model not loaded")
            return jsonify({'error': 'Model not loaded properly'}), 500
        
        data = request.json
        logger.info(f"📊 Received prediction data with {len(data)} fields")
        
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
        
        # Get all ADR types (excluding 'No ADR') with their probabilities
        adr_types_only = {k: v for k, v in probabilities.items() if k != 'No ADR'}
        sorted_adr_types = dict(sorted(adr_types_only.items(), key=lambda x: x[1], reverse=True))
        
        result = {
            'predicted_adr_type': prediction,
            'risk_level': risk_level,
            'no_adr_probability': round(no_adr_prob * 100, 2),
            'top_adr_risks': {k: round(v * 100, 2) for k, v in list(sorted_probabilities.items())[:5]},
            'all_adr_types': {k: round(v * 100, 2) for k, v in sorted_adr_types.items()},
            'top_specific_adr_risks': {k: round(v * 100, 2) for k, v in list(sorted_adr_types.items())[:3]},
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"✅ Prediction successful: {prediction} ({risk_level} risk)")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Error in prediction: {e}")
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health_check():
    logger.info("💊 Health check called")
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'endpoints_available': [
            '/', '/assessment', '/predict', '/generate_report', '/health', '/debug'
        ],
        'timestamp': datetime.now().isoformat()
    })

def generate_adr_type_analysis(prediction_result):
    """Generate detailed ADR type analysis"""
    top_adr_risks = prediction_result.get('top_specific_adr_risks', {})
    all_adr_types = prediction_result.get('all_adr_types', {})
    
    if not top_adr_risks:
        return "- No specific ADR type risks identified"
    
    analysis = "**Top ADR Type Risks:**\n"
    for adr_type, probability in top_adr_risks.items():
        risk_category = "High" if probability > 15 else "Moderate" if probability > 5 else "Low"
        analysis += f"- **{adr_type}:** {probability}% ({risk_category} Risk)\n"
    
    if len(all_adr_types) > 3:
        analysis += f"\n**Additional ADR Types Monitored:** {len(all_adr_types) - 3} other potential ADR types with lower probabilities"
    
    return analysis

def generate_fallback_report(patient_data, prediction_result, patient_name, clinician_name):
    """Generate a fallback report when Gemini API is not available"""
    
    risk_level = prediction_result.get('risk_level', 'Unknown')
    predicted_adr = prediction_result.get('predicted_adr_type', 'Unknown')
    no_adr_prob = prediction_result.get('no_adr_probability', 0)
    
    report = f"""# ADR Risk Assessment Report

## Patient Information
- **Patient Name:** {patient_name}
- **Assessing Clinician:** {clinician_name}
- **Assessment Date:** {datetime.now().strftime('%Y-%m-%d %H:%M')}

## Risk Assessment Summary
- **Overall Risk Level:** {risk_level}
- **Predicted ADR Type:** {predicted_adr}
- **No ADR Probability:** {no_adr_prob}%

## ADR Type Analysis
{generate_adr_type_analysis(prediction_result)}

## Clinical Recommendations
- Monitor patient closely for signs of adverse reactions
- Consider dose adjustment based on risk level
- Regular follow-up appointments recommended

---
*Note: This is a fallback report generated when AI service is unavailable.*
"""
    
    return report

if __name__ == '__main__':
    print("🐛 Debug Server Starting...")
    print("📱 Web interface: http://localhost:5000")
    print("🔍 Debug info: http://localhost:5000/debug")
    print("💊 Health check: http://localhost:5000/health")
    print("🔥 Report test: http://localhost:5000/generate_report (GET)")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=8080)