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
model_gemini = genai.GenerativeModel('gemini-2.5-flash')

# Load the trained model and preprocessor
def load_or_create_model():
    try:
        model = joblib.load('adr_model.pkl')
        preprocessor = joblib.load('adr_preprocessor.pkl')
        logger.info("Model and preprocessor loaded successfully")
        return model, preprocessor
    except Exception as e:
        logger.warning(f"Model files not found: {e}")
        logger.info("Generating synthetic data and training model...")
        
        # Generate data and train model
        try:
            import subprocess
            subprocess.run(['python', 'data_generator.py'], check=True)
            subprocess.run(['python', 'model_trainer.py'], check=True)
            
            # Try loading again
            model = joblib.load('adr_model.pkl')
            preprocessor = joblib.load('adr_preprocessor.pkl')
            logger.info("Model created and loaded successfully")
            return model, preprocessor
        except Exception as train_error:
            logger.error(f"Error creating model: {train_error}")
            return None, None

model, preprocessor = load_or_create_model()

@app.route('/')
def index():
    return render_template('loading.html')

@app.route('/patient-details')
def patient_details():
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
        categorical_cols = ['sex', 'ethnicity', 'cyp2c9', 'cyp2d6', 'indication', 'medication_name', 'drug_interactions']
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
        
        # Analyze major contributing factors
        major_adr_factors = analyze_major_adr_factors(data, sorted_adr_types)
        
        # Get medication list and ADR list
        medication_list = get_medication_list(data)
        adr_list = get_comprehensive_adr_list(sorted_adr_types)
        
        result = {
            'predicted_adr_type': prediction,
            'risk_level': risk_level,
            'no_adr_probability': round(no_adr_prob * 100, 2),
            'top_adr_risks': {k: round(v * 100, 2) for k, v in list(sorted_probabilities.items())[:5]},
            'all_adr_types': {k: round(v * 100, 2) for k, v in sorted_adr_types.items()},
            'top_specific_adr_risks': {k: round(v * 100, 2) for k, v in list(sorted_adr_types.items())[:3]},
            'major_adr_factors': major_adr_factors,
            'medication_list': medication_list,
            'adr_list': adr_list,
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
        
        TOP SPECIFIC ADR TYPE RISKS:
        {chr(10).join([f"- {adr_type}: {prob}%" for adr_type, prob in prediction_result.get('top_specific_adr_risks', {}).items()])}
        
        ALL ADR TYPE PROBABILITIES:
        {chr(10).join([f"- {adr_type}: {prob}%" for adr_type, prob in prediction_result.get('all_adr_types', {}).items()])}

        Please provide a comprehensive clinical report with the following sections:

        ## RISK ASSESSMENT SUMMARY
        Provide an executive summary of the overall ADR risk profile and predicted outcomes.

        ## KEY RISK FACTORS IDENTIFIED
        List and explain the most significant risk factors contributing to ADR potential, including patient-specific factors.

        ## MEDICATION RECOMMENDATIONS
        Based on the risk assessment, provide specific medication suggestions:
        - Alternative medications with lower ADR risk for this patient profile
        - Dose adjustments for current medications if needed
        - Drug combinations to avoid
        - Safer therapeutic alternatives considering the patient's comorbidities and risk factors

        ## CLINICAL MANAGEMENT SUGGESTIONS
        Provide detailed clinical management recommendations:
        - Immediate actions required based on risk level
        - Preventive measures to reduce ADR risk
        - Treatment modifications or optimizations
        - Specialist referrals if indicated

        ## MONITORING PROTOCOL
        Detail comprehensive monitoring recommendations:
        - Laboratory parameters to monitor and frequency
        - Clinical signs and symptoms to watch for
        - Vital signs monitoring requirements
        - Timeline for follow-up assessments

        ## PATIENT EDUCATION & COUNSELING
        Provide specific patient counseling points:
        - Warning signs to report immediately
        - Medication adherence guidance
        - Lifestyle modifications to reduce risk
        - When to seek medical attention

        ## PHARMACOGENOMIC CONSIDERATIONS
        Based on CYP enzyme status, provide:
        - Implications for current medication metabolism
        - Dose adjustment recommendations
        - Alternative medications for poor metabolizers
        - Future prescribing considerations

        ## EMERGENCY PROTOCOLS
        If high risk is identified, provide:
        - Emergency signs and symptoms to monitor
        - Immediate interventions if ADR occurs
        - When to discontinue medications
        - Emergency contact protocols

        ## FOLLOW-UP RECOMMENDATIONS
        Specify follow-up care:
        - Recommended follow-up intervals
        - Parameters to reassess
        - Criteria for medication continuation or discontinuation
        - Long-term monitoring strategy

        Format the report professionally for clinical documentation. Use clear headings, bullet points, and highlight critical information. Include specific medication names, doses, and timeframes where appropriate.
        """
        
        # Generate report using Gemini
        logger.info("Attempting to generate report with Gemini AI...")
        try:
            response = model_gemini.generate_content(prompt)
            report = response.text
            logger.info(f"Gemini response received, length: {len(report) if report else 0}")
            
            if not report or len(report.strip()) < 50:
                raise Exception("Generated report is too short or empty")
            
            ai_generated = True
                
        except Exception as gemini_error:
            logger.error(f"Gemini API error: {gemini_error}")
            logger.info("Falling back to structured report...")
            # Fallback to a structured report without AI
            report = generate_fallback_report(patient_data, prediction_result, patient_name, clinician_name)
            ai_generated = False
        
        return jsonify({
            'report': report,
            'generated_at': datetime.now().isoformat(),
            'ai_generated': ai_generated
        })
        
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        return jsonify({'error': f'Failed to generate report: {str(e)}'}), 500

@app.route('/sample_data/<sample_type>')
def get_sample_data(sample_type):
    """Get sample patient data for testing"""
    logger.info(f"Sample data requested for type: {sample_type}")
    sample_patients = {
        'high-risk': {
            'name': 'High Risk Patient',
            'age': 75, 'sex': 'M', 'ethnicity': 'White', 'height': 175, 'weight': 95, 'bmi': 31.0,
            'creatinine': 2.1, 'egfr': 35, 'ast_alt': 95, 'bilirubin': 1.8, 'albumin': 2.8,
            'diabetes': 1, 'liver_disease': 1, 'ckd': 1, 'cardiac_disease': 1, 'hypertension': 1,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Warfarin', 'index_drug_dose': 200, 'drug_interactions': 'Major',
            'concomitant_drugs_count': 12, 'indication': 'Cardiovascular',
            'cyp2c9': 'Poor', 'cyp2d6': 'PM', 'bp_systolic': 165, 'bp_diastolic': 95,
            'heart_rate': 95, 'time_since_start_days': 45, 'cyp_inhibitors_flag': 1,
            'qt_prolonging_flag': 1, 'hla_risk_allele_flag': 1, 'inpatient_flag': 1,
            'prior_adr_history': 1
        },
        'medium-risk': {
            'name': 'Medium Risk Patient',
            'age': 55, 'sex': 'F', 'ethnicity': 'Asian', 'height': 160, 'weight': 70, 'bmi': 27.3,
            'creatinine': 1.3, 'egfr': 65, 'ast_alt': 45, 'bilirubin': 0.8, 'albumin': 3.5,
            'diabetes': 1, 'liver_disease': 0, 'ckd': 0, 'cardiac_disease': 1, 'hypertension': 1,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Metformin', 'index_drug_dose': 150, 'drug_interactions': 'Moderate',
            'concomitant_drugs_count': 6, 'indication': 'Diabetes',
            'cyp2c9': 'Intermediate', 'cyp2d6': 'IM', 'bp_systolic': 140, 'bp_diastolic': 85,
            'heart_rate': 78, 'time_since_start_days': 30, 'cyp_inhibitors_flag': 0,
            'qt_prolonging_flag': 1, 'hla_risk_allele_flag': 0, 'inpatient_flag': 0,
            'prior_adr_history': 0
        },
        'low-risk': {
            'name': 'Low Risk Patient',
            'age': 35, 'sex': 'M', 'ethnicity': 'White', 'height': 180, 'weight': 78, 'bmi': 24.1,
            'creatinine': 0.9, 'egfr': 95, 'ast_alt': 25, 'bilirubin': 0.5, 'albumin': 4.2,
            'diabetes': 0, 'liver_disease': 0, 'ckd': 0, 'cardiac_disease': 0, 'hypertension': 0,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Lisinopril', 'index_drug_dose': 100, 'drug_interactions': 'Minor',
            'concomitant_drugs_count': 2, 'indication': 'Hypertension',
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

@app.route('/test_gemini')
def test_gemini():
    """Test Gemini API connectivity"""
    try:
        test_prompt = "Generate a simple test response: Hello, this is a test."
        response = model_gemini.generate_content(test_prompt)
        return jsonify({
            'status': 'success',
            'gemini_working': True,
            'test_response': response.text[:100] + "..." if len(response.text) > 100 else response.text
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'gemini_working': False,
            'error': str(e)
        }), 500

@app.route('/test_report')
def test_report():
    """Test report generation with sample data"""
    sample_patient_data = {
        'age': 65, 'sex': 'M', 'ethnicity': 'White', 'bmi': 28.5,
        'creatinine': 1.2, 'egfr': 75, 'ast_alt': 35, 'indication': 'Pain'
    }
    
    sample_prediction = {
        'predicted_adr_type': 'No ADR',
        'risk_level': 'Low',
        'no_adr_probability': 75.5
    }
    
    try:
        report = generate_fallback_report(sample_patient_data, sample_prediction, "Test Patient", "Dr. Test")
        return jsonify({
            'status': 'success',
            'report': report[:200] + "..." if len(report) > 200 else report
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/upload_liver_function', methods=['POST'])
def upload_liver_function():
    """Handle liver function test file uploads"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file type
        allowed_extensions = {'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt'}
        if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Save file (in production, use proper file storage)
        filename = f"liver_function_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        
        # For demo purposes, we'll just return success
        # In production, save to secure storage and process the file
        
        return jsonify({
            'success': True,
            'filename': filename,
            'message': 'Liver function test file uploaded successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error uploading liver function file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/get_medication_suggestions')
def get_medication_suggestions():
    """Get medication suggestions based on indication"""
    indication = request.args.get('indication', '')
    
    medication_suggestions = {
        'Cardiovascular': ['Warfarin', 'Aspirin', 'Atorvastatin', 'Lisinopril', 'Metoprolol', 'Amlodipine'],
        'Diabetes': ['Metformin', 'Insulin', 'Glipizide', 'Sitagliptin', 'Empagliflozin'],
        'Hypertension': ['Lisinopril', 'Amlodipine', 'Hydrochlorothiazide', 'Metoprolol', 'Losartan'],
        'Pain': ['Ibuprofen', 'Acetaminophen', 'Naproxen', 'Tramadol', 'Morphine'],
        'Infection': ['Amoxicillin', 'Ciprofloxacin', 'Azithromycin', 'Cephalexin', 'Doxycycline'],
        'Mental Health': ['Sertraline', 'Fluoxetine', 'Lorazepam', 'Risperidone', 'Lithium']
    }
    
    suggestions = medication_suggestions.get(indication, [])
    return jsonify({'medications': suggestions})

@app.route('/get_lab_reference')
def get_lab_reference():
    """Get laboratory reference ranges and interpretations"""
    category = request.args.get('category', 'all')
    
    if category == 'all':
        return jsonify(CLINICAL_REFERENCE_DATA['lab_ranges'])
    elif category in CLINICAL_REFERENCE_DATA['lab_ranges']:
        return jsonify(CLINICAL_REFERENCE_DATA['lab_ranges'][category])
    else:
        return jsonify({'error': 'Category not found'}), 404

@app.route('/interpret_lab_value', methods=['POST'])
def interpret_lab_value():
    """Interpret a laboratory value based on clinical reference ranges"""
    try:
        data = request.json
        logger.info(f"Lab interpretation request: {data}")
        
        test_name = data.get('test_name')
        value = data.get('value')
        sex = data.get('sex', 'M')
        
        if not test_name or value is None:
            logger.warning(f"Missing required parameters: test_name={test_name}, value={value}")
            return jsonify({'error': 'test_name and value are required'}), 400
        
        try:
            value_float = float(value)
        except (ValueError, TypeError) as e:
            logger.error(f"Invalid value format: {value}, error: {e}")
            return jsonify({'error': f'Invalid value format: {value}'}), 400
        
        interpretations = get_lab_interpretation(test_name, value_float, sex)
        logger.info(f"Lab interpretation result: {len(interpretations)} interpretations found")
        
        return jsonify({
            'test_name': test_name,
            'value': value,
            'sex': sex,
            'interpretations': interpretations,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error interpreting lab value: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/get_drug_adrs')
def get_drug_adrs():
    """Get common ADRs for specific drug classes"""
    drug_class = request.args.get('drug_class', '')
    
    if drug_class:
        adrs = CLINICAL_REFERENCE_DATA['drug_adrs'].get(drug_class, [])
        return jsonify({'drug_class': drug_class, 'common_adrs': adrs})
    else:
        return jsonify(CLINICAL_REFERENCE_DATA['drug_adrs'])

@app.route('/enhanced_lab_analysis', methods=['POST'])
def enhanced_lab_analysis():
    """Provide comprehensive laboratory analysis with clinical interpretations"""
    try:
        data = request.json
        patient_data = data.get('patient_data', {})
        sex = patient_data.get('sex', 'M')
        
        lab_analysis = {
            'renal_function': {},
            'liver_function': {},
            'overall_assessment': [],
            'monitoring_recommendations': []
        }
        
        # Analyze renal function
        creatinine = patient_data.get('creatinine')
        egfr = patient_data.get('egfr')
        
        if creatinine:
            creat_interp = get_lab_interpretation('creatinine', creatinine, sex)
            lab_analysis['renal_function']['creatinine'] = {
                'value': creatinine,
                'unit': 'mg/dL',
                'interpretations': creat_interp
            }
        
        if egfr:
            egfr_interp = get_lab_interpretation('egfr', egfr, sex)
            lab_analysis['renal_function']['egfr'] = {
                'value': egfr,
                'unit': 'mL/min/1.73m²',
                'interpretations': egfr_interp
            }
        
        # Analyze liver function
        ast_alt = patient_data.get('ast_alt')
        bilirubin = patient_data.get('bilirubin')
        albumin = patient_data.get('albumin')
        
        if ast_alt:
            ast_interp = get_lab_interpretation('ast', ast_alt, sex)
            lab_analysis['liver_function']['ast_alt'] = {
                'value': ast_alt,
                'unit': 'U/L',
                'interpretations': ast_interp
            }
        
        if bilirubin:
            bili_interp = get_lab_interpretation('bilirubin', bilirubin, sex)
            lab_analysis['liver_function']['bilirubin'] = {
                'value': bilirubin,
                'unit': 'mg/dL',
                'interpretations': bili_interp
            }
        
        if albumin:
            alb_interp = get_lab_interpretation('albumin', albumin, sex)
            lab_analysis['liver_function']['albumin'] = {
                'value': albumin,
                'unit': 'g/dL',
                'interpretations': alb_interp
            }
        
        # Overall assessment
        high_risk_findings = []
        moderate_risk_findings = []
        
        for category in ['renal_function', 'liver_function']:
            for test, data in lab_analysis[category].items():
                for interp in data.get('interpretations', []):
                    if interp['severity'] == 'High':
                        high_risk_findings.append(f"{test.upper()}: {interp['clinical_significance']}")
                    elif interp['severity'] == 'Moderate':
                        moderate_risk_findings.append(f"{test.upper()}: {interp['clinical_significance']}")
        
        if high_risk_findings:
            lab_analysis['overall_assessment'].append({
                'level': 'High Risk',
                'findings': high_risk_findings,
                'recommendation': 'Immediate clinical attention required'
            })
        
        if moderate_risk_findings:
            lab_analysis['overall_assessment'].append({
                'level': 'Moderate Risk',
                'findings': moderate_risk_findings,
                'recommendation': 'Enhanced monitoring recommended'
            })
        
        # Monitoring recommendations
        if creatinine and creatinine > 1.5:
            lab_analysis['monitoring_recommendations'].append('Monitor renal function weekly')
        if ast_alt and ast_alt > 80:
            lab_analysis['monitoring_recommendations'].append('Monitor liver function every 3-7 days')
        if egfr and egfr < 60:
            lab_analysis['monitoring_recommendations'].append('Adjust drug dosing for renal impairment')
        
        return jsonify({
            'lab_analysis': lab_analysis,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in enhanced lab analysis: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/test')
def test_route():
    """Simple test route to verify server is working"""
    return jsonify({'message': 'Server is working!', 'timestamp': datetime.now().isoformat()})

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

def analyze_major_adr_factors(patient_data, adr_types):
    """Analyze which parameters contribute most to major ADR risk using clinical reference data"""
    factors = []
    sex = patient_data.get('sex', 'M')
    
    # Age factor
    age = patient_data.get('age', 0)
    if age > 65:
        factors.append({
            'factor': 'Advanced Age',
            'value': f"{age} years",
            'risk_contribution': 'High',
            'description': 'Elderly patients have increased ADR susceptibility due to altered pharmacokinetics and pharmacodynamics',
            'clinical_reference': 'Age >65 years is a major risk factor for ADRs'
        })
    
    # Kidney function with clinical interpretation
    creatinine = patient_data.get('creatinine', 1.0)
    egfr = patient_data.get('egfr', 100)
    
    creat_interp = get_lab_interpretation('creatinine', creatinine, sex)
    egfr_interp = get_lab_interpretation('egfr', egfr, sex)
    
    if creat_interp or egfr_interp:
        severity = 'High' if egfr < 30 or creatinine > 2.0 else 'Medium'
        factors.append({
            'factor': 'Renal Impairment',
            'value': f"Creatinine: {creatinine} mg/dL, eGFR: {egfr} mL/min/1.73m²",
            'risk_contribution': severity,
            'description': 'Impaired renal clearance increases drug accumulation and toxicity risk',
            'clinical_reference': f"Normal creatinine: {CLINICAL_REFERENCE_DATA['lab_ranges']['renal'][f'creatinine_{sex.lower()}ale']['range']}"
        })
    
    # Liver function with clinical interpretation
    ast_alt = patient_data.get('ast_alt', 30)
    bilirubin = patient_data.get('bilirubin', 0.8)
    albumin = patient_data.get('albumin', 4.0)
    
    liver_issues = []
    if ast_alt > 40:
        liver_issues.append(f"AST/ALT: {ast_alt} U/L (Normal: 10-40 U/L)")
    if bilirubin > 1.2:
        liver_issues.append(f"Bilirubin: {bilirubin} mg/dL (Normal: 0.2-1.2 mg/dL)")
    if albumin < 3.5:
        liver_issues.append(f"Albumin: {albumin} g/dL (Normal: 3.5-5.0 g/dL)")
    
    if liver_issues:
        severity = 'High' if ast_alt > 120 or bilirubin > 3.0 or albumin < 2.5 else 'Medium'
        factors.append({
            'factor': 'Hepatic Impairment',
            'value': '; '.join(liver_issues),
            'risk_contribution': severity,
            'description': 'Hepatic dysfunction affects drug metabolism and increases ADR risk',
            'clinical_reference': 'Liver function abnormalities require dose adjustments'
        })
    
    # Polypharmacy
    drug_count = patient_data.get('concomitant_drugs_count', 0)
    if drug_count > 5:
        factors.append({
            'factor': 'Polypharmacy',
            'value': f"{drug_count} medications",
            'risk_contribution': 'High' if drug_count > 10 else 'Medium',
            'description': 'Multiple medications exponentially increase drug-drug interaction risk',
            'clinical_reference': '>5 medications significantly increases ADR risk'
        })
    
    # Pharmacogenomics
    cyp2d6 = patient_data.get('cyp2d6', 'EM')
    cyp2c9 = patient_data.get('cyp2c9', 'Wild')
    
    if cyp2d6 in ['PM', 'Poor'] or cyp2c9 in ['Poor']:
        factors.append({
            'factor': 'Poor Metabolizer Status',
            'value': f"CYP2D6: {cyp2d6}, CYP2C9: {cyp2c9}",
            'risk_contribution': 'High',
            'description': 'Reduced drug metabolism capacity leading to drug accumulation and toxicity',
            'clinical_reference': 'Poor metabolizers require 25-50% dose reduction for affected drugs'
        })
    
    # Drug interactions with specific drug class ADRs
    interactions = patient_data.get('drug_interactions', 'None')
    medication_name = patient_data.get('medication_name', '')
    
    if interactions in ['Major', 'Severe']:
        # Get specific ADRs for the medication class
        drug_specific_adrs = []
        for drug_class, adrs in CLINICAL_REFERENCE_DATA['drug_adrs'].items():
            if any(drug.lower() in medication_name.lower() for drug in drug_class.split('/')):
                drug_specific_adrs.extend(adrs)
        
        factors.append({
            'factor': 'Major Drug Interactions',
            'value': f"{interactions} interactions with {medication_name}",
            'risk_contribution': 'High',
            'description': f'Significant drug-drug interactions increase risk of: {", ".join(drug_specific_adrs[:3]) if drug_specific_adrs else "various ADRs"}',
            'clinical_reference': 'Major interactions require close monitoring or alternative therapy'
        })
    
    # Comorbidity burden
    comorbidities = []
    if patient_data.get('diabetes') == 1:
        comorbidities.append('Diabetes')
    if patient_data.get('cardiac_disease') == 1:
        comorbidities.append('Cardiac disease')
    if patient_data.get('liver_disease') == 1:
        comorbidities.append('Liver disease')
    if patient_data.get('ckd') == 1:
        comorbidities.append('CKD')
    
    if len(comorbidities) >= 3:
        factors.append({
            'factor': 'Multiple Comorbidities',
            'value': f"{len(comorbidities)} conditions: {', '.join(comorbidities)}",
            'risk_contribution': 'High',
            'description': 'Multiple comorbidities increase ADR susceptibility and complicate management',
            'clinical_reference': '≥3 comorbidities significantly increase ADR risk'
        })
    
    return factors

def get_medication_list(patient_data):
    """Generate comprehensive medication list with details"""
    medications = []
    
    # Primary medication
    primary_med = patient_data.get('medication_name', 'Unknown')
    dose = patient_data.get('index_drug_dose', 0)
    indication = patient_data.get('indication', 'Unknown')
    
    medications.append({
        'name': primary_med,
        'dose': f"{dose} mg" if dose else "Dose not specified",
        'indication': indication,
        'type': 'Primary',
        'risk_level': get_medication_risk_level(primary_med)
    })
    
    # Concomitant medications (simulated based on common combinations)
    concomitant_count = patient_data.get('concomitant_drugs_count', 0)
    if concomitant_count > 0:
        common_concomitants = get_common_concomitant_drugs(primary_med, indication, concomitant_count)
        medications.extend(common_concomitants)
    
    return medications

def get_common_concomitant_drugs(primary_med, indication, count):
    """Get common concomitant drugs based on primary medication and indication"""
    concomitant_drugs = {
        'Warfarin': ['Aspirin 81mg', 'Atorvastatin 20mg', 'Metoprolol 50mg', 'Lisinopril 10mg'],
        'Metformin': ['Lisinopril 10mg', 'Atorvastatin 40mg', 'Aspirin 81mg', 'Metoprolol 25mg'],
        'Lisinopril': ['Hydrochlorothiazide 25mg', 'Amlodipine 5mg', 'Metformin 500mg', 'Atorvastatin 20mg'],
        'Atorvastatin': ['Aspirin 81mg', 'Lisinopril 10mg', 'Metformin 500mg', 'Amlodipine 5mg']
    }
    
    indication_drugs = {
        'Cardiovascular': ['Aspirin 81mg', 'Atorvastatin 20mg', 'Metoprolol 50mg', 'Lisinopril 10mg'],
        'Diabetes': ['Metformin 500mg', 'Lisinopril 10mg', 'Atorvastatin 40mg', 'Aspirin 81mg'],
        'Hypertension': ['Amlodipine 5mg', 'Hydrochlorothiazide 25mg', 'Metoprolol 25mg', 'Lisinopril 10mg']
    }
    
    # Get drugs based on primary medication or indication
    drug_list = concomitant_drugs.get(primary_med, indication_drugs.get(indication, [
        'Aspirin 81mg', 'Lisinopril 10mg', 'Atorvastatin 20mg', 'Metformin 500mg'
    ]))
    
    medications = []
    for i, drug in enumerate(drug_list[:count]):
        drug_parts = drug.split(' ')
        name = drug_parts[0]
        dose = ' '.join(drug_parts[1:]) if len(drug_parts) > 1 else "Standard dose"
        
        medications.append({
            'name': name,
            'dose': dose,
            'indication': 'Concomitant therapy',
            'type': 'Concomitant',
            'risk_level': get_medication_risk_level(name)
        })
    
    return medications

def get_medication_risk_level(medication):
    """Determine risk level for specific medications"""
    high_risk_meds = ['Warfarin', 'Digoxin', 'Lithium', 'Phenytoin', 'Theophylline']
    medium_risk_meds = ['Metformin', 'Atorvastatin', 'Lisinopril', 'Metoprolol']
    
    if medication in high_risk_meds:
        return 'High'
    elif medication in medium_risk_meds:
        return 'Medium'
    else:
        return 'Low'

# Clinical Reference Data
CLINICAL_REFERENCE_DATA = {
    'lab_ranges': {
        'hematology': {
            'hemoglobin_male': {'range': '13.5-17.5 g/dL', 'notes': 'Low = anemia; high = polycythemia'},
            'hemoglobin_female': {'range': '12-16 g/dL', 'notes': 'Low = anemia; high = polycythemia'},
            'hematocrit_male': {'range': '41-53%', 'notes': 'Proportion of RBCs'},
            'hematocrit_female': {'range': '36-46%', 'notes': 'Proportion of RBCs'},
            'wbc_count': {'range': '4,000-11,000 /µL', 'notes': '↑ infection, ↓ bone marrow suppression'},
            'platelet_count': {'range': '150,000-400,000 /µL', 'notes': 'Bleeding risk if low'},
            'esr_male': {'range': '0-15 mm/hr', 'notes': '↑ inflammation'},
            'esr_female': {'range': '0-20 mm/hr', 'notes': '↑ inflammation'}
        },
        'renal': {
            'bun': {'range': '7-20 mg/dL', 'notes': '↑ renal impairment'},
            'creatinine_male': {'range': '0.7-1.3 mg/dL', 'notes': 'Kidney function marker'},
            'creatinine_female': {'range': '0.6-1.1 mg/dL', 'notes': 'Kidney function marker'},
            'bun_creatinine_ratio': {'range': '10:1 – 20:1', 'notes': 'Dehydration if elevated'},
            'uric_acid_male': {'range': '3.5-7.2 mg/dL', 'notes': '↑ gout'},
            'uric_acid_female': {'range': '2.6-6.0 mg/dL', 'notes': '↑ gout'},
            'egfr': {'range': '≥90 mL/min/1.73 m²', 'notes': '↓ = CKD'}
        },
        'liver': {
            'total_bilirubin': {'range': '0.2-1.2 mg/dL', 'notes': '↑ jaundice'},
            'direct_bilirubin': {'range': '0.0-0.3 mg/dL', 'notes': 'Conjugated bilirubin'},
            'ast': {'range': '10-40 U/L', 'notes': '↑ liver/muscle injury'},
            'alt': {'range': '7-56 U/L', 'notes': 'Specific for liver'},
            'alp': {'range': '40-120 U/L', 'notes': '↑ bone/liver disease'},
            'ggt': {'range': '9-48 U/L', 'notes': '↑ alcohol use'},
            'albumin': {'range': '3.5-5.0 g/dL', 'notes': '↓ liver disease'},
            'total_protein': {'range': '6.0-8.3 g/dL', 'notes': 'Nutritional status'},
            'ag_ratio': {'range': '1.0-2.0', 'notes': 'Albumin/Globulin ratio'}
        },
        'cardiac': {
            'troponin_i': {'range': '<0.04 ng/mL', 'notes': '↑ MI'},
            'ck_mb': {'range': '0-6% of total CK', 'notes': 'Cardiac marker'},
            'bnp': {'range': '<100 pg/mL', 'notes': '↑ heart failure'},
            'myoglobin': {'range': '25-72 ng/mL', 'notes': 'Early marker'}
        },
        'coagulation': {
            'pt': {'range': '11-13.5 sec', 'notes': '↑ in liver disease, warfarin'},
            'inr_normal': {'range': '0.8-1.2', 'notes': 'Normal range'},
            'inr_therapeutic': {'range': '2-3', 'notes': 'Therapeutic on warfarin'},
            'aptt': {'range': '25-35 sec', 'notes': '↑ in heparin use'},
            'fibrinogen': {'range': '200-400 mg/dL', 'notes': 'Clotting factor'}
        }
    },
    'drug_adrs': {
        'NSAIDs': ['Ulcer', 'renal damage'],
        'Opioids': ['Constipation', 'sedation'],
        'ACE inhibitors': ['Cough', 'angioedema'],
        'Beta-blockers': ['Bradycardia', 'fatigue'],
        'Statins': ['Myopathy', '↑LFTs'],
        'Penicillins': ['Allergy', 'rash'],
        'Sulfonamides': ['Rash', 'SJS'],
        'Fluoroquinolones': ['Tendon rupture', 'QT↑'],
        'Phenytoin': ['Gingival hyperplasia', 'ataxia'],
        'Carbamazepine': ['Rash', 'hyponatremia'],
        'Valproate': ['Hepatotoxicity', 'teratogenic'],
        'Clozapine': ['Agranulocytosis'],
        'SSRIs': ['Nausea', 'sexual issues'],
        'Corticosteroids': ['Weight gain', 'hyperglycemia'],
        'Heparin/Warfarin': ['Bleeding'],
        'Aminoglycosides': ['Nephro- & ototoxicity'],
        'Amiodarone': ['Pulmonary fibrosis', 'thyroid disorders'],
        'Isoniazid': ['Neuropathy', 'hepatitis'],
        'Ethambutol': ['Optic neuritis'],
        'Rifampicin': ['Red-orange fluids'],
        'Tetracyclines': ['Teeth discoloration', 'photosensitivity'],
        'Methotrexate': ['Bone marrow suppression'],
        'Allopurinol': ['Rash', 'hypersensitivity']
    }
}

def get_lab_interpretation(test_name, value, sex='M'):
    """Interpret laboratory values based on clinical reference ranges"""
    interpretations = []
    logger.info(f"Interpreting lab value: {test_name}={value} for {sex}")
    
    # Hematology interpretations
    if test_name == 'hemoglobin':
        normal_range = CLINICAL_REFERENCE_DATA['lab_ranges']['hematology'][f'hemoglobin_{sex.lower()}ale']['range']
        if sex == 'M':
            if value < 13.5:
                interpretations.append({'status': 'Low', 'clinical_significance': 'Anemia', 'severity': 'Moderate'})
            elif value > 17.5:
                interpretations.append({'status': 'High', 'clinical_significance': 'Polycythemia', 'severity': 'Moderate'})
        else:
            if value < 12:
                interpretations.append({'status': 'Low', 'clinical_significance': 'Anemia', 'severity': 'Moderate'})
            elif value > 16:
                interpretations.append({'status': 'High', 'clinical_significance': 'Polycythemia', 'severity': 'Moderate'})
    
    # Renal function interpretations
    elif test_name == 'creatinine':
        if sex == 'M':
            if value > 1.3:
                interpretations.append({'status': 'High', 'clinical_significance': 'Renal impairment', 'severity': 'High' if value > 2.0 else 'Moderate'})
        else:
            if value > 1.1:
                interpretations.append({'status': 'High', 'clinical_significance': 'Renal impairment', 'severity': 'High' if value > 2.0 else 'Moderate'})
    
    elif test_name == 'egfr':
        if value < 60:
            interpretations.append({'status': 'Low', 'clinical_significance': 'Chronic Kidney Disease', 'severity': 'High' if value < 30 else 'Moderate'})
        elif value < 90:
            interpretations.append({'status': 'Low', 'clinical_significance': 'Mild kidney dysfunction', 'severity': 'Low'})
    
    # Liver function interpretations
    elif test_name in ['ast', 'alt', 'ast_alt']:
        if value > 40:
            interpretations.append({'status': 'High', 'clinical_significance': 'Liver injury/inflammation', 'severity': 'High' if value > 120 else 'Moderate'})
    
    elif test_name == 'bilirubin':
        if value > 1.2:
            interpretations.append({'status': 'High', 'clinical_significance': 'Jaundice risk', 'severity': 'Moderate' if value < 3.0 else 'High'})
    
    elif test_name == 'albumin':
        if value < 3.5:
            interpretations.append({'status': 'Low', 'clinical_significance': 'Liver dysfunction/malnutrition', 'severity': 'Moderate'})
    
    logger.info(f"Lab interpretation complete: {test_name}={value} -> {len(interpretations)} interpretations")
    return interpretations

def get_comprehensive_adr_list(adr_types):
    """Generate comprehensive ADR list with clinical details and reference data"""
    adr_details = {
        'Hepatotoxicity': {
            'category': 'Hepatic',
            'severity': 'Severe',
            'onset': '2-8 weeks',
            'symptoms': ['Elevated liver enzymes', 'Jaundice', 'Abdominal pain', 'Fatigue'],
            'monitoring': 'Liver function tests every 2-4 weeks',
            'lab_markers': ['AST >120 U/L', 'ALT >120 U/L', 'Bilirubin >3.0 mg/dL'],
            'common_drugs': ['Acetaminophen', 'Statins', 'Isoniazid', 'Valproate']
        },
        'Nephrotoxicity': {
            'category': 'Renal',
            'severity': 'Severe',
            'onset': '1-4 weeks',
            'symptoms': ['Elevated creatinine', 'Decreased urine output', 'Edema'],
            'monitoring': 'Serum creatinine and eGFR weekly',
            'lab_markers': ['Creatinine >1.5x baseline', 'eGFR <60 mL/min/1.73m²', 'BUN >40 mg/dL'],
            'common_drugs': ['NSAIDs', 'Aminoglycosides', 'ACE inhibitors']
        },
        'Cardiotoxicity': {
            'category': 'Cardiac',
            'severity': 'Severe',
            'onset': 'Variable',
            'symptoms': ['Arrhythmias', 'Heart failure', 'QT prolongation'],
            'monitoring': 'ECG and echocardiogram as indicated',
            'lab_markers': ['Troponin I >0.04 ng/mL', 'BNP >400 pg/mL', 'QTc >500 ms'],
            'common_drugs': ['Amiodarone', 'Doxorubicin', 'Fluoroquinolones']
        },
        'Gastrointestinal': {
            'category': 'GI',
            'severity': 'Moderate',
            'onset': '1-7 days',
            'symptoms': ['Nausea', 'Vomiting', 'Diarrhea', 'Abdominal pain'],
            'monitoring': 'Clinical assessment and electrolytes',
            'lab_markers': ['Electrolyte imbalance', 'Dehydration markers'],
            'common_drugs': ['NSAIDs', 'Antibiotics', 'Chemotherapy']
        },
        'Neurological': {
            'category': 'CNS',
            'severity': 'Moderate to Severe',
            'onset': '1-14 days',
            'symptoms': ['Dizziness', 'Confusion', 'Seizures', 'Peripheral neuropathy'],
            'monitoring': 'Neurological assessment and relevant tests',
            'lab_markers': ['Altered mental status', 'Abnormal reflexes'],
            'common_drugs': ['Phenytoin', 'Carbamazepine', 'Isoniazid']
        },
        'Hematological': {
            'category': 'Hematologic',
            'severity': 'Severe',
            'onset': '1-6 weeks',
            'symptoms': ['Anemia', 'Thrombocytopenia', 'Neutropenia'],
            'monitoring': 'Complete blood count weekly',
            'lab_markers': ['Hb <10 g/dL', 'Platelets <100,000/µL', 'WBC <4,000/µL'],
            'common_drugs': ['Methotrexate', 'Clozapine', 'Chemotherapy']
        },
        'Dermatological': {
            'category': 'Skin',
            'severity': 'Mild to Severe',
            'onset': '1-21 days',
            'symptoms': ['Rash', 'Stevens-Johnson syndrome', 'Photosensitivity'],
            'monitoring': 'Skin examination and patient education',
            'lab_markers': ['Eosinophilia', 'Elevated liver enzymes in severe cases'],
            'common_drugs': ['Sulfonamides', 'Penicillins', 'Allopurinol']
        }
    }
    
    adr_list = []
    for adr_type, probability in adr_types.items():
        if adr_type in adr_details:
            details = adr_details[adr_type]
            adr_list.append({
                'name': adr_type,
                'probability': round(probability * 100, 2),
                'category': details['category'],
                'severity': details['severity'],
                'onset': details['onset'],
                'symptoms': details['symptoms'],
                'monitoring': details['monitoring']
            })
    
    # Add common ADRs if not present
    common_adrs = ['Gastrointestinal', 'Dermatological', 'Neurological']
    existing_names = [adr['name'] for adr in adr_list]
    
    for common_adr in common_adrs:
        if common_adr not in existing_names and common_adr in adr_details:
            details = adr_details[common_adr]
            adr_list.append({
                'name': common_adr,
                'probability': 5.0,  # Default low probability
                'category': details['category'],
                'severity': details['severity'],
                'onset': details['onset'],
                'symptoms': details['symptoms'],
                'monitoring': details['monitoring']
            })
    
    return sorted(adr_list, key=lambda x: x['probability'], reverse=True)

def generate_fallback_report(patient_data, prediction_result, patient_name, clinician_name):
    """Generate a fallback report when Gemini API is not available"""
    
    risk_level = prediction_result.get('risk_level', 'Unknown')
    predicted_adr = prediction_result.get('predicted_adr_type', 'Unknown')
    no_adr_prob = prediction_result.get('no_adr_probability', 0)
    
    # Determine key risk factors
    risk_factors = []
    if patient_data.get('age', 0) > 65:
        risk_factors.append("Advanced age (>65 years)")
    if patient_data.get('ckd', 0) == 1:
        risk_factors.append("Chronic kidney disease")
    if patient_data.get('liver_disease', 0) == 1:
        risk_factors.append("Liver disease")
    if patient_data.get('cardiac_disease', 0) == 1:
        risk_factors.append("Cardiac disease")
    if patient_data.get('concomitant_drugs_count', 0) > 5:
        risk_factors.append("Polypharmacy (>5 medications)")
    if patient_data.get('cyp2d6') == 'PM':
        risk_factors.append("Poor CYP2D6 metabolizer")
    if patient_data.get('prior_adr_history', 0) == 1:
        risk_factors.append("Previous ADR history")
    
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

## Key Risk Factors Identified
{chr(10).join([f"- {factor}" for factor in risk_factors]) if risk_factors else "- No significant risk factors identified"}

## Clinical Recommendations
- Monitor patient closely for signs of {predicted_adr.lower() if predicted_adr != 'No ADR' else 'any adverse reactions'}
- Consider dose adjustment based on risk level
- Regular follow-up appointments recommended
- Patient education on potential side effects

## Monitoring Suggestions
- Baseline and periodic laboratory monitoring
- Vital signs monitoring as clinically indicated
- Patient-reported outcome assessments

## Additional Considerations
- This assessment is based on statistical modeling
- Clinical judgment should always supersede algorithmic recommendations
- Consider individual patient factors not captured in the model

---
*Note: This report was generated using a fallback system. For enhanced AI-powered analysis, please ensure Gemini AI service is available.*
"""
    
    return report

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)