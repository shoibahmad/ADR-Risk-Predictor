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

# ═══════════════════════════════════════════════════════════════════════════════════════
# 🧬 ADVANCED PHARMACOGENOMICS & PRECISION MEDICINE MODULE
# ═══════════════════════════════════════════════════════════════════════════════════════

class AdvancedPharmacogenomics:
    """Advanced pharmacogenomic analysis and personalized dosing algorithms"""
    
    def __init__(self):
        # CYP Enzyme Activity Scores
        self.cyp_activity_scores = {
            'CYP2C9': {'Poor': 0.1, 'Intermediate': 0.5, 'Wild': 1.0, 'Rapid': 1.5},
            'CYP2D6': {'PM': 0.0, 'IM': 0.5, 'EM': 1.0, 'UM': 2.0},
            'CYP3A4': {'Poor': 0.2, 'Intermediate': 0.6, 'Normal': 1.0, 'Rapid': 1.8},
            'CYP1A2': {'Slow': 0.3, 'Intermediate': 0.7, 'Normal': 1.0, 'Rapid': 1.6},
            'CYP2B6': {'Poor': 0.1, 'Intermediate': 0.4, 'Normal': 1.0, 'Rapid': 1.7},
            'CYP2C19': {'PM': 0.0, 'IM': 0.3, 'EM': 1.0, 'RM': 1.5, 'UM': 2.5}
        }
        
        # Transporter Activity Profiles
        self.transporter_profiles = {
            'SLCO1B1': {
                '*1/*1': {'activity': 1.0, 'risk': 'Low'},
                '*5/*5': {'activity': 0.2, 'risk': 'High'},
                '*15/*15': {'activity': 0.3, 'risk': 'High'},
                '*1/*5': {'activity': 0.6, 'risk': 'Intermediate'},
                '*1/*15': {'activity': 0.65, 'risk': 'Intermediate'}
            },
            'ABCB1': {
                'CC': {'activity': 1.0, 'risk': 'Low'},
                'CT': {'activity': 0.7, 'risk': 'Intermediate'},
                'TT': {'activity': 0.4, 'risk': 'High'}
            },
            'ABCG2': {
                'Wild/Wild': {'activity': 1.0, 'risk': 'Low'},
                'Wild/Variant': {'activity': 0.6, 'risk': 'Intermediate'},
                'Variant/Variant': {'activity': 0.3, 'risk': 'High'}
            }
        }
        
        # HLA Risk Alleles for Hypersensitivity Reactions
        self.hla_drug_associations = {
            'HLA-B*5701': {
                'drugs': ['Abacavir', 'Flucloxacillin'],
                'reaction': 'Severe Hypersensitivity Syndrome',
                'risk_level': 'Critical'
            },
            'HLA-B*5801': {
                'drugs': ['Allopurinol', 'Carbamazepine'],
                'reaction': 'Stevens-Johnson Syndrome/TEN',
                'risk_level': 'Critical'
            },
            'HLA-A*3101': {
                'drugs': ['Carbamazepine', 'Phenytoin'],
                'reaction': 'Severe Cutaneous Reactions',
                'risk_level': 'High'
            },
            'HLA-DRB1*0701': {
                'drugs': ['Lapatinib'],
                'reaction': 'Drug-Induced Liver Injury',
                'risk_level': 'High'
            },
            'HLA-DQA1*0201': {
                'drugs': ['Terbinafine'],
                'reaction': 'Hepatotoxicity',
                'risk_level': 'Moderate'
            }
        }

    def analyze_expanded_cyp_profile(self, patient_data):
        """Comprehensive CYP enzyme analysis"""
        cyp_analysis = {
            'CYP2C9': patient_data.get('cyp2c9', 'Wild'),
            'CYP2D6': patient_data.get('cyp2d6', 'EM'),
            'CYP3A4': patient_data.get('cyp3a4', 'Normal'),
            'CYP1A2': patient_data.get('cyp1a2', 'Normal'),
            'CYP2B6': patient_data.get('cyp2b6', 'Normal'),
            'CYP2C19': patient_data.get('cyp2c19', 'EM')
        }
        
        detailed_analysis = {}
        overall_metabolism_score = 0
        
        for enzyme, genotype in cyp_analysis.items():
            activity_score = self.cyp_activity_scores[enzyme].get(genotype, 1.0)
            
            # Determine risk level
            if activity_score <= 0.2:
                risk_level = 'Critical'
                clinical_impact = 'Severe impairment - major dose reduction required'
            elif activity_score <= 0.5:
                risk_level = 'High'
                clinical_impact = 'Moderate impairment - dose reduction recommended'
            elif activity_score >= 1.5:
                risk_level = 'Moderate'
                clinical_impact = 'Enhanced metabolism - dose increase may be needed'
            else:
                risk_level = 'Low'
                clinical_impact = 'Normal metabolism expected'
            
            detailed_analysis[enzyme] = {
                'genotype': genotype,
                'activity_score': activity_score,
                'risk_level': risk_level,
                'clinical_impact': clinical_impact,
                'affected_drugs': self.get_cyp_substrate_drugs(enzyme)
            }
            
            overall_metabolism_score += activity_score
        
        # Calculate composite metabolism score
        composite_score = overall_metabolism_score / len(cyp_analysis)
        
        return {
            'individual_enzymes': detailed_analysis,
            'composite_metabolism_score': composite_score,
            'overall_risk_assessment': self.assess_overall_cyp_risk(composite_score),
            'clinical_recommendations': self.generate_cyp_recommendations(detailed_analysis)
        }

    def analyze_transporter_genetics(self, patient_data):
        """Comprehensive drug transporter genetic analysis"""
        transporter_data = {
            'SLCO1B1': patient_data.get('slco1b1_genotype', '*1/*1'),
            'ABCB1': patient_data.get('abcb1_genotype', 'CC'),
            'ABCG2': patient_data.get('abcg2_genotype', 'Wild/Wild')
        }
        
        transporter_analysis = {}
        
        for transporter, genotype in transporter_data.items():
            profile = self.transporter_profiles[transporter].get(genotype, {'activity': 1.0, 'risk': 'Unknown'})
            
            transporter_analysis[transporter] = {
                'genotype': genotype,
                'activity_level': profile['activity'],
                'risk_category': profile['risk'],
                'clinical_implications': self.get_transporter_implications(transporter, profile),
                'affected_drugs': self.get_transporter_substrate_drugs(transporter)
            }
        
        return {
            'transporter_profiles': transporter_analysis,
            'drug_disposition_risk': self.calculate_disposition_risk(transporter_analysis),
            'monitoring_recommendations': self.generate_transporter_monitoring(transporter_analysis)
        }

    def analyze_hla_hypersensitivity_risk(self, patient_data, medication_name):
        """Detailed HLA typing analysis for hypersensitivity risk"""
        hla_alleles = {
            'HLA-A': patient_data.get('hla_a_typing', []),
            'HLA-B': patient_data.get('hla_b_typing', []),
            'HLA-DRB1': patient_data.get('hla_drb1_typing', [])
        }
        
        risk_assessment = {
            'high_risk_alleles_present': [],
            'drug_specific_risks': [],
            'overall_hypersensitivity_risk': 'Low',
            'clinical_recommendations': []
        }
        
        # Check for high-risk HLA alleles
        all_patient_alleles = []
        for locus, alleles in hla_alleles.items():
            if isinstance(alleles, list):
                all_patient_alleles.extend(alleles)
            elif alleles:
                all_patient_alleles.append(alleles)
        
        for risk_allele, risk_data in self.hla_drug_associations.items():
            if risk_allele in all_patient_alleles:
                risk_assessment['high_risk_alleles_present'].append({
                    'allele': risk_allele,
                    'associated_drugs': risk_data['drugs'],
                    'reaction_type': risk_data['reaction'],
                    'risk_level': risk_data['risk_level']
                })
                
                # Check if current medication is associated with this allele
                if medication_name in risk_data['drugs']:
                    risk_assessment['drug_specific_risks'].append({
                        'medication': medication_name,
                        'hla_allele': risk_allele,
                        'reaction_risk': risk_data['reaction'],
                        'recommendation': 'CONTRAINDICATED - Alternative therapy required'
                    })
                    risk_assessment['overall_hypersensitivity_risk'] = 'Critical'
        
        # Generate clinical recommendations
        if risk_assessment['high_risk_alleles_present']:
            risk_assessment['clinical_recommendations'] = self.generate_hla_recommendations(
                risk_assessment['high_risk_alleles_present'], medication_name
            )
        
        return risk_assessment

    def calculate_personalized_dosing(self, patient_data, medication_name, standard_dose):
        """Advanced personalized dosing algorithms"""
        
        # Get patient factors
        age = patient_data.get('age', 50)
        weight = patient_data.get('weight', 70)
        creatinine = patient_data.get('creatinine', 1.0)
        egfr = patient_data.get('egfr', 90)
        ast_alt = patient_data.get('ast_alt', 30)
        
        # CYP enzyme analysis
        cyp_analysis = self.analyze_expanded_cyp_profile(patient_data)
        
        # Base dose adjustment factors
        dose_adjustments = {
            'age_factor': self.calculate_age_adjustment(age),
            'weight_factor': self.calculate_weight_adjustment(weight),
            'renal_factor': self.calculate_renal_adjustment(egfr, creatinine),
            'hepatic_factor': self.calculate_hepatic_adjustment(ast_alt),
            'genetic_factor': self.calculate_genetic_adjustment(cyp_analysis, medication_name)
        }
        
        # Calculate composite dose adjustment
        composite_factor = 1.0
        for factor_name, factor_value in dose_adjustments.items():
            composite_factor *= factor_value
        
        # Apply safety constraints
        min_dose_factor = 0.1  # Never reduce below 10% of standard dose
        max_dose_factor = 2.0  # Never exceed 200% of standard dose
        
        final_dose_factor = max(min_dose_factor, min(max_dose_factor, composite_factor))
        recommended_dose = standard_dose * final_dose_factor
        
        return {
            'standard_dose': standard_dose,
            'recommended_dose': round(recommended_dose, 1),
            'dose_adjustment_factor': round(final_dose_factor, 2),
            'individual_adjustments': dose_adjustments,
            'dosing_rationale': self.generate_dosing_rationale(dose_adjustments, medication_name),
            'monitoring_requirements': self.generate_dosing_monitoring(final_dose_factor, medication_name),
            'tdm_recommendations': self.generate_tdm_recommendations(medication_name, final_dose_factor)
        }

    def bayesian_dose_optimization(self, patient_data, medication_name, current_dose, measured_levels):
        """Bayesian dose optimization based on therapeutic drug monitoring"""
        
        # Population pharmacokinetic parameters (example for common drugs)
        pop_pk_params = self.get_population_pk_parameters(medication_name)
        
        if not pop_pk_params:
            return {'error': 'Population PK parameters not available for this medication'}
        
        # Patient-specific PK parameter estimation
        individual_pk = self.estimate_individual_pk(patient_data, pop_pk_params)
        
        # Bayesian updating with measured levels
        updated_pk = self.bayesian_update(individual_pk, measured_levels, current_dose)
        
        # Optimize dose for target concentration
        target_concentration = pop_pk_params.get('target_concentration', {})
        optimized_dose = self.optimize_dose_for_target(updated_pk, target_concentration)
        
        return {
            'current_dose': current_dose,
            'optimized_dose': optimized_dose,
            'predicted_levels': self.predict_concentration_profile(updated_pk, optimized_dose),
            'confidence_interval': self.calculate_prediction_confidence(updated_pk),
            'next_sampling_time': self.recommend_next_sampling(updated_pk, optimized_dose),
            'clinical_interpretation': self.interpret_tdm_results(measured_levels, target_concentration)
        }

    # Helper methods for pharmacogenomic analysis
    def get_cyp_substrate_drugs(self, enzyme):
        """Get list of drugs metabolized by specific CYP enzyme"""
        cyp_substrates = {
            'CYP2C9': ['Warfarin', 'Phenytoin', 'Tolbutamide', 'S-Warfarin', 'Losartan'],
            'CYP2D6': ['Codeine', 'Tramadol', 'Metoprolol', 'Paroxetine', 'Risperidone'],
            'CYP3A4': ['Simvastatin', 'Midazolam', 'Cyclosporine', 'Tacrolimus', 'Nifedipine'],
            'CYP1A2': ['Caffeine', 'Theophylline', 'Clozapine', 'Olanzapine', 'Tizanidine'],
            'CYP2B6': ['Bupropion', 'Efavirenz', 'Cyclophosphamide', 'Ketamine'],
            'CYP2C19': ['Omeprazole', 'Clopidogrel', 'Escitalopram', 'Diazepam', 'Phenytoin']
        }
        return cyp_substrates.get(enzyme, [])

    def get_transporter_substrate_drugs(self, transporter):
        """Get drugs affected by specific transporters"""
        transporter_substrates = {
            'SLCO1B1': ['Simvastatin', 'Atorvastatin', 'Rosuvastatin', 'Metformin', 'Repaglinide'],
            'ABCB1': ['Digoxin', 'Dabigatran', 'Fexofenadine', 'Loperamide', 'Cyclosporine'],
            'ABCG2': ['Rosuvastatin', 'Sulfasalazine', 'Methotrexate', 'Topotecan', 'Imatinib']
        }
        return transporter_substrates.get(transporter, [])

    def calculate_age_adjustment(self, age):
        """Calculate age-based dose adjustment factor"""
        if age < 18:
            return 0.7  # Pediatric reduction
        elif age >= 65:
            return 0.8  # Geriatric reduction
        else:
            return 1.0  # Adult standard

    def calculate_weight_adjustment(self, weight):
        """Calculate weight-based dose adjustment factor"""
        if weight < 50:
            return 0.8
        elif weight > 100:
            return 1.2
        else:
            return 1.0

    def calculate_renal_adjustment(self, egfr, creatinine):
        """Calculate renal function-based dose adjustment"""
        if egfr < 30:
            return 0.5  # Severe CKD
        elif egfr < 60:
            return 0.7  # Moderate CKD
        elif egfr < 90:
            return 0.9  # Mild CKD
        else:
            return 1.0  # Normal function

    def calculate_hepatic_adjustment(self, ast_alt):
        """Calculate hepatic function-based dose adjustment"""
        if ast_alt > 200:
            return 0.5  # Severe hepatic impairment
        elif ast_alt > 100:
            return 0.7  # Moderate hepatic impairment
        elif ast_alt > 60:
            return 0.9  # Mild hepatic impairment
        else:
            return 1.0  # Normal function

    def calculate_genetic_adjustment(self, cyp_analysis, medication_name):
        """Calculate genetic-based dose adjustment factor"""
        # This would be medication-specific based on primary metabolizing enzyme
        composite_score = cyp_analysis.get('composite_metabolism_score', 1.0)
        
        if composite_score < 0.3:
            return 0.5  # Poor metabolizer
        elif composite_score < 0.7:
            return 0.75  # Intermediate metabolizer
        elif composite_score > 1.5:
            return 1.25  # Rapid metabolizer
        else:
            return 1.0  # Normal metabolizer

    def generate_dosing_rationale(self, adjustments, medication_name):
        """Generate clinical rationale for dose adjustments"""
        rationale = []
        for factor, value in adjustments.items():
            if value != 1.0:
                if value < 1.0:
                    rationale.append(f"{factor.replace('_', ' ').title()}: {int((1-value)*100)}% dose reduction recommended")
                else:
                    rationale.append(f"{factor.replace('_', ' ').title()}: {int((value-1)*100)}% dose increase recommended")
        
        return rationale if rationale else ["Standard dosing appropriate for this patient profile"]

    def generate_tdm_recommendations(self, medication_name, dose_factor):
        """Generate therapeutic drug monitoring recommendations"""
        if dose_factor < 0.7 or dose_factor > 1.3:
            return {
                'recommended': True,
                'timing': 'Steady-state (5 half-lives after dose change)',
                'frequency': 'Weekly initially, then monthly',
                'target_levels': 'Refer to institutional guidelines'
            }
        else:
            return {
                'recommended': False,
                'rationale': 'Standard dosing - routine monitoring sufficient'
            }

    def assess_overall_cyp_risk(self, composite_score):
        """Assess overall CYP-related risk"""
        if composite_score <= 0.3:
            return 'Critical - Severe metabolic impairment'
        elif composite_score <= 0.6:
            return 'High - Significant metabolic impairment'
        elif composite_score >= 1.5:
            return 'Moderate - Enhanced metabolism'
        else:
            return 'Low - Normal metabolism expected'

    def generate_cyp_recommendations(self, cyp_analysis):
        """Generate CYP-specific clinical recommendations"""
        recommendations = []
        
        for enzyme, data in cyp_analysis.items():
            if data['risk_level'] == 'Critical':
                recommendations.append(f"{enzyme}: Consider alternative medication or 50-75% dose reduction")
            elif data['risk_level'] == 'High':
                recommendations.append(f"{enzyme}: 25-50% dose reduction with enhanced monitoring")
            elif data['risk_level'] == 'Moderate':
                recommendations.append(f"{enzyme}: Consider dose adjustment and monitoring")
        
        return recommendations if recommendations else ["Standard CYP-related protocols appropriate"]

    def get_transporter_implications(self, transporter, profile):
        """Get clinical implications for transporter genetics"""
        implications_map = {
            'SLCO1B1': {
                'High': 'Increased risk of statin-induced myopathy - consider dose reduction',
                'Intermediate': 'Moderate risk - enhanced monitoring recommended',
                'Low': 'Standard statin therapy appropriate'
            },
            'ABCB1': {
                'High': 'Increased drug exposure - consider dose reduction for P-gp substrates',
                'Intermediate': 'Moderate exposure increase - monitor for toxicity',
                'Low': 'Standard dosing for P-gp substrates'
            },
            'ABCG2': {
                'High': 'Increased drug exposure - dose reduction may be needed',
                'Intermediate': 'Monitor for increased drug effects',
                'Low': 'Standard protocols appropriate'
            }
        }
        
        return implications_map.get(transporter, {}).get(profile['risk'], 'Standard protocols')

    def calculate_disposition_risk(self, transporter_analysis):
        """Calculate overall drug disposition risk"""
        high_risk_count = sum(1 for t in transporter_analysis.values() if t['risk_category'] == 'High')
        intermediate_risk_count = sum(1 for t in transporter_analysis.values() if t['risk_category'] == 'Intermediate')
        
        if high_risk_count >= 2:
            return 'High - Multiple transporter impairments'
        elif high_risk_count >= 1 or intermediate_risk_count >= 2:
            return 'Moderate - Some transporter impairments'
        else:
            return 'Low - Normal drug disposition expected'

    def generate_transporter_monitoring(self, transporter_analysis):
        """Generate transporter-specific monitoring recommendations"""
        recommendations = []
        
        for transporter, data in transporter_analysis.items():
            if data['risk_category'] == 'High':
                recommendations.append(f"{transporter}: Intensive monitoring for substrate drugs")
            elif data['risk_category'] == 'Intermediate':
                recommendations.append(f"{transporter}: Enhanced monitoring recommended")
        
        return recommendations if recommendations else ["Standard monitoring protocols"]

    def generate_hla_recommendations(self, high_risk_alleles, medication_name):
        """Generate HLA-specific clinical recommendations"""
        recommendations = []
        
        for allele_data in high_risk_alleles:
            if medication_name in allele_data['associated_drugs']:
                recommendations.append(f"CONTRAINDICATION: {medication_name} is contraindicated due to {allele_data['allele']}")
                recommendations.append(f"Alternative therapy required - consult clinical pharmacist")
            else:
                recommendations.append(f"Caution with {', '.join(allele_data['associated_drugs'])} due to {allele_data['allele']}")
        
        return recommendations

    def get_population_pk_parameters(self, medication_name):
        """Get population pharmacokinetic parameters for common medications"""
        # This would typically come from a comprehensive drug database
        pk_params = {
            'Warfarin': {
                'clearance': 0.045,  # L/h/kg
                'volume': 0.14,      # L/kg
                'target_concentration': {'min': 1.0, 'max': 3.0, 'unit': 'mg/L'}
            },
            'Digoxin': {
                'clearance': 1.2,    # L/h
                'volume': 7.3,       # L/kg
                'target_concentration': {'min': 1.0, 'max': 2.0, 'unit': 'ng/mL'}
            },
            'Phenytoin': {
                'clearance': 0.04,   # L/h/kg
                'volume': 0.65,      # L/kg
                'target_concentration': {'min': 10, 'max': 20, 'unit': 'mg/L'}
            }
        }
        
        return pk_params.get(medication_name, None)

    def estimate_individual_pk(self, patient_data, pop_pk_params):
        """Estimate individual PK parameters from population parameters"""
        # Simplified individual PK estimation
        age = patient_data.get('age', 50)
        weight = patient_data.get('weight', 70)
        creatinine = patient_data.get('creatinine', 1.0)
        
        # Age adjustment
        age_factor = 1.0 if age < 65 else 0.8
        
        # Weight adjustment
        weight_factor = weight / 70
        
        # Renal function adjustment
        renal_factor = 1.0 if creatinine <= 1.2 else 0.7
        
        individual_clearance = pop_pk_params['clearance'] * age_factor * weight_factor * renal_factor
        individual_volume = pop_pk_params['volume'] * weight_factor
        
        return {
            'clearance': individual_clearance,
            'volume': individual_volume,
            'half_life': 0.693 * individual_volume / individual_clearance
        }

    def bayesian_update(self, individual_pk, measured_levels, current_dose):
        """Simplified Bayesian updating of PK parameters"""
        # This is a simplified implementation
        # In practice, this would use sophisticated Bayesian algorithms
        
        if not measured_levels:
            return individual_pk
        
        # Simple adjustment based on measured vs predicted levels
        latest_level = measured_levels[-1] if isinstance(measured_levels, list) else measured_levels
        predicted_level = current_dose / individual_pk['clearance']
        
        adjustment_factor = latest_level / predicted_level if predicted_level > 0 else 1.0
        
        updated_pk = individual_pk.copy()
        updated_pk['clearance'] = individual_pk['clearance'] / adjustment_factor
        
        return updated_pk

    def optimize_dose_for_target(self, updated_pk, target_concentration):
        """Optimize dose to achieve target concentration"""
        if not target_concentration:
            return None
        
        target_level = (target_concentration.get('min', 0) + target_concentration.get('max', 0)) / 2
        
        if target_level > 0 and updated_pk['clearance'] > 0:
            optimized_dose = target_level * updated_pk['clearance']
            return round(optimized_dose, 1)
        
        return None

    def predict_concentration_profile(self, pk_params, dose):
        """Predict concentration-time profile"""
        # Simplified prediction
        times = [0, 2, 4, 8, 12, 24]  # hours
        concentrations = []
        
        for t in times:
            if t == 0:
                conc = 0
            else:
                # Simple one-compartment model
                conc = (dose / pk_params['volume']) * np.exp(-t / pk_params.get('half_life', 12))
            concentrations.append(round(conc, 2))
        
        return {'times': times, 'concentrations': concentrations}

    def calculate_prediction_confidence(self, pk_params):
        """Calculate confidence intervals for predictions"""
        # Simplified confidence calculation
        return {
            'confidence_level': '95%',
            'lower_bound': 0.8,
            'upper_bound': 1.2,
            'note': 'Confidence intervals based on population variability'
        }

    def recommend_next_sampling(self, pk_params, dose):
        """Recommend optimal time for next blood sampling"""
        half_life = pk_params.get('half_life', 12)
        
        # Recommend sampling at steady state (5 half-lives)
        steady_state_time = 5 * half_life
        
        return {
            'recommended_time': f"{steady_state_time:.1f} hours after dose change",
            'rationale': 'Steady-state achievement for accurate assessment',
            'alternative_times': [f"{2*half_life:.1f}h (early assessment)", f"{3*half_life:.1f}h (intermediate)"]
        }

    def interpret_tdm_results(self, measured_levels, target_concentration):
        """Interpret therapeutic drug monitoring results"""
        if not measured_levels or not target_concentration:
            return "Insufficient data for interpretation"
        
        latest_level = measured_levels[-1] if isinstance(measured_levels, list) else measured_levels
        target_min = target_concentration.get('min', 0)
        target_max = target_concentration.get('max', float('inf'))
        
        if latest_level < target_min:
            return f"Subtherapeutic level ({latest_level}) - consider dose increase"
        elif latest_level > target_max:
            return f"Supratherapeutic level ({latest_level}) - consider dose reduction"
        else:
            return f"Therapeutic level ({latest_level}) - continue current dose"

# Initialize the advanced pharmacogenomics module
advanced_pgx = AdvancedPharmacogenomics()

# ═══════════════════════════════════════════════════════════════════════════════════════
# 🎯 PRECISION MEDICINE SUMMARY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════════════

def calculate_overall_genetic_risk(cyp_analysis, transporter_analysis, hla_analysis):
    """Calculate overall genetic risk score"""
    risk_score = 0
    risk_factors = []
    
    # CYP enzyme risk assessment
    for enzyme, data in cyp_analysis.get('individual_enzymes', {}).items():
        if data['risk_level'] == 'Critical':
            risk_score += 3
            risk_factors.append(f"{enzyme}: Critical impairment")
        elif data['risk_level'] == 'High':
            risk_score += 2
            risk_factors.append(f"{enzyme}: High risk")
        elif data['risk_level'] == 'Moderate':
            risk_score += 1
            risk_factors.append(f"{enzyme}: Moderate risk")
    
    # Transporter risk assessment
    for transporter, data in transporter_analysis.get('transporter_profiles', {}).items():
        if data['risk_category'] == 'High':
            risk_score += 2
            risk_factors.append(f"{transporter}: High transport risk")
        elif data['risk_category'] == 'Intermediate':
            risk_score += 1
            risk_factors.append(f"{transporter}: Intermediate transport risk")
    
    # HLA risk assessment
    if hla_analysis.get('overall_hypersensitivity_risk') == 'Critical':
        risk_score += 5
        risk_factors.append("HLA: Critical hypersensitivity risk")
    elif hla_analysis.get('high_risk_alleles_present'):
        risk_score += 2
        risk_factors.append("HLA: High-risk alleles present")
    
    # Determine overall risk category
    if risk_score >= 8:
        overall_risk = 'Critical'
    elif risk_score >= 5:
        overall_risk = 'High'
    elif risk_score >= 2:
        overall_risk = 'Moderate'
    else:
        overall_risk = 'Low'
    
    return {
        'risk_score': risk_score,
        'risk_category': overall_risk,
        'contributing_factors': risk_factors,
        'clinical_significance': get_genetic_risk_significance(overall_risk)
    }

def assess_dosing_complexity(personalized_dosing):
    """Assess complexity of personalized dosing requirements"""
    dose_factor = personalized_dosing.get('dose_adjustment_factor', 1.0)
    adjustments = personalized_dosing.get('individual_adjustments', {})
    
    complexity_score = 0
    complexity_factors = []
    
    # Major dose adjustments increase complexity
    if dose_factor <= 0.5:
        complexity_score += 3
        complexity_factors.append("Major dose reduction required")
    elif dose_factor <= 0.7:
        complexity_score += 2
        complexity_factors.append("Moderate dose reduction required")
    elif dose_factor >= 1.5:
        complexity_score += 2
        complexity_factors.append("Dose increase required")
    
    # Multiple adjustment factors increase complexity
    significant_adjustments = sum(1 for adj in adjustments.values() if adj != 1.0)
    complexity_score += significant_adjustments
    
    # TDM requirements increase complexity
    if personalized_dosing.get('tdm_recommendations', {}).get('recommended'):
        complexity_score += 2
        complexity_factors.append("Therapeutic drug monitoring required")
    
    # Determine complexity level
    if complexity_score >= 6:
        complexity_level = 'High'
    elif complexity_score >= 3:
        complexity_level = 'Moderate'
    else:
        complexity_level = 'Low'
    
    return {
        'complexity_score': complexity_score,
        'complexity_level': complexity_level,
        'contributing_factors': complexity_factors,
        'clinical_implications': get_dosing_complexity_implications(complexity_level)
    }

def determine_monitoring_intensity(cyp_analysis, transporter_analysis, personalized_dosing):
    """Determine required monitoring intensity"""
    monitoring_score = 0
    monitoring_requirements = []
    
    # CYP-based monitoring needs
    composite_score = cyp_analysis.get('composite_metabolism_score', 1.0)
    if composite_score <= 0.3:
        monitoring_score += 3
        monitoring_requirements.append("Intensive CYP-related monitoring")
    elif composite_score <= 0.7 or composite_score >= 1.5:
        monitoring_score += 2
        monitoring_requirements.append("Enhanced CYP-related monitoring")
    
    # Transporter-based monitoring
    high_risk_transporters = sum(1 for t in transporter_analysis.get('transporter_profiles', {}).values() 
                                if t['risk_category'] == 'High')
    monitoring_score += high_risk_transporters
    if high_risk_transporters > 0:
        monitoring_requirements.append("Transporter-related monitoring required")
    
    # Dose adjustment monitoring
    dose_factor = personalized_dosing.get('dose_adjustment_factor', 1.0)
    if dose_factor <= 0.6 or dose_factor >= 1.4:
        monitoring_score += 2
        monitoring_requirements.append("Dose adjustment monitoring")
    
    # Determine monitoring intensity
    if monitoring_score >= 6:
        intensity = 'Intensive'
        frequency = 'Daily to weekly'
    elif monitoring_score >= 3:
        intensity = 'Enhanced'
        frequency = 'Weekly to bi-weekly'
    else:
        intensity = 'Standard'
        frequency = 'Monthly'
    
    return {
        'monitoring_score': monitoring_score,
        'intensity_level': intensity,
        'recommended_frequency': frequency,
        'specific_requirements': monitoring_requirements,
        'clinical_protocols': get_monitoring_protocols(intensity)
    }

def assess_clinical_actionability(cyp_analysis, hla_analysis, personalized_dosing):
    """Assess clinical actionability of pharmacogenomic findings"""
    actionability_score = 0
    actionable_findings = []
    
    # High-impact CYP findings
    for enzyme, data in cyp_analysis.get('individual_enzymes', {}).items():
        if data['risk_level'] in ['Critical', 'High']:
            actionability_score += 2
            actionable_findings.append(f"{enzyme}: {data['clinical_impact']}")
    
    # Critical HLA findings
    if hla_analysis.get('drug_specific_risks'):
        actionability_score += 5
        actionable_findings.append("HLA: Drug contraindication identified")
    elif hla_analysis.get('high_risk_alleles_present'):
        actionability_score += 2
        actionable_findings.append("HLA: High-risk alleles require monitoring")
    
    # Significant dose adjustments
    dose_factor = personalized_dosing.get('dose_adjustment_factor', 1.0)
    if dose_factor <= 0.6 or dose_factor >= 1.4:
        actionability_score += 2
        actionable_findings.append(f"Dosing: {int(abs(1-dose_factor)*100)}% adjustment recommended")
    
    # Determine actionability level
    if actionability_score >= 7:
        actionability = 'Critical'
        urgency = 'Immediate action required'
    elif actionability_score >= 4:
        actionability = 'High'
        urgency = 'Action recommended within 24 hours'
    elif actionability_score >= 2:
        actionability = 'Moderate'
        urgency = 'Consider action within 1 week'
    else:
        actionability = 'Low'
        urgency = 'Standard care protocols'
    
    return {
        'actionability_score': actionability_score,
        'actionability_level': actionability,
        'urgency_level': urgency,
        'actionable_findings': actionable_findings,
        'implementation_priority': get_implementation_priority(actionability)
    }

def get_genetic_risk_significance(risk_level):
    """Get clinical significance of genetic risk level"""
    significance_map = {
        'Critical': 'Genetic factors pose severe ADR risk - immediate intervention required',
        'High': 'Significant genetic risk factors identified - enhanced monitoring needed',
        'Moderate': 'Some genetic risk factors present - consider precautions',
        'Low': 'Minimal genetic risk factors - standard protocols appropriate'
    }
    return significance_map.get(risk_level, 'Unknown risk significance')

def get_dosing_complexity_implications(complexity_level):
    """Get clinical implications of dosing complexity"""
    implications_map = {
        'High': 'Complex dosing regimen requires specialist consultation and intensive monitoring',
        'Moderate': 'Moderate dosing adjustments needed with enhanced follow-up',
        'Low': 'Standard dosing protocols with routine monitoring appropriate'
    }
    return implications_map.get(complexity_level, 'Unknown complexity implications')

def get_monitoring_protocols(intensity):
    """Get specific monitoring protocols based on intensity"""
    protocols_map = {
        'Intensive': [
            'Daily clinical assessment for first week',
            'Laboratory monitoring every 2-3 days initially',
            'Vital signs monitoring every 4-6 hours',
            'Immediate availability of antidotes/interventions'
        ],
        'Enhanced': [
            'Clinical assessment 2-3 times per week initially',
            'Laboratory monitoring weekly for first month',
            'Vital signs monitoring daily',
            'Patient education on warning signs'
        ],
        'Standard': [
            'Routine clinical follow-up',
            'Standard laboratory monitoring intervals',
            'Patient self-monitoring as appropriate',
            'Standard safety protocols'
        ]
    }
    return protocols_map.get(intensity, ['Standard monitoring protocols'])

def get_implementation_priority(actionability):
    """Get implementation priority for pharmacogenomic findings"""
    priority_map = {
        'Critical': {
            'timeline': 'Immediate (within hours)',
            'actions': ['Stop current medication if contraindicated', 'Implement alternative therapy', 'Intensive monitoring'],
            'stakeholders': ['Prescribing physician', 'Clinical pharmacist', 'Nursing staff', 'Patient/family']
        },
        'High': {
            'timeline': '24-48 hours',
            'actions': ['Adjust dosing regimen', 'Enhance monitoring protocols', 'Patient education'],
            'stakeholders': ['Prescribing physician', 'Clinical pharmacist', 'Patient']
        },
        'Moderate': {
            'timeline': '1 week',
            'actions': ['Consider dosing modifications', 'Implement precautionary monitoring', 'Document findings'],
            'stakeholders': ['Prescribing physician', 'Patient']
        },
        'Low': {
            'timeline': 'Next routine visit',
            'actions': ['Document findings', 'Continue standard protocols'],
            'stakeholders': ['Healthcare team']
        }
    }
    return priority_map.get(actionability, {'timeline': 'As appropriate', 'actions': ['Standard care'], 'stakeholders': ['Healthcare team']})

@app.route('/')
def index():
    return render_template('loading.html')

@app.route('/patient-details')
def patient_details():
    return render_template('patient_details_form.html')

@app.route('/assessment')
def assessment():
    return render_template('index.html')

def analyze_comprehensive_drug_interactions(all_medications, patient_data):
    """
    Analyze all medications (primary + external) for comprehensive ADR risk assessment
    """
    enhanced_factors = {}
    
    # Define drug categories and their risk profiles
    high_risk_drugs = {
        'warfarin': {'qt_risk': False, 'cyp_inhibitor': False, 'narrow_therapeutic': True, 'bleeding_risk': True},
        'digoxin': {'qt_risk': True, 'cyp_inhibitor': False, 'narrow_therapeutic': True, 'cardiac_risk': True},
        'lithium': {'qt_risk': False, 'cyp_inhibitor': False, 'narrow_therapeutic': True, 'renal_risk': True},
        'phenytoin': {'qt_risk': False, 'cyp_inhibitor': True, 'narrow_therapeutic': True, 'hepatic_risk': True},
        'carbamazepine': {'qt_risk': False, 'cyp_inhibitor': True, 'narrow_therapeutic': True, 'hematologic_risk': True},
        'methotrexate': {'qt_risk': False, 'cyp_inhibitor': False, 'narrow_therapeutic': True, 'hepatic_risk': True, 'hematologic_risk': True},
        'amiodarone': {'qt_risk': True, 'cyp_inhibitor': True, 'narrow_therapeutic': True, 'cardiac_risk': True, 'hepatic_risk': True},
        'cyclosporine': {'qt_risk': False, 'cyp_inhibitor': True, 'narrow_therapeutic': True, 'renal_risk': True, 'hepatic_risk': True},
        'tacrolimus': {'qt_risk': True, 'cyp_inhibitor': False, 'narrow_therapeutic': True, 'renal_risk': True},
        'theophylline': {'qt_risk': False, 'cyp_inhibitor': False, 'narrow_therapeutic': True, 'cardiac_risk': True}
    }
    
    qt_prolonging_drugs = [
        'amiodarone', 'sotalol', 'quinidine', 'procainamide', 'disopyramide',
        'haloperidol', 'chlorpromazine', 'thioridazine', 'ziprasidone',
        'ondansetron', 'droperidol', 'methadone', 'clarithromycin', 'erythromycin',
        'azithromycin', 'ciprofloxacin', 'levofloxacin', 'fluconazole', 'ketoconazole'
    ]
    
    cyp_inhibitors = [
        'fluconazole', 'ketoconazole', 'itraconazole', 'voriconazole',
        'erythromycin', 'clarithromycin', 'telithromycin',
        'ritonavir', 'indinavir', 'nelfinavir',
        'cimetidine', 'omeprazole', 'fluvoxamine',
        'grapefruit', 'grapefruit juice'
    ]
    
    bleeding_risk_drugs = [
        'warfarin', 'heparin', 'enoxaparin', 'dabigatran', 'rivaroxaban', 'apixaban',
        'aspirin', 'clopidogrel', 'prasugrel', 'ticagrelor',
        'ibuprofen', 'naproxen', 'diclofenac', 'celecoxib'
    ]
    
    # Initialize risk counters
    qt_prolonging_count = 0
    cyp_inhibitor_count = 0
    bleeding_risk_count = 0
    narrow_therapeutic_count = 0
    high_risk_count = 0
    
    # Analyze each medication
    detected_risks = []
    
    for medication in all_medications:
        if not medication:
            continue
            
        med_lower = medication.lower().strip()
        
        # Check for high-risk drugs
        for drug_name, risk_profile in high_risk_drugs.items():
            if drug_name in med_lower:
                high_risk_count += 1
                detected_risks.append(f"High-risk drug detected: {medication}")
                
                if risk_profile.get('qt_risk'):
                    qt_prolonging_count += 1
                if risk_profile.get('cyp_inhibitor'):
                    cyp_inhibitor_count += 1
                if risk_profile.get('narrow_therapeutic'):
                    narrow_therapeutic_count += 1
                if risk_profile.get('bleeding_risk'):
                    bleeding_risk_count += 1
                break
        
        # Check for QT prolonging drugs
        for qt_drug in qt_prolonging_drugs:
            if qt_drug in med_lower:
                qt_prolonging_count += 1
                detected_risks.append(f"QT-prolonging drug detected: {medication}")
                break
        
        # Check for CYP inhibitors
        for cyp_drug in cyp_inhibitors:
            if cyp_drug in med_lower:
                cyp_inhibitor_count += 1
                detected_risks.append(f"CYP inhibitor detected: {medication}")
                break
        
        # Check for bleeding risk drugs
        for bleeding_drug in bleeding_risk_drugs:
            if bleeding_drug in med_lower:
                bleeding_risk_count += 1
                detected_risks.append(f"Bleeding risk drug detected: {medication}")
                break
    
    # Calculate enhanced risk factors
    enhanced_factors['qt_prolonging_flag'] = 1 if qt_prolonging_count > 0 else patient_data.get('qt_prolonging_flag', 0)
    enhanced_factors['cyp_inhibitors_flag'] = 1 if cyp_inhibitor_count > 0 else patient_data.get('cyp_inhibitors_flag', 0)
    enhanced_factors['bleeding_risk_flag'] = 1 if bleeding_risk_count > 0 else 0
    enhanced_factors['narrow_therapeutic_flag'] = 1 if narrow_therapeutic_count > 0 else 0
    enhanced_factors['high_risk_drug_count'] = high_risk_count
    
    # Adjust polypharmacy based on actual medication count
    enhanced_factors['polypharmacy_flag'] = 1 if len(all_medications) > 5 else 0
    enhanced_factors['total_medication_count'] = len(all_medications)
    
    # Calculate interaction risk score
    interaction_risk_score = (
        qt_prolonging_count * 2 +
        cyp_inhibitor_count * 2 +
        bleeding_risk_count * 1.5 +
        narrow_therapeutic_count * 2 +
        (len(all_medications) - 1) * 0.5  # Each additional drug adds risk
    )
    
    enhanced_factors['interaction_risk_score'] = min(interaction_risk_score, 10)  # Cap at 10
    enhanced_factors['detected_drug_risks'] = detected_risks
    
    # Adjust drug interaction severity based on analysis
    if interaction_risk_score >= 6:
        enhanced_factors['drug_interactions'] = 'Major'
    elif interaction_risk_score >= 3:
        enhanced_factors['drug_interactions'] = 'Moderate'
    else:
        enhanced_factors['drug_interactions'] = patient_data.get('drug_interactions', 'Minor')
    
    logger.info(f"Enhanced drug interaction analysis: {enhanced_factors}")
    logger.info(f"Detected risks: {detected_risks}")
    
    return enhanced_factors

@app.route('/predict', methods=['POST'])
def predict_adr():
    try:
        if model is None or preprocessor is None:
            return jsonify({'error': 'Model not loaded properly'}), 500
        
        # Get data from request
        data = request.json
        logger.info(f"Received prediction request: {data}")
        
        # *** ENHANCED: Process external drugs for comprehensive analysis ***
        external_drugs = data.get('external_drugs', [])
        external_drugs_list = data.get('external_drugs_list', [])
        all_medications = data.get('all_medications', [])
        
        logger.info(f"External drugs detected: {external_drugs_list}")
        logger.info(f"All medications for analysis: {all_medications}")
        
        # Analyze drug interactions and risk factors from all medications
        enhanced_risk_factors = analyze_comprehensive_drug_interactions(all_medications, data)
        
        # Update data with enhanced risk analysis
        data.update(enhanced_risk_factors)
        
        # Handle empty fields by providing default values
        default_values = {
            'age': 50,
            'sex': 'M',
            'ethnicity': 'White',
            'height': 170,
            'weight': 70,
            'weight_kg': 70,
            'height_cm': 170,
            'bmi': 24.2,
            'creatinine': 1.2,
            'egfr': 80,
            'ast_alt': 45,
            'bilirubin': 1.0,
            'albumin': 4.2,
            'hemoglobin': 13.5,
            'hematocrit': 40.5,
            'wbc_count': 7.5,
            'platelet_count': 275,
            'rbc_count': 4.5,
            'diabetes': 0,
            'liver_disease': 0,
            'ckd': 0,
            'cardiac_disease': 0,
            'hypertension': 0,
            'respiratory_disease': 0,
            'neurological_disease': 0,
            'autoimmune_disease': 0,
            'medication_name': 'Unknown',
            'index_drug_dose': 200,
            'drug_interactions': 'Minor',
            'concomitant_drugs_count': len(external_drugs_list),  # Use actual count
            'cyp2c9': 'Wild',
            'cyp2d6': 'EM',
            'bp_systolic': 135,
            'bp_diastolic': 85,
            'heart_rate': 75,
            'time_since_start_days': 30,
            'cyp_inhibitors_flag': 0,
            'qt_prolonging_flag': 0,
            'hla_risk_allele_flag': 0,
            'inpatient_flag': 0,
            'prior_adr_history': 0
        }
        
        # Fill empty or missing fields with defaults
        for key, default_value in default_values.items():
            if key not in data or data[key] is None or data[key] == '' or data[key] == 'null':
                data[key] = default_value
                logger.info(f"Using default value for {key}: {default_value}")
        
        # Add default indication for model compatibility (model was trained with this field)
        # Even though we removed it from the UI, the model still expects it
        if 'indication' not in data or not data['indication']:
            data['indication'] = 'Pain'  # Use most common indication from training data
            logger.info("Added default indication for model compatibility")
        
        # Calculate derived fields required by the model
        data['polypharmacy_flag'] = 1 if data.get('concomitant_drugs_count', 0) > 5 else 0
        data['cumulative_dose_mg'] = data.get('index_drug_dose', 100) * data.get('time_since_start_days', 30)
        data['dose_density_mg_day'] = data['cumulative_dose_mg'] / data.get('time_since_start_days', 30)
        logger.info("Calculated derived fields for model compatibility")
        
        # Map frontend column names to model expected column names
        if 'weight' in data:
            data['weight_kg'] = data['weight']
        if 'height' in data:
            data['height_cm'] = data['height']
            
        # Add any missing columns that the model expects
        model_expected_columns = [
            'age', 'sex', 'weight_kg', 'bmi', 'ethnicity',
            'creatinine', 'egfr', 'ast_alt', 'bilirubin', 'albumin',
            'diabetes', 'liver_disease', 'ckd', 'cardiac_disease',
            'index_drug_dose', 'concomitant_drugs_count', 'cyp_inhibitors_flag', 'qt_prolonging_flag',
            'cyp2c9', 'cyp2d6', 'hla_risk_allele_flag',
            'cumulative_dose_mg', 'dose_density_mg_day', 'time_since_start_days',
            'bp_systolic', 'bp_diastolic', 'heart_rate',
            'polypharmacy_flag', 'indication', 'inpatient_flag', 'prior_adr_history'
        ]
        
        # Ensure all expected columns are present
        for col in model_expected_columns:
            if col not in data:
                if col in default_values:
                    data[col] = default_values[col]
                else:
                    # Set reasonable defaults for missing columns
                    if col == 'weight_kg':
                        data[col] = 70
                    elif col == 'height_cm':
                        data[col] = 170
                    else:
                        data[col] = 0
                logger.info(f"Added missing column {col} with default value")
        
        # Create DataFrame from input data with only the columns the model expects
        input_df = pd.DataFrame([{col: data[col] for col in model_expected_columns}])
        
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
        
        # 🧬 ADVANCED PHARMACOGENOMICS ANALYSIS
        medication_name = data.get('medication_name', 'Unknown')
        standard_dose = data.get('index_drug_dose', 200)
        
        # Comprehensive CYP enzyme analysis
        cyp_analysis = advanced_pgx.analyze_expanded_cyp_profile(data)
        
        # Transporter genetics analysis
        transporter_analysis = advanced_pgx.analyze_transporter_genetics(data)
        
        # HLA hypersensitivity risk assessment
        hla_analysis = advanced_pgx.analyze_hla_hypersensitivity_risk(data, medication_name)
        
        # Personalized dosing recommendations
        personalized_dosing = advanced_pgx.calculate_personalized_dosing(data, medication_name, standard_dose)
        
        # Bayesian dose optimization (if TDM data available)
        bayesian_dosing = None
        if data.get('measured_drug_levels'):
            bayesian_dosing = advanced_pgx.bayesian_dose_optimization(
                data, medication_name, standard_dose, data.get('measured_drug_levels')
            )
        
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
            
            # *** ENHANCED: Include comprehensive drug analysis results ***
            'comprehensive_drug_analysis': {
                'all_medications_analyzed': all_medications,
                'external_drugs_count': len(external_drugs_list),
                'detected_drug_risks': enhanced_risk_factors.get('detected_drug_risks', []),
                'interaction_risk_score': enhanced_risk_factors.get('interaction_risk_score', 0),
                'total_medication_count': enhanced_risk_factors.get('total_medication_count', 0),
                'high_risk_drug_count': enhanced_risk_factors.get('high_risk_drug_count', 0),
                'qt_prolonging_flag': enhanced_risk_factors.get('qt_prolonging_flag', 0),
                'cyp_inhibitors_flag': enhanced_risk_factors.get('cyp_inhibitors_flag', 0),
                'bleeding_risk_flag': enhanced_risk_factors.get('bleeding_risk_flag', 0),
                'narrow_therapeutic_flag': enhanced_risk_factors.get('narrow_therapeutic_flag', 0),
                'final_drug_interaction_severity': enhanced_risk_factors.get('drug_interactions', 'Minor')
            },
            
            # 🧬 ADVANCED PHARMACOGENOMICS & PRECISION MEDICINE RESULTS
            'advanced_pharmacogenomics': {
                'expanded_cyp_analysis': cyp_analysis,
                'transporter_genetics': transporter_analysis,
                'hla_hypersensitivity_risk': hla_analysis,
                'personalized_dosing': personalized_dosing,
                'bayesian_optimization': bayesian_dosing,
                'precision_medicine_summary': {
                    'overall_genetic_risk': calculate_overall_genetic_risk(cyp_analysis, transporter_analysis, hla_analysis),
                    'dosing_complexity': assess_dosing_complexity(personalized_dosing),
                    'monitoring_intensity': determine_monitoring_intensity(cyp_analysis, transporter_analysis, personalized_dosing),
                    'clinical_actionability': assess_clinical_actionability(cyp_analysis, hla_analysis, personalized_dosing)
                }
            },
            
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
        
        # Create an extremely detailed and comprehensive prompt for Gemini
        prompt = f"""
        As a senior clinical pharmacologist and ADR specialist with 20+ years of experience, generate an EXTREMELY DETAILED and COMPREHENSIVE ADR risk assessment report for the following patient. This report will be used for critical clinical decision-making and must include exhaustive analysis across all relevant domains.

        ═══════════════════════════════════════════════════════════════════════════════════════
        📋 COMPLETE PATIENT PROFILE & CLINICAL DATA
        ═══════════════════════════════════════════════════════════════════════════════════════

        🏥 PATIENT DEMOGRAPHICS & IDENTIFICATION:
        - Patient Name: {patient_name}
        {f"- Patient ID: {patient_id}" if patient_id else ""}
        - Assessing Clinician: {clinician_name}
        - Assessment Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        - Age: {patient_data.get('age', 'N/A')} years
        - Sex: {patient_data.get('sex', 'N/A')}
        - Ethnicity: {patient_data.get('ethnicity', 'N/A')}
        - Height: {patient_data.get('height', 'N/A')} cm
        - Weight: {patient_data.get('weight', 'N/A')} kg
        - BMI: {patient_data.get('bmi', 'N/A')} kg/m²

        🧪 COMPREHENSIVE LABORATORY VALUES & ORGAN FUNCTION:
        - Serum Creatinine: {patient_data.get('creatinine', 'N/A')} mg/dL
        - Estimated GFR: {patient_data.get('egfr', 'N/A')} mL/min/1.73m²
        - AST/ALT: {patient_data.get('ast_alt', 'N/A')} U/L
        - Total Bilirubin: {patient_data.get('bilirubin', 'N/A')} mg/dL
        - Serum Albumin: {patient_data.get('albumin', 'N/A')} g/dL
        - Hemoglobin: {patient_data.get('hemoglobin', 'N/A')} g/dL
        - Hematocrit: {patient_data.get('hematocrit', 'N/A')}%
        - WBC Count: {patient_data.get('wbc_count', 'N/A')} × 10³/μL
        - Platelet Count: {patient_data.get('platelet_count', 'N/A')} × 10³/μL
        - RBC Count: {patient_data.get('rbc_count', 'N/A')} × 10⁶/μL

        🏥 DETAILED COMORBIDITY PROFILE:
        - Type 2 Diabetes Mellitus: {'✓ PRESENT' if patient_data.get('diabetes') == 1 else '✗ Absent'}
        - Chronic Liver Disease: {'✓ PRESENT' if patient_data.get('liver_disease') == 1 else '✗ Absent'}
        - Chronic Kidney Disease: {'✓ PRESENT' if patient_data.get('ckd') == 1 else '✗ Absent'}
        - Cardiovascular Disease: {'✓ PRESENT' if patient_data.get('cardiac_disease') == 1 else '✗ Absent'}
        - Hypertension: {'✓ PRESENT' if patient_data.get('hypertension') == 1 else '✗ Absent'}
        - Respiratory Disease: {'✓ PRESENT' if patient_data.get('respiratory_disease') == 1 else '✗ Absent'}
        - Neurological Disease: {'✓ PRESENT' if patient_data.get('neurological_disease') == 1 else '✗ Absent'}
        - Autoimmune Disease: {'✓ PRESENT' if patient_data.get('autoimmune_disease') == 1 else '✗ Absent'}

        💊 COMPREHENSIVE MEDICATION PROFILE & PHARMACOTHERAPY:
        - Primary Medication: {patient_data.get('medication_name', 'N/A')}
        - Index Drug Dose: {patient_data.get('index_drug_dose', 'N/A')} mg
        - Total Concomitant Medications: {patient_data.get('concomitant_drugs_count', 'N/A')}
        - Drug Interaction Severity: {patient_data.get('drug_interactions', 'N/A')}
        - Polypharmacy Status: {'✓ YES (>5 drugs)' if patient_data.get('concomitant_drugs_count', 0) > 5 else '✗ No'}
        - Treatment Duration: {patient_data.get('time_since_start_days', 'N/A')} days
        - Cumulative Dose: {patient_data.get('cumulative_dose_mg', patient_data.get('index_drug_dose', 0) * patient_data.get('time_since_start_days', 0))} mg
        - Daily Dose Density: {patient_data.get('dose_density_mg_day', patient_data.get('index_drug_dose', 0))} mg/day

        🔍 COMPREHENSIVE DRUG INTERACTION ANALYSIS:
        {f"- All Medications Analyzed: {', '.join(patient_data.get('all_medications', []))}" if patient_data.get('all_medications') else "- All Medications: Primary medication only"}
        - External Drugs Count: {len(patient_data.get('external_drugs_list', []))}
        - Interaction Risk Score: {prediction_result.get('comprehensive_drug_analysis', {}).get('interaction_risk_score', 'N/A')}/10
        - High-Risk Drug Count: {prediction_result.get('comprehensive_drug_analysis', {}).get('high_risk_drug_count', 0)}
        - QT Prolongation Risk: {'⚠️ DETECTED' if prediction_result.get('comprehensive_drug_analysis', {}).get('qt_prolonging_flag') == 1 else '✓ None'}
        - CYP Inhibition Risk: {'⚠️ DETECTED' if prediction_result.get('comprehensive_drug_analysis', {}).get('cyp_inhibitors_flag') == 1 else '✓ None'}
        - Bleeding Risk Drugs: {'⚠️ DETECTED' if prediction_result.get('comprehensive_drug_analysis', {}).get('bleeding_risk_flag') == 1 else '✓ None'}
        - Narrow Therapeutic Index: {'⚠️ DETECTED' if prediction_result.get('comprehensive_drug_analysis', {}).get('narrow_therapeutic_flag') == 1 else '✓ None'}
        - Final Interaction Severity: {prediction_result.get('comprehensive_drug_analysis', {}).get('final_drug_interaction_severity', 'Minor')}
        
        📋 DETECTED DRUG-SPECIFIC RISKS:
        {chr(10).join([f"   • {risk}" for risk in prediction_result.get('comprehensive_drug_analysis', {}).get('detected_drug_risks', [])]) if prediction_result.get('comprehensive_drug_analysis', {}).get('detected_drug_risks') else "   • No specific drug risks detected"}

        🧬 COMPREHENSIVE PHARMACOGENOMIC & PRECISION MEDICINE PROFILE:
        
        📊 EXPANDED CYP ENZYME ANALYSIS:
        - CYP2C9 Genotype: {patient_data.get('cyp2c9', 'N/A')} {'(POOR METABOLIZER - HIGH RISK)' if patient_data.get('cyp2c9') == 'Poor' else '(INTERMEDIATE METABOLIZER - MODERATE RISK)' if patient_data.get('cyp2c9') == 'Intermediate' else '(NORMAL METABOLIZER)' if patient_data.get('cyp2c9') == 'Wild' else ''}
        - CYP2D6 Phenotype: {patient_data.get('cyp2d6', 'N/A')} {'(POOR METABOLIZER - HIGH RISK)' if patient_data.get('cyp2d6') == 'PM' else '(INTERMEDIATE METABOLIZER - MODERATE RISK)' if patient_data.get('cyp2d6') == 'IM' else '(EXTENSIVE METABOLIZER - NORMAL)' if patient_data.get('cyp2d6') == 'EM' else ''}
        - CYP3A4 Status: {patient_data.get('cyp3a4', 'Normal')} (Major drug metabolizing enzyme)
        - CYP1A2 Status: {patient_data.get('cyp1a2', 'Normal')} (Affects caffeine, theophylline metabolism)
        - CYP2B6 Status: {patient_data.get('cyp2b6', 'Normal')} (Affects bupropion, efavirenz metabolism)
        - CYP2C19 Status: {patient_data.get('cyp2c19', 'EM')} (Affects PPI, clopidogrel metabolism)
        
        🚛 DRUG TRANSPORTER GENETICS:
        - SLCO1B1 Genotype: {patient_data.get('slco1b1_genotype', '*1/*1')} (Statin uptake transporter)
        - ABCB1 (P-glycoprotein): {patient_data.get('abcb1_genotype', 'CC')} (Efflux transporter)
        - ABCG2 (BCRP): {patient_data.get('abcg2_genotype', 'Wild/Wild')} (Breast cancer resistance protein)
        
        🧬 HLA HYPERSENSITIVITY RISK PROFILE:
        - HLA-A Typing: {patient_data.get('hla_a_typing', 'Not tested')}
        - HLA-B Typing: {patient_data.get('hla_b_typing', 'Not tested')}
        - HLA-DRB1 Typing: {patient_data.get('hla_drb1_typing', 'Not tested')}
        - High-Risk Alleles: {'⚠️ PRESENT - SEVERE HYPERSENSITIVITY RISK' if patient_data.get('hla_risk_allele_flag') == 1 else '✓ None detected'}
        
        💊 PERSONALIZED DOSING ANALYSIS:
        - Standard Dose: {patient_data.get('index_drug_dose', 'N/A')} mg
        - Recommended Personalized Dose: {prediction_result.get('advanced_pharmacogenomics', {}).get('personalized_dosing', {}).get('recommended_dose', 'N/A')} mg
        - Dose Adjustment Factor: {prediction_result.get('advanced_pharmacogenomics', {}).get('personalized_dosing', {}).get('dose_adjustment_factor', 'N/A')}
        - Dosing Complexity: {prediction_result.get('advanced_pharmacogenomics', {}).get('precision_medicine_summary', {}).get('dosing_complexity', {}).get('complexity_level', 'N/A')}
        
        🎯 THERAPEUTIC DRUG MONITORING:
        - TDM Recommended: {prediction_result.get('advanced_pharmacogenomics', {}).get('personalized_dosing', {}).get('tdm_recommendations', {}).get('recommended', 'N/A')}
        - Monitoring Intensity: {prediction_result.get('advanced_pharmacogenomics', {}).get('precision_medicine_summary', {}).get('monitoring_intensity', {}).get('intensity_level', 'N/A')}
        
        ⚠️ DRUG INTERACTION FLAGS:
        - CYP Inhibitor Co-administration: {'⚠️ YES - SIGNIFICANT INTERACTION RISK' if patient_data.get('cyp_inhibitors_flag') == 1 else '✓ No'}
        - QT-Prolonging Drugs: {'⚠️ YES - CARDIAC ARRHYTHMIA RISK' if patient_data.get('qt_prolonging_flag') == 1 else '✓ No'}
        
        📈 PRECISION MEDICINE SUMMARY:
        - Overall Genetic Risk: {prediction_result.get('advanced_pharmacogenomics', {}).get('precision_medicine_summary', {}).get('overall_genetic_risk', {}).get('risk_category', 'N/A')}
        - Clinical Actionability: {prediction_result.get('advanced_pharmacogenomics', {}).get('precision_medicine_summary', {}).get('clinical_actionability', {}).get('actionability_level', 'N/A')}
        - Implementation Priority: {prediction_result.get('advanced_pharmacogenomics', {}).get('precision_medicine_summary', {}).get('clinical_actionability', {}).get('urgency_level', 'N/A')}

        📊 VITAL SIGNS & PHYSIOLOGICAL PARAMETERS:
        - Systolic Blood Pressure: {patient_data.get('bp_systolic', 'N/A')} mmHg
        - Diastolic Blood Pressure: {patient_data.get('bp_diastolic', 'N/A')} mmHg
        - Heart Rate: {patient_data.get('heart_rate', 'N/A')} bpm
        - Blood Pressure Category: {'HYPERTENSIVE CRISIS' if patient_data.get('bp_systolic', 0) >= 180 else 'STAGE 2 HYPERTENSION' if patient_data.get('bp_systolic', 0) >= 140 else 'STAGE 1 HYPERTENSION' if patient_data.get('bp_systolic', 0) >= 130 else 'ELEVATED' if patient_data.get('bp_systolic', 0) >= 120 else 'NORMAL'}

        🏥 CLINICAL SETTING & RISK FACTORS:
        - Inpatient Status: {'✓ INPATIENT (Higher ADR Risk)' if patient_data.get('inpatient_flag') == 1 else '✗ Outpatient'}
        - Prior ADR History: {'⚠️ POSITIVE HISTORY (Increased Risk)' if patient_data.get('prior_adr_history') == 1 else '✓ No Previous ADRs'}

        ═══════════════════════════════════════════════════════════════════════════════════════
        🤖 AI PREDICTION MODEL RESULTS & RISK STRATIFICATION
        ═══════════════════════════════════════════════════════════════════════════════════════

        🎯 PRIMARY PREDICTION OUTCOME:
        - Most Likely ADR Type: {prediction_result.get('predicted_adr_type', 'N/A')}
        - Overall Risk Classification: {prediction_result.get('risk_level', 'N/A')} RISK
        - Safety Probability (No ADR): {prediction_result.get('no_adr_probability', 'N/A')}%
        - ADR Probability: {100 - float(prediction_result.get('no_adr_probability', 0))}%

        📈 COMPLETE ADR TYPE PROBABILITY MATRIX:
        {chr(10).join([f"   • {adr_type}: {prob}% probability" for adr_type, prob in prediction_result.get('all_adr_types', {}).items()])}

        🔥 TOP HIGH-RISK ADR CATEGORIES (Requiring Immediate Attention):
        {chr(10).join([f"   🚨 {adr_type}: {prob}% - {'CRITICAL RISK' if prob > 15 else 'HIGH RISK' if prob > 10 else 'MODERATE RISK'}" for adr_type, prob in list(prediction_result.get('top_specific_adr_risks', {}).items())[:5]])}

        ═══════════════════════════════════════════════════════════════════════════════════════
        📝 GENERATE EXTREMELY DETAILED CLINICAL ANALYSIS REPORT
        ═══════════════════════════════════════════════════════════════════════════════════════

        Please provide an EXHAUSTIVELY DETAILED clinical report with the following comprehensive sections. Each section must be thorough, evidence-based, and clinically actionable:

        ## 🎯 EXECUTIVE RISK ASSESSMENT SUMMARY
        Provide a detailed 4-5 paragraph executive summary covering:
        - Overall ADR risk stratification with specific percentages and clinical significance
        - Primary concerns and immediate risk factors requiring attention
        - Key patient-specific vulnerabilities and protective factors
        - Comparison to population norms and risk benchmarks
        - Clinical decision-making implications and urgency level

        ## ⚠️ COMPREHENSIVE RISK FACTOR ANALYSIS
        Provide detailed analysis of ALL contributing factors:
        
        ### Patient-Specific Risk Factors:
        - Age-related pharmacokinetic/pharmacodynamic changes and implications
        - Sex-specific considerations (hormonal, metabolic, body composition effects)
        - Ethnicity-related genetic polymorphisms and drug response variations
        - BMI impact on drug distribution, metabolism, and clearance
        
        ### Organ Function Assessment:
        - Detailed renal function analysis (creatinine, eGFR) and drug clearance implications
        - Comprehensive hepatic function evaluation (AST/ALT, bilirubin, albumin) and metabolism capacity
        - Hematological status assessment and bleeding/infection risk evaluation
        - Cardiovascular status and hemodynamic considerations
        
        ### Comorbidity Impact Analysis:
        - Diabetes: glycemic control, nephropathy, neuropathy implications for drug safety
        - Liver disease: Child-Pugh classification implications, drug metabolism alterations
        - CKD: staging, progression risk, drug accumulation potential
        - Cardiac disease: arrhythmia risk, heart failure considerations, drug interactions
        
        ### Advanced Pharmacogenomic Risk Assessment:
        - Comprehensive CYP Enzyme Profile: Detailed analysis of CYP2C9, CYP2D6, CYP3A4, CYP1A2, CYP2B6, CYP2C19 status
        - Drug Transporter Genetics: SLCO1B1, ABCB1, ABCG2 polymorphisms and drug disposition implications
        - HLA Hypersensitivity Risk: Detailed HLA-A, HLA-B, HLA-DRB1 typing and severe reaction risk assessment
        - Personalized Dosing Algorithms: Bayesian dose optimization and therapeutic drug monitoring integration
        - Precision Medicine Implementation: Clinical actionability assessment and implementation priorities
        - Population Pharmacokinetic Modeling: Individual PK parameter estimation and dose-response predictions

        ## 💊 DETAILED MEDICATION OPTIMIZATION RECOMMENDATIONS
        
        ### Current Therapy Assessment:
        - Detailed analysis of current medication appropriateness for this patient profile
        - Dose optimization based on organ function, age, weight, and genetic factors
        - Drug-drug interaction assessment with specific mechanism explanations
        - Therapeutic drug monitoring recommendations with target levels
        
        ### Alternative Medication Strategies:
        - Safer therapeutic alternatives with lower ADR risk profiles for this patient
        - Specific medication switches with transition protocols and monitoring plans
        - Dose reduction strategies while maintaining therapeutic efficacy
        - Combination therapy modifications to reduce overall risk burden
        
        ### Drug Avoidance Recommendations:
        - Specific medications to absolutely avoid in this patient (with detailed rationale)
        - Drug classes requiring extreme caution with enhanced monitoring
        - Over-the-counter medications and supplements to avoid
        - Future prescribing considerations and contraindications

        ## 🏥 COMPREHENSIVE CLINICAL MANAGEMENT PROTOCOL
        
        ### Immediate Actions (Next 24-48 Hours):
        - Urgent interventions required based on current risk level
        - Laboratory tests to order immediately with specific rationale
        - Vital sign monitoring frequency and parameters to track
        - Patient assessment priorities and red flag symptoms to monitor
        
        ### Short-term Management (1-4 Weeks):
        - Medication adjustments with specific timelines and protocols
        - Follow-up appointment scheduling with appropriate specialists
        - Patient education priorities and safety counseling points
        - Caregiver involvement and support system activation
        
        ### Long-term Management Strategy (1-6 Months):
        - Ongoing monitoring protocols with specific intervals and parameters
        - Disease progression monitoring and medication adjustment triggers
        - Quality of life assessments and functional status evaluations
        - Preventive care integration and health maintenance priorities

        ## 📊 INTENSIVE MONITORING PROTOCOL
        
        ### Laboratory Monitoring Schedule:
        - Specific lab tests required with detailed frequency (daily, weekly, monthly)
        - Target ranges and action thresholds for each parameter
        - Trending analysis requirements and interpretation guidelines
        - Critical value protocols and immediate notification procedures
        
        ### Clinical Monitoring Requirements:
        - Vital sign monitoring frequency and automated alert parameters
        - Physical examination focus areas and assessment techniques
        - Symptom tracking tools and patient-reported outcome measures
        - Functional status assessments and activities of daily living evaluation
        
        ### Technology-Enhanced Monitoring:
        - Remote monitoring device recommendations (BP cuffs, glucose meters, etc.)
        - Mobile health app integration for symptom tracking and medication adherence
        - Telemedicine follow-up protocols and virtual care coordination
        - Electronic health record alert configurations and clinical decision support

        ## 👨‍⚕️ PATIENT & FAMILY EDUCATION COMPREHENSIVE PLAN
        
        ### Critical Safety Education:
        - Detailed explanation of specific ADR risks in patient-friendly language
        - Red flag symptoms requiring immediate medical attention (with specific examples)
        - When and how to contact healthcare providers (emergency vs. routine)
        - Medication administration best practices and timing optimization
        
        ### Lifestyle Modification Recommendations:
        - Dietary considerations and drug-food interactions to avoid
        - Exercise limitations and safe physical activity guidelines
        - Sleep hygiene and stress management for optimal drug response
        - Alcohol and substance use restrictions with detailed explanations
        
        ### Adherence Support Strategies:
        - Medication organization systems and reminder tools
        - Side effect management techniques and coping strategies
        - Communication strategies for reporting concerns and symptoms
        - Family/caregiver involvement in medication management and monitoring

        ## 🧬 COMPREHENSIVE ADVANCED PHARMACOGENOMICS & PRECISION MEDICINE ANALYSIS
        
        ### Expanded CYP Enzyme System Analysis:
        - **CYP2C9 Implications**: Detailed analysis of warfarin, phenytoin, NSAIDs metabolism and dosing requirements
        - **CYP2D6 Phenotype Impact**: Comprehensive assessment of codeine, tramadol, antidepressants, antipsychotics metabolism
        - **CYP3A4 Considerations**: Major drug metabolizing enzyme affecting >50% of medications - statins, immunosuppressants, calcium channel blockers
        - **CYP1A2 Analysis**: Caffeine, theophylline, clozapine metabolism implications and drug interactions
        - **CYP2B6 Assessment**: Bupropion, efavirenz metabolism and psychiatric/HIV medication considerations
        - **CYP2C19 Evaluation**: PPI effectiveness, clopidogrel activation, antidepressant metabolism analysis
        - **Composite Metabolism Score**: Overall metabolic capacity assessment and clinical implications
        - **Enzyme-Specific Drug Recommendations**: Detailed alternative medications for each impaired enzyme pathway
        
        ### Drug Transporter Genetics & Pharmacokinetics:
        - **SLCO1B1 Transporter Analysis**: Statin myopathy risk assessment and alternative statin selection
        - **ABCB1 (P-glycoprotein) Impact**: Digoxin, dabigatran, fexofenadine disposition and dosing implications
        - **ABCG2 (BCRP) Considerations**: Rosuvastatin, methotrexate, sulfasalazine transport and toxicity risk
        - **Drug Disposition Risk Assessment**: Overall impact on drug absorption, distribution, and elimination
        - **Transporter-Drug Interaction Analysis**: Specific drug combinations requiring enhanced monitoring
        - **Personalized Pharmacokinetic Modeling**: Individual drug clearance and exposure predictions
        
        ### HLA Hypersensitivity Risk & Immunogenetics:
        - **HLA-A Typing Implications**: Specific drug hypersensitivity risks and contraindications
        - **HLA-B Risk Assessment**: Stevens-Johnson syndrome, TEN, and severe cutaneous reaction prevention
        - **HLA-DRB1 Analysis**: Drug-induced liver injury and autoimmune reaction risk evaluation
        - **Medication-Specific HLA Screening**: Current and future drug selection based on HLA profile
        - **Hypersensitivity Prevention Protocols**: Specific monitoring and intervention strategies
        - **Alternative Therapy Selection**: HLA-safe medication alternatives and therapeutic equivalents
        
        ### Precision Dosing & Therapeutic Optimization:
        - **Bayesian Dose Optimization**: Real-time dose adjustment algorithms based on patient response
        - **Therapeutic Drug Monitoring Integration**: TDM-guided dosing with genetic considerations
        - **Age-Stratified Dosing Protocols**: Pediatric, adult, geriatric-specific genetic considerations
        - **Organ Function-Genetic Integration**: Combined renal/hepatic function and genetic dosing algorithms
        - **Population Pharmacokinetic Applications**: Individual PK parameter estimation and dose prediction
        - **Confidence Interval Analysis**: Uncertainty quantification in genetic-based dosing recommendations
        
        ### Clinical Implementation & Actionability:
        - **Immediate Genetic Interventions**: Critical genetic findings requiring immediate action
        - **Short-term Genetic Considerations**: Genetic factors affecting current therapy within 1-4 weeks
        - **Long-term Pharmacogenomic Planning**: Genetic considerations for future medication decisions
        - **Genetic Testing Recommendations**: Additional genetic tests to optimize therapy
        - **Clinical Decision Support Integration**: EHR alerts and prescribing decision support based on genetics
        - **Pharmacist Consultation Triggers**: Genetic findings requiring specialized pharmaceutical expertise
        
        ### Advanced Genetic Risk Stratification:
        - **Composite Genetic Risk Score**: Overall genetic risk assessment across all tested genes
        - **Gene-Drug Interaction Matrix**: Comprehensive analysis of all relevant gene-drug pairs
        - **Genetic Contraindication Assessment**: Absolute and relative contraindications based on genetics
        - **Genetic Monitoring Requirements**: Intensive, enhanced, or standard monitoring based on genetic profile
        - **Genetic Emergency Protocols**: Specific interventions for genetic-based adverse reactions
        - **Family Genetic Counseling**: Implications for family members and cascade genetic testing
        
        ### Emerging Pharmacogenomic Considerations:
        - **Novel Genetic Biomarkers**: Emerging genetic tests relevant to this patient's therapy
        - **Pharmacogenomic Research Opportunities**: Clinical trial eligibility based on genetic profile
        - **Future Therapeutic Options**: Genetic considerations for emerging medications and therapies
        - **Precision Medicine Evolution**: How genetic profile may influence future treatment paradigms

        ## 🚨 EMERGENCY RESPONSE PROTOCOLS
        
        ### High-Risk ADR Recognition:
        - Specific signs and symptoms of each predicted ADR type with clinical descriptions
        - Severity grading systems and escalation criteria
        - Time-sensitive intervention protocols and treatment algorithms
        - Emergency department communication templates and critical information transfer
        
        ### Immediate Intervention Protocols:
        - Step-by-step emergency response procedures for each ADR type
        - Antidote administration protocols and contraindications
        - Supportive care measures and monitoring requirements during acute events
        - Medication discontinuation criteria and withdrawal management protocols
        
        ### Healthcare System Coordination:
        - Emergency contact information and escalation pathways
        - Specialist consultation triggers and referral protocols
        - Hospital admission criteria and inpatient management considerations
        - Discharge planning and transition of care protocols

        ## 📅 DETAILED FOLLOW-UP & CONTINUITY OF CARE PLAN
        
        ### Structured Follow-up Schedule:
        - Specific appointment intervals with rationale for timing
        - Visit-specific objectives and assessment priorities
        - Provider coordination and communication protocols
        - Patient preparation requirements for each follow-up visit
        
        ### Outcome Monitoring & Assessment:
        - Therapeutic efficacy monitoring with objective measures
        - ADR surveillance protocols and documentation requirements
        - Quality of life assessments and patient satisfaction measures
        - Healthcare utilization tracking and cost-effectiveness evaluation
        
        ### Long-term Care Coordination:
        - Specialist referral protocols and shared care arrangements
        - Medication therapy management services integration
        - Chronic disease management program enrollment considerations
        - Preventive care integration and health maintenance scheduling

        ## 📋 CLINICAL DECISION SUPPORT & DOCUMENTATION
        
        ### Evidence-Based Recommendations:
        - Literature citations supporting each recommendation
        - Clinical guideline adherence and best practice alignment
        - Risk-benefit analysis for each therapeutic decision
        - Alternative approach considerations with comparative effectiveness data
        
        ### Quality Metrics & Outcomes:
        - Key performance indicators for monitoring care quality
        - Patient safety metrics and adverse event tracking
        - Clinical outcome measures and success criteria
        - Continuous quality improvement opportunities and protocols

        ═══════════════════════════════════════════════════════════════════════════════════════

        FORMAT REQUIREMENTS:
        - Use professional medical terminology appropriate for clinical documentation
        - Include specific medication names, doses, frequencies, and durations
        - Provide exact timeframes for all recommendations (hours, days, weeks, months)
        - Use bullet points, numbered lists, and clear headings for readability
        - Highlight critical information with appropriate emphasis
        - Include relevant clinical pearls and evidence-based insights
        - Ensure all recommendations are actionable and specific
        - Maintain consistency with current clinical guidelines and best practices

        This report will be used for critical patient care decisions and must be comprehensive, accurate, and clinically actionable. Please provide the most detailed analysis possible across all requested domains.
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
            'name': 'High Risk Patient - Elderly with Multiple Comorbidities',
            'age': 75, 'sex': 'M', 'ethnicity': 'White', 'height': 175, 'weight': 95, 'bmi': 31.0,
            'creatinine': 4.5, 'egfr': 25, 'ast_alt': 285, 'bilirubin': 4.2, 'albumin': 2.1,
            'temperature': 99.8, 'ind_value': 2.8, 'atpp_value': 65.2,
            'hemoglobin': 8.5, 'hematocrit': 25.5, 'wbc_count': 12.8, 'platelet_count': 95, 'rbc_count': 3.2,
            'diabetes': 1, 'liver_disease': 1, 'ckd': 1, 'cardiac_disease': 1, 'hypertension': 1,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Warfarin', 'index_drug_dose': 400, 'drug_interactions': 'Major',
            'concomitant_drugs_count': 18,
            'cyp2c9': 'Poor', 'cyp2d6': 'PM', 'bp_systolic': 185, 'bp_diastolic': 105,
            'heart_rate': 115, 'time_since_start_days': 45, 'cyp_inhibitors_flag': 1,
            'qt_prolonging_flag': 1, 'hla_risk_allele_flag': 1, 'inpatient_flag': 1,
            'prior_adr_history': 1
        },
        'medium-risk': {
            'name': 'Medium Risk Patient - Middle-aged with Diabetes',
            'age': 55, 'sex': 'F', 'ethnicity': 'Asian', 'height': 160, 'weight': 70, 'bmi': 27.3,
            'creatinine': 2.8, 'egfr': 45, 'ast_alt': 125, 'bilirubin': 2.1, 'albumin': 3.2,
            'temperature': 98.4, 'ind_value': 1.8, 'atpp_value': 42.1,
            'hemoglobin': 10.5, 'hematocrit': 31.5, 'wbc_count': 9.2, 'platelet_count': 185, 'rbc_count': 3.8,
            'diabetes': 1, 'liver_disease': 0, 'ckd': 0, 'cardiac_disease': 1, 'hypertension': 1,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Metformin', 'index_drug_dose': 300, 'drug_interactions': 'Moderate',
            'concomitant_drugs_count': 12,
            'cyp2c9': 'Intermediate', 'cyp2d6': 'IM', 'bp_systolic': 165, 'bp_diastolic': 95,
            'heart_rate': 88, 'time_since_start_days': 30, 'cyp_inhibitors_flag': 0,
            'qt_prolonging_flag': 1, 'hla_risk_allele_flag': 0, 'inpatient_flag': 0,
            'prior_adr_history': 0
        },
        'low-risk': {
            'name': 'Low Risk Patient - Young Healthy Adult',
            'age': 35, 'sex': 'M', 'ethnicity': 'White', 'height': 180, 'weight': 78, 'bmi': 24.1,
            'creatinine': 1.1, 'egfr': 85, 'ast_alt': 45, 'bilirubin': 0.8, 'albumin': 4.5,
            'temperature': 98.6, 'ind_value': 1.0, 'atpp_value': 28.5,
            'hemoglobin': 14.2, 'hematocrit': 42.6, 'wbc_count': 6.8, 'platelet_count': 285, 'rbc_count': 4.7,
            'diabetes': 0, 'liver_disease': 0, 'ckd': 0, 'cardiac_disease': 0, 'hypertension': 0,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Lisinopril', 'index_drug_dose': 200, 'drug_interactions': 'Minor',
            'concomitant_drugs_count': 5,
            'cyp2c9': 'Wild', 'cyp2d6': 'EM', 'bp_systolic': 135, 'bp_diastolic': 85,
            'heart_rate': 72, 'time_since_start_days': 14, 'cyp_inhibitors_flag': 0,
            'qt_prolonging_flag': 0, 'hla_risk_allele_flag': 0, 'inpatient_flag': 0,
            'prior_adr_history': 0
        },
        'liver-disease': {
            'name': 'Liver Disease Patient - Hepatic Impairment',
            'age': 62, 'sex': 'M', 'ethnicity': 'Hispanic', 'height': 170, 'weight': 85, 'bmi': 29.4,
            'creatinine': 1.8, 'egfr': 55, 'ast_alt': 450, 'bilirubin': 8.5, 'albumin': 2.3,
            'temperature': 99.2, 'ind_value': 2.1, 'atpp_value': 48.7,
            'hemoglobin': 9.8, 'hematocrit': 29.4, 'wbc_count': 11.5, 'platelet_count': 125, 'rbc_count': 3.5,
            'diabetes': 0, 'liver_disease': 1, 'ckd': 0, 'cardiac_disease': 0, 'hypertension': 1,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Acetaminophen', 'index_drug_dose': 250, 'drug_interactions': 'Major',
            'concomitant_drugs_count': 8,
            'cyp2c9': 'Poor', 'cyp2d6': 'IM', 'bp_systolic': 145, 'bp_diastolic': 88,
            'heart_rate': 82, 'time_since_start_days': 21, 'cyp_inhibitors_flag': 1,
            'qt_prolonging_flag': 0, 'hla_risk_allele_flag': 0, 'inpatient_flag': 1,
            'prior_adr_history': 1
        },
        'cardiac-patient': {
            'name': 'Cardiac Patient - Heart Failure with Arrhythmia',
            'age': 71, 'sex': 'M', 'ethnicity': 'White', 'height': 178, 'weight': 88, 'bmi': 27.8,
            'creatinine': 2.1, 'egfr': 42, 'ast_alt': 65, 'bilirubin': 1.5, 'albumin': 3.8,
            'temperature': 98.9, 'ind_value': 1.6, 'atpp_value': 35.8,
            'hemoglobin': 11.2, 'hematocrit': 33.6, 'wbc_count': 7.8, 'platelet_count': 195, 'rbc_count': 4.1,
            'diabetes': 1, 'liver_disease': 0, 'ckd': 0, 'cardiac_disease': 1, 'hypertension': 1,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Digoxin', 'index_drug_dose': 125, 'drug_interactions': 'Major',
            'concomitant_drugs_count': 14,
            'cyp2c9': 'Wild', 'cyp2d6': 'IM', 'bp_systolic': 155, 'bp_diastolic': 92,
            'heart_rate': 105, 'time_since_start_days': 35, 'cyp_inhibitors_flag': 1,
            'qt_prolonging_flag': 1, 'hla_risk_allele_flag': 0, 'inpatient_flag': 0,
            'prior_adr_history': 1
        },
        'elderly-frail': {
            'name': 'Elderly Frail Patient - Multiple Medications',
            'age': 82, 'sex': 'F', 'ethnicity': 'Asian', 'height': 155, 'weight': 52, 'bmi': 21.6,
            'creatinine': 2.5, 'egfr': 28, 'ast_alt': 85, 'bilirubin': 1.8, 'albumin': 2.9,
            'temperature': 99.1, 'ind_value': 2.4, 'atpp_value': 52.3,
            'hemoglobin': 9.1, 'hematocrit': 27.3, 'wbc_count': 6.2, 'platelet_count': 165, 'rbc_count': 3.3,
            'diabetes': 1, 'liver_disease': 0, 'ckd': 1, 'cardiac_disease': 1, 'hypertension': 1,
            'respiratory_disease': 1, 'neurological_disease': 1, 'autoimmune_disease': 0,
            'medication_name': 'Warfarin', 'index_drug_dose': 175, 'drug_interactions': 'Major',
            'concomitant_drugs_count': 22,
            'cyp2c9': 'Poor', 'cyp2d6': 'PM', 'bp_systolic': 165, 'bp_diastolic': 85,
            'heart_rate': 88, 'time_since_start_days': 90, 'cyp_inhibitors_flag': 1,
            'qt_prolonging_flag': 1, 'hla_risk_allele_flag': 1, 'inpatient_flag': 1,
            'prior_adr_history': 1
        },
        'cancer-patient': {
            'name': 'Cancer Patient - Chemotherapy Treatment',
            'age': 58, 'sex': 'F', 'ethnicity': 'White', 'height': 168, 'weight': 65, 'bmi': 23.0,
            'creatinine': 1.6, 'egfr': 65, 'ast_alt': 195, 'bilirubin': 2.8, 'albumin': 3.0,
            'temperature': 100.2, 'ind_value': 1.3, 'atpp_value': 31.7,
            'hemoglobin': 8.8, 'hematocrit': 26.4, 'wbc_count': 3.2, 'platelet_count': 85, 'rbc_count': 3.1,
            'diabetes': 0, 'liver_disease': 1, 'ckd': 0, 'cardiac_disease': 0, 'hypertension': 0,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Methotrexate', 'index_drug_dose': 450, 'drug_interactions': 'Major',
            'concomitant_drugs_count': 10,
            'cyp2c9': 'Intermediate', 'cyp2d6': 'EM', 'bp_systolic': 125, 'bp_diastolic': 78,
            'heart_rate': 92, 'time_since_start_days': 28, 'cyp_inhibitors_flag': 1,
            'qt_prolonging_flag': 0, 'hla_risk_allele_flag': 0, 'inpatient_flag': 1,
            'prior_adr_history': 1
        },
        'pediatric-equivalent': {
            'name': 'Young Adult Patient - Minimal Risk Profile',
            'age': 22, 'sex': 'F', 'ethnicity': 'Hispanic', 'height': 162, 'weight': 58, 'bmi': 22.1,
            'creatinine': 0.8, 'egfr': 105, 'ast_alt': 28, 'bilirubin': 0.6, 'albumin': 4.8,
            'temperature': 98.4, 'ind_value': 0.9, 'atpp_value': 26.8,
            'hemoglobin': 13.8, 'hematocrit': 41.4, 'wbc_count': 6.5, 'platelet_count': 325, 'rbc_count': 4.6,
            'diabetes': 0, 'liver_disease': 0, 'ckd': 0, 'cardiac_disease': 0, 'hypertension': 0,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Ibuprofen', 'index_drug_dose': 150, 'drug_interactions': 'None',
            'concomitant_drugs_count': 2,
            'cyp2c9': 'Wild', 'cyp2d6': 'EM', 'bp_systolic': 115, 'bp_diastolic': 72,
            'heart_rate': 68, 'time_since_start_days': 7, 'cyp_inhibitors_flag': 0,
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

# Patient details endpoint removed
        return jsonify({'error': f'Failed to retrieve patient details: {str(e)}'}), 500

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
    
    medications.append({
        'name': primary_med,
        'dose': f"{dose} mg" if dose else "Dose not specified",
        'type': 'Primary',
        'risk_level': get_medication_risk_level(primary_med)
    })
    
    # Concomitant medications (simulated based on common combinations)
    concomitant_count = patient_data.get('concomitant_drugs_count', 0)
    if concomitant_count > 0:
        common_concomitants = get_common_concomitant_drugs(primary_med, concomitant_count)
        medications.extend(common_concomitants)
    
    return medications

def get_common_concomitant_drugs(primary_med, count):
    """Get common concomitant drugs based on primary medication"""
    concomitant_drugs = {
        'Warfarin': ['Aspirin 81mg', 'Atorvastatin 20mg', 'Metoprolol 50mg', 'Lisinopril 10mg'],
        'Metformin': ['Lisinopril 10mg', 'Atorvastatin 40mg', 'Aspirin 81mg', 'Metoprolol 25mg'],
        'Lisinopril': ['Hydrochlorothiazide 25mg', 'Amlodipine 5mg', 'Metformin 500mg', 'Atorvastatin 20mg'],
        'Atorvastatin': ['Aspirin 81mg', 'Lisinopril 10mg', 'Metformin 500mg', 'Amlodipine 5mg']
    }
    

    
    # Get drugs based on primary medication
    drug_list = concomitant_drugs.get(primary_med, [
        'Aspirin 81mg', 'Lisinopril 10mg', 'Atorvastatin 20mg', 'Metformin 500mg'
    ])
    
    medications = []
    for i, drug in enumerate(drug_list[:count]):
        drug_parts = drug.split(' ')
        name = drug_parts[0]
        dose = ' '.join(drug_parts[1:]) if len(drug_parts) > 1 else "Standard dose"
        
        medications.append({
            'name': name,
            'dose': dose,
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
    print(f"🌐 Starting ADR Risk Predictor on http://localhost:{port}")
    print("🔥 New features: Emergency ADR Management, Clinical Decision Support, Enhanced CBC Analysis")
    app.run(debug=debug, host='0.0.0.0', port=port)