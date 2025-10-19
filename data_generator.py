import pandas as pd
import numpy as np
import random

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

def generate_synthetic_data(num_patients=200000):
    """Generates a synthetic dataset with realistic clinical dependencies for ADR risk prediction."""

    data = {}

    # --- 1. Patient Demographics & Age-dependent Comorbidities ---
    data['age'] = np.random.randint(30, 85, num_patients)
    data['sex'] = np.random.choice(['M', 'F'], num_patients, p=[0.5, 0.5])
    data['ethnicity'] = np.random.choice(['White', 'Asian', 'Black', 'Hispanic'], num_patients, p=[0.45, 0.25, 0.15, 0.15])
    
    data['height_cm'] = np.random.normal(loc=170, scale=10, size=num_patients)
    data['weight_kg'] = np.random.normal(loc=80, scale=15, size=num_patients)
    data['bmi'] = data['weight_kg'] / (data['height_cm'] / 100)**2

    # Introduce age dependence for chronic diseases
    prob_base = 0.1 # Base probability for younger patients
    age_factor = (data['age'] - 30) / 55 # Factor scales from 0 (age 30) to 1 (age 85)

    # Comorbidities based on age and a random factor
    # Convert lists to numpy arrays for efficient indexing/modification
    diabetes_list = [1 if np.random.rand() < (0.10 + 0.3 * f) else 0 for f in age_factor]
    ckd_list = [1 if np.random.rand() < (0.05 + 0.2 * f) else 0 for f in age_factor]
    cardiac_disease_list = [1 if np.random.rand() < (0.15 + 0.4 * f) else 0 for f in age_factor]
    
    data['liver_disease'] = np.random.choice([0, 1], num_patients, p=[0.92, 0.08]) # Less age-dependent

    # BMI dependency for diabetes: Increase diabetes flag if BMI > 30 (obese)
    for i in np.where(data['bmi'] > 30)[0]:
        if np.random.rand() < 0.6: 
            diabetes_list[i] = 1

    data['diabetes'] = diabetes_list
    data['ckd'] = ckd_list
    data['cardiac_disease'] = cardiac_disease_list

    # --- 2. Vitals (Influenced by Cardiac Disease and Age) ---
    bp_systolic_base = np.random.normal(loc=120, scale=10, size=num_patients)
    heart_rate_base = np.random.normal(loc=70, scale=10, size=num_patients)
    
    # Use numpy vectorized operations or efficient indexing where possible for large data
    
    # Calculate indices where cardiac disease or age > 60 applies
    cardiac_or_old_indices = np.where((np.array(data['cardiac_disease']) == 1) | (data['age'] > 60))[0]
    bp_systolic_base[cardiac_or_old_indices] += np.random.uniform(10, 25, size=len(cardiac_or_old_indices))

    # Calculate indices where cardiac disease applies
    cardiac_indices = np.where(np.array(data['cardiac_disease']) == 1)[0]
    heart_rate_base[cardiac_indices] += np.random.uniform(5, 15, size=len(cardiac_indices))
            
    data['bp_systolic'] = np.clip(bp_systolic_base, 80, 220).astype(int)
    data['bp_diastolic'] = np.clip(np.random.normal(loc=80, scale=12, size=num_patients), 50, 130).astype(int)
    data['heart_rate'] = np.clip(heart_rate_base, 40, 150).astype(int)

    # --- 3. Labs (Strongly influenced by Comorbidities) ---
    
    # LABS: Creatinine/eGFR (Strongly influenced by CKD and Age)
    creatinine_base = np.random.normal(loc=1.2, scale=0.3, size=num_patients)
    
    # Find indices for CKD patients and old patients
    ckd_indices = np.where(np.array(data['ckd']) == 1)[0]
    old_indices = np.where(data['age'] > 70)[0]
    
    # Apply high creatinine for CKD
    creatinine_base[ckd_indices] += np.random.uniform(1.0, 4.0, size=len(ckd_indices))
    # Apply slight elevation for older patients (careful not to double-count those with CKD)
    only_old_indices = np.setdiff1d(old_indices, ckd_indices)
    creatinine_base[only_old_indices] += np.random.uniform(0.2, 1.0, size=len(only_old_indices))
            
    data['creatinine'] = np.clip(creatinine_base, 0.5, 12.0).round(2)
    # Recalculate eGFR based on new creatinine (Cockcroft-Gault-like simplification)
    data['egfr'] = 141 * (data['creatinine'] / 0.9)**(-1.2) * (0.993)**data['age'] 

    # LABS: Liver Function (Influenced by Liver Disease)
    ast_alt_base = np.random.normal(loc=35, scale=15, size=num_patients)
    bilirubin_base = np.random.normal(loc=0.8, scale=0.4, size=num_patients)
    albumin_base = np.random.normal(loc=4.5, scale=0.5, size=num_patients)

    liver_indices = np.where(data['liver_disease'] == 1)[0]
    
    # Apply high LFTs/low albumin for liver disease
    ast_alt_base[liver_indices] += np.random.uniform(100, 800, size=len(liver_indices))
    bilirubin_base[liver_indices] += np.random.uniform(2.0, 8.0, size=len(liver_indices))
    albumin_base[liver_indices] -= np.random.uniform(1.0, 3.0, size=len(liver_indices))

    data['ast_alt'] = np.clip(ast_alt_base, 15, 1200).astype(int)
    data['bilirubin'] = np.clip(bilirubin_base, 0.2, 15.0).round(2)
    data['albumin'] = np.clip(albumin_base, 1.5, 800.0).round(2)

    # --- NEW: Additional Clinical Parameters ---
    # Temperature (influenced by infection/inflammation)
    temperature_base = np.random.normal(loc=98.6, scale=0.8, size=num_patients)  # Normal body temp in Fahrenheit
    # Add fever for some patients (simulate infection/inflammation)
    fever_indices = np.random.choice(range(num_patients), size=int(num_patients * 0.15), replace=False)
    temperature_base[fever_indices] += np.random.uniform(1.0, 4.0, size=len(fever_indices))
    data['temperature'] = np.clip(temperature_base, 95.0, 106.0).round(1)

    # IND (International Normalized Ratio) - coagulation parameter
    ind_base = np.random.normal(loc=1.0, scale=0.2, size=num_patients)
    # Higher IND for patients on anticoagulants or with liver disease
    anticoag_indices = np.random.choice(range(num_patients), size=int(num_patients * 0.2), replace=False)
    ind_base[anticoag_indices] += np.random.uniform(0.5, 2.0, size=len(anticoag_indices))
    ind_base[liver_indices] += np.random.uniform(0.3, 1.5, size=len(liver_indices))
    data['ind_value'] = np.clip(ind_base, 0.8, 5.0).round(2)

    # ATPP (Activated Thromboplastin Time Partial) - coagulation parameter
    atpp_base = np.random.normal(loc=30, scale=5, size=num_patients)  # Normal range ~25-35 seconds
    # Higher ATPP for patients on heparin or with coagulation disorders
    heparin_indices = np.random.choice(range(num_patients), size=int(num_patients * 0.15), replace=False)
    atpp_base[heparin_indices] += np.random.uniform(10, 40, size=len(heparin_indices))
    data['atpp_value'] = np.clip(atpp_base, 20, 120).round(1)

    # --- CBC (Complete Blood Count) Parameters ---
    # Hemoglobin (g/dL) - influenced by age, gender, and chronic diseases
    hemoglobin_base = np.where(data['sex'] == 'M', 
                              np.random.normal(loc=15.0, scale=2.0, size=num_patients),
                              np.random.normal(loc=13.5, scale=1.8, size=num_patients))
    
    # Lower hemoglobin for chronic diseases
    chronic_indices = np.where((np.array(data['ckd']) == 1) | (np.array(data['cardiac_disease']) == 1))[0]
    hemoglobin_base[chronic_indices] -= np.random.uniform(1.0, 4.0, size=len(chronic_indices))
    data['hemoglobin'] = np.clip(hemoglobin_base, 6.0, 20.0).round(1)

    # Hematocrit (%) - typically 3x hemoglobin
    hematocrit_base = data['hemoglobin'] * 3 + np.random.normal(0, 2, size=num_patients)
    data['hematocrit'] = np.clip(hematocrit_base, 18.0, 60.0).round(1)

    # White Blood Cell Count (WBC) - thousands/μL
    wbc_base = np.random.normal(loc=7.5, scale=2.5, size=num_patients)
    # Higher WBC for infections/inflammation
    infection_indices = np.random.choice(range(num_patients), size=int(num_patients * 0.1), replace=False)
    wbc_base[infection_indices] += np.random.uniform(5.0, 15.0, size=len(infection_indices))
    data['wbc_count'] = np.clip(wbc_base, 2.0, 30.0).round(1)

    # Platelet Count - thousands/μL
    platelet_base = np.random.normal(loc=275, scale=75, size=num_patients)
    # Lower platelets for liver disease or certain medications
    platelet_base[liver_indices] -= np.random.uniform(50, 150, size=len(liver_indices))
    data['platelet_count'] = np.clip(platelet_base, 50, 600).astype(int)

    # Red Blood Cell Count (RBC) - millions/μL
    rbc_base = np.where(data['sex'] == 'M',
                       np.random.normal(loc=5.0, scale=0.6, size=num_patients),
                       np.random.normal(loc=4.5, scale=0.5, size=num_patients))
    data['rbc_count'] = np.clip(rbc_base, 3.0, 7.0).round(2)

    # --- 4. Medications & Genomics (Kept similar to previous version) ---
    data['index_drug_dose'] = np.random.choice([25, 50, 100, 150, 200, 300, 400, 500], num_patients, p=[0.1, 0.15, 0.2, 0.2, 0.15, 0.1, 0.05, 0.05])
    data['concomitant_drugs_count'] = np.random.randint(1, 25, num_patients)
    data['cyp_inhibitors_flag'] = np.random.choice([0, 1], num_patients, p=[0.7, 0.3])
    data['qt_prolonging_flag'] = np.random.choice([0, 1], num_patients, p=[0.85, 0.15])

    data['cyp2c9'] = np.random.choice(['Wild', 'Intermediate', 'Poor'], num_patients, p=[0.6, 0.3, 0.1])
    data['cyp2d6'] = np.random.choice(['UM', 'EM', 'IM', 'PM'], num_patients, p=[0.05, 0.65, 0.2, 0.1])
    data['hla_risk_allele_flag'] = np.random.choice([0, 1], num_patients, p=[0.95, 0.05])

    # --- 5. Dose History & Context ---
    data['time_since_start_days'] = np.random.randint(10, 365, num_patients)
    data['cumulative_dose_mg'] = data['index_drug_dose'] * data['time_since_start_days'] * np.random.uniform(0.8, 1.2, num_patients)
    data['dose_density_mg_day'] = data['cumulative_dose_mg'] / data['time_since_start_days']
    
    data['indication'] = np.random.choice(['Pain', 'Cancer', 'Autoimmune'], num_patients, p=[0.4, 0.3, 0.3])
    data['inpatient_flag'] = np.random.choice([0, 1], num_patients, p=[0.8, 0.2])
    data['prior_adr_history'] = np.random.choice([0, 1], num_patients, p=[0.9, 0.1])

    # --- 6. Derived Features & Target Variable (Enhanced ADR Risk Logic) ---
    
    # Derived: Polypharmacy (e.g., > 5 concomitant drugs)
    data['polypharmacy_flag'] = (np.array(data['concomitant_drugs_count']) > 5).astype(int)
    
    data_df = pd.DataFrame(data)

    # Target Variable: ADR Outcome (0=No ADR, 1=ADR)
    # The risk score now uses multiplicative factors for compounding risk (more realistic)
    risk_score = (
        # Renal/Hepatic Risk (weighted heavily and based on severity)
        1.0 * data_df['ckd'] * (data_df['creatinine'] / 1.5) +  # CKD + high creatinine
        1.2 * data_df['liver_disease'] * (data_df['ast_alt'] / 100) + # Liver disease + high LFTs
        
        # Drug-Genomic/Drug-Drug Interaction Risk
        0.5 * data_df['qt_prolonging_flag'] * data_df['cardiac_disease'] + 
        0.7 * (data_df['cyp2d6'] == 'PM').astype(int) * (data_df['index_drug_dose'] / 200) + # Poor metabolizer + high dose
        
        # General Risk
        0.3 * data_df['polypharmacy_flag'] + 
        0.01 * data_df['age'] / 80 + 
        
        np.random.normal(0, 0.4, num_patients) # Random noise
    )
    
    # Convert risk score to a probability and then to a binary outcome (ADR)
    probability_adr = 1 / (1 + np.exp(-risk_score))
    data_df['adr_outcome'] = (probability_adr > np.random.rand(num_patients)).astype(int)
    
    # --- 7. New: ADR Type Assignment ---
    
    data_df['adr_type'] = ''
    adr_indices = data_df[data_df['adr_outcome'] == 1].index
    
    # General pool of ADRs
    general_adrs = ['Gastrointestinal (Nausea/Vomiting)', 'Headache/Dizziness', 'Rash', 'Neutropenia', 'Hypoglycemia']

    for i in adr_indices:
        # Check for specific high-risk profiles first
        if data_df.loc[i, 'liver_disease'] == 1 or data_df.loc[i, 'ast_alt'] > 75:
            # Prioritize Hepatotoxicity
            data_df.loc[i, 'adr_type'] = np.random.choice(['Hepatotoxicity', 'Jaundice', 'Gastrointestinal (Nausea/Vomiting)'], p=[0.5, 0.3, 0.2])
        elif data_df.loc[i, 'ckd'] == 1 or data_df.loc[i, 'creatinine'] > 1.8:
            # Prioritize Nephrotoxicity
            data_df.loc[i, 'adr_type'] = np.random.choice(['Nephrotoxicity', 'Electrolyte Imbalance', 'Edema'], p=[0.6, 0.3, 0.1])
        elif data_df.loc[i, 'cardiac_disease'] == 1 or data_df.loc[i, 'qt_prolonging_flag'] == 1:
            # Prioritize Cardiovascular Events
            data_df.loc[i, 'adr_type'] = np.random.choice(['Cardiovascular Event (Arrhythmia)', 'Hypotension', 'Tachycardia'], p=[0.5, 0.3, 0.2])
        elif data_df.loc[i, 'hla_risk_allele_flag'] == 1:
            # Prioritize Hypersensitivity
            data_df.loc[i, 'adr_type'] = np.random.choice(['Severe Cutaneous Reaction', 'Hypersensitivity'], p=[0.7, 0.3])
        else:
            # Assign from general pool
            data_df.loc[i, 'adr_type'] = random.choice(general_adrs)

    # Replace empty strings with 'No ADR' for outcome=0
    data_df.loc[data_df['adr_outcome'] == 0, 'adr_type'] = 'No ADR'
    
    # Time from drug start to ADR (only relevant if ADR occurred)
    time_since_start_for_adr = data_df.loc[adr_indices, 'time_since_start_days'].astype(int)
    
    # Generate random time_to_adr values between 5 and time_since_start
    random_days = [random.randint(5, t) for t in time_since_start_for_adr]
    
    # Initialize the time_to_adr column with NaN
    data_df['time_to_adr_days'] = np.nan
    # Assign the calculated values back to the correct rows
    data_df.loc[adr_indices, 'time_to_adr_days'] = random_days


    df = data_df.copy() # Use the final DataFrame
    
    # Select final columns in order of request
    final_cols = [
        'age', 'sex', 'weight_kg', 'bmi', 'ethnicity',
        'creatinine', 'egfr', 'ast_alt', 'bilirubin', 'albumin',
        'temperature', 'ind_value', 'atpp_value',  # NEW COLUMNS
        'hemoglobin', 'hematocrit', 'wbc_count', 'platelet_count', 'rbc_count',  # CBC COLUMNS
        'diabetes', 'liver_disease', 'ckd', 'cardiac_disease',
        'index_drug_dose', 'concomitant_drugs_count', 'cyp_inhibitors_flag', 'qt_prolonging_flag',
        'cyp2c9', 'cyp2d6', 'hla_risk_allele_flag',
        'cumulative_dose_mg', 'dose_density_mg_day', 'time_since_start_days',
        'bp_systolic', 'bp_diastolic', 'heart_rate',
        'time_to_adr_days', 
        'adr_type', # NEW ADR TYPE COLUMN
        'polypharmacy_flag',
        'indication', 'inpatient_flag', 'prior_adr_history',
        'adr_outcome' # The binary target variable
    ]

    df = df[final_cols].round(2)
    df.to_csv('clinical_data.csv', index=False)
    print(f"Successfully generated {num_patients} synthetic patient records in clinical_data.csv.")
    print(f"ADR Rate: {df['adr_outcome'].mean():.2f}")
    
    return df

if __name__ == '__main__':
    # Generating 10,000 patient records for faster processing
    generate_synthetic_data(num_patients=200000)
