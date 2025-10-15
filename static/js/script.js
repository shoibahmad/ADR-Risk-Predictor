// DOM Elements - will be initialized when DOM is ready
let form, clearButton, resultsContainer, resultsContent, generateReportButton, reportContainer, reportContent, loadingOverlay;

// Global variables
let currentPatientData = {};
let currentPredictionResult = {};
let patientInfo = {};

// Initialize DOM elements
function initializeDOMElements() {
    form = document.getElementById('adr-form');
    clearButton = document.getElementById('clear-form');
    resultsContainer = document.getElementById('results-container');
    resultsContent = document.getElementById('results-content');
    generateReportButton = document.getElementById('generate-report');
    reportContainer = document.getElementById('report-container');
    reportContent = document.getElementById('report-content');
    loadingOverlay = document.getElementById('loading-overlay');
}

// Form submission handler
function setupFormHandler() {
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        showLoading();
        
        // Collect form data
        const formData = new FormData(form);
        const patientData = {};
        
        // Process form data
        for (let [key, value] of formData.entries()) {
            if (value === '') continue;
            
            // Handle checkboxes
            if (['diabetes', 'liver_disease', 'ckd', 'cardiac_disease', 
                 'cyp_inhibitors_flag', 'qt_prolonging_flag', 'hla_risk_allele_flag',
                 'inpatient_flag', 'prior_adr_history'].includes(key)) {
                patientData[key] = 1;
            } else {
                // Convert numeric fields
                if (['age', 'bmi', 'creatinine', 'egfr', 'ast_alt', 'bilirubin', 'albumin',
                     'index_drug_dose', 'concomitant_drugs_count', 'bp_systolic', 
                     'bp_diastolic', 'heart_rate', 'time_since_start_days'].includes(key)) {
                    patientData[key] = parseFloat(value);
                } else {
                    patientData[key] = value;
                }
            }
        }
        
        // Set default values for unchecked checkboxes
        const checkboxFields = ['diabetes', 'liver_disease', 'ckd', 'cardiac_disease', 
                               'cyp_inhibitors_flag', 'qt_prolonging_flag', 'hla_risk_allele_flag',
                               'inpatient_flag', 'prior_adr_history'];
        
        checkboxFields.forEach(field => {
            if (!(field in patientData)) {
                patientData[field] = 0;
            }
        });
        
        // Calculate derived fields
        patientData.polypharmacy_flag = patientData.concomitant_drugs_count > 5 ? 1 : 0;
        patientData.cumulative_dose_mg = patientData.index_drug_dose * patientData.time_since_start_days;
        patientData.dose_density_mg_day = patientData.cumulative_dose_mg / patientData.time_since_start_days;
        
        console.log('Sending patient data:', patientData);
        
        // Store current patient data
        currentPatientData = patientData;
        
        // Make prediction request
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patientData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Prediction result:', result);
        
        // Store current prediction result
        currentPredictionResult = result;
        
        // Display results
        displayResults(result);
        
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to assess ADR risk. Please check your input and try again.');
    } finally {
        hideLoading();
    }
    });
}

// Clear form handler
clearButton.addEventListener('click', () => {
    form.reset();
    resultsContainer.style.display = 'none';
    reportContainer.style.display = 'none';
    currentPatientData = {};
    currentPredictionResult = {};
});

// Generate report handler
generateReportButton.addEventListener('click', async () => {
    try {
        showLoading();
        
        const response = await fetch('/generate_report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                patient_data: currentPatientData,
                prediction_result: currentPredictionResult,
                patient_name: patientInfo.name,
                patient_id: patientInfo.id,
                clinician_name: patientInfo.clinician
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Display formatted report
        displayFormattedReport(result.report);
        reportContainer.style.display = 'block';
        
        // Scroll to report
        reportContainer.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error generating report:', error);
        showError('Failed to generate clinical report. Please try again.');
    } finally {
        hideLoading();
    }
});

// Display results function
function displayResults(result) {
    const riskLevel = result.risk_level.toLowerCase();
    const noAdrProb = result.no_adr_probability;
    const topRisks = result.top_adr_risks;
    
    resultsContent.innerHTML = `
        <div class="risk-summary">
            <div class="risk-card ${riskLevel}">
                <h3>Overall Risk Level</h3>
                <div class="risk-value">${result.risk_level}</div>
                <div class="risk-label">Risk Assessment</div>
            </div>
            <div class="risk-card">
                <h3>No ADR Probability</h3>
                <div class="risk-value">${noAdrProb}%</div>
                <div class="risk-label">Safety Likelihood</div>
            </div>
            <div class="risk-card">
                <h3>Predicted ADR Type</h3>
                <div class="risk-value" style="font-size: 1.2rem; line-height: 1.2;">
                    ${result.predicted_adr_type}
                </div>
                <div class="risk-label">Most Likely Outcome</div>
            </div>
        </div>
        
        <div class="prediction-details">
            <h3><i class="fas fa-info-circle"></i> Assessment Details</h3>
            <div class="prediction-item">
                <span class="prediction-label">Risk Classification:</span>
                <span class="prediction-value ${riskLevel}">${result.risk_level} Risk</span>
            </div>
            <div class="prediction-item">
                <span class="prediction-label">Assessment Time:</span>
                <span class="prediction-value">${new Date(result.timestamp).toLocaleString()}</span>
            </div>
            <div class="prediction-item">
                <span class="prediction-label">Model Confidence:</span>
                <span class="prediction-value">${getRiskDescription(riskLevel)}</span>
            </div>
        </div>
        
        <div class="top-risks">
            <h3><i class="fas fa-exclamation-triangle"></i> Top ADR Risk Probabilities</h3>
            ${Object.entries(topRisks).map(([adrType, probability]) => `
                <div class="risk-item">
                    <span class="risk-name">${adrType}</span>
                    <span class="risk-percentage">${probability}%</span>
                </div>
            `).join('')}
        </div>
    `;
    
    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Get risk description
function getRiskDescription(riskLevel) {
    switch (riskLevel) {
        case 'low':
            return 'Low probability of adverse events';
        case 'medium':
            return 'Moderate monitoring recommended';
        case 'high':
            return 'Enhanced monitoring required';
        default:
            return 'Assessment completed';
    }
}

// Show loading overlay
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Show error message
function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add error styles if not already added
    if (!document.querySelector('#error-styles')) {
        const style = document.createElement('style');
        style.id = 'error-styles';
        style.textContent = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fed7d7;
                color: #c53030;
                padding: 15px 20px;
                border-radius: 10px;
                border-left: 4px solid #e53e3e;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                z-index: 1001;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            
            .error-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .error-content button {
                background: none;
                border: none;
                color: #c53030;
                cursor: pointer;
                padding: 5px;
                margin-left: auto;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// Form validation
function validateForm() {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#e53e3e';
            isValid = false;
        } else {
            field.style.borderColor = '#e2e8f0';
        }
    });
    
    return isValid;
}

// Add form validation on submit
form.addEventListener('submit', (e) => {
    if (!validateForm()) {
        e.preventDefault();
        showError('Please fill in all required fields.');
        return false;
    }
});

// Real-time validation
form.addEventListener('input', (e) => {
    if (e.target.hasAttribute('required') && e.target.value.trim()) {
        e.target.style.borderColor = '#48bb78';
    }
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('ADR Risk Predictor initialized');
    
    // Load patient information from sessionStorage
    loadPatientInfo();
    
    // Check if model is loaded
    fetch('/health')
        .then(response => response.json())
        .then(data => {
            if (!data.model_loaded) {
                showError('Model not loaded. Please ensure the model files are available.');
            }
        })
        .catch(error => {
            console.error('Health check failed:', error);
        });
});

// Load patient information
function loadPatientInfo() {
    const patientName = sessionStorage.getItem('patientName');
    const patientId = sessionStorage.getItem('patientId');
    const clinicianName = sessionStorage.getItem('clinicianName');
    const assessmentStartTime = sessionStorage.getItem('assessmentStartTime');
    
    if (!patientName || !clinicianName) {
        // Show a prompt to enter patient info instead of redirecting
        showPatientInfoPrompt();
        return;
    }
    
    patientInfo = {
        name: patientName,
        id: patientId,
        clinician: clinicianName,
        startTime: assessmentStartTime
    };
    
    // Display patient information
    displayPatientInfo();
}

// Show patient info prompt
function showPatientInfoPrompt() {
    const patientName = prompt('Please enter patient name:');
    const clinicianName = prompt('Please enter clinician name:');
    
    if (patientName && clinicianName) {
        // Store the info
        sessionStorage.setItem('patientName', patientName);
        sessionStorage.setItem('clinicianName', clinicianName);
        sessionStorage.setItem('assessmentStartTime', new Date().toISOString());
        
        patientInfo = {
            name: patientName,
            id: '',
            clinician: clinicianName,
            startTime: new Date().toISOString()
        };
        
        displayPatientInfo();
    } else {
        // Set default values if user cancels
        patientInfo = {
            name: 'Patient',
            id: '',
            clinician: 'Clinician',
            startTime: new Date().toISOString()
        };
        
        sessionStorage.setItem('patientName', 'Patient');
        sessionStorage.setItem('clinicianName', 'Clinician');
        sessionStorage.setItem('assessmentStartTime', new Date().toISOString());
        
        displayPatientInfo();
    }
}

// Display patient information in the header
function displayPatientInfo() {
    const patientInfoBar = document.getElementById('patient-info-bar');
    const displayPatientName = document.getElementById('display-patient-name');
    const displayPatientId = document.getElementById('display-patient-id');
    const displayClinicianName = document.getElementById('display-clinician-name');
    const displayAssessmentTime = document.getElementById('display-assessment-time');
    
    if (patientInfoBar && displayPatientName && displayClinicianName && displayAssessmentTime) {
        displayPatientName.textContent = patientInfo.name;
        displayPatientId.textContent = patientInfo.id || '';
        displayClinicianName.textContent = patientInfo.clinician;
        displayAssessmentTime.textContent = new Date(patientInfo.startTime).toLocaleString();
        
        patientInfoBar.style.display = 'block';
    }
}
// Disp
lay formatted report with better styling
function displayFormattedReport(reportText) {
    const reportContent = document.getElementById('report-content');
    
    // Add patient header to report
    const patientHeader = `
        <div style="border-bottom: 2px solid #667eea; padding-bottom: 15px; margin-bottom: 25px;">
            <h1 style="color: #2d3748; margin: 0 0 10px 0;">ADR Risk Assessment Report</h1>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 0.95rem; color: #4a5568;">
                <div><strong>Patient:</strong> ${patientInfo.name}</div>
                ${patientInfo.id ? `<div><strong>Patient ID:</strong> ${patientInfo.id}</div>` : ''}
                <div><strong>Clinician:</strong> ${patientInfo.clinician}</div>
                <div><strong>Assessment Date:</strong> ${new Date().toLocaleDateString()}</div>
                <div><strong>Assessment Time:</strong> ${new Date().toLocaleTimeString()}</div>
            </div>
        </div>
    `;
    
    // Format the report text
    let formattedReport = reportText
        // Convert markdown-style headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Convert bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert bullet points
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        // Convert numbered lists
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        // Convert line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    // Wrap in paragraphs and handle lists
    formattedReport = '<p>' + formattedReport + '</p>';
    formattedReport = formattedReport.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    formattedReport = formattedReport.replace(/<\/ul><br><ul>/g, '');
    formattedReport = formattedReport.replace(/<p><\/p>/g, '');
    
    reportContent.innerHTML = patientHeader + formattedReport;
}

// Print report functionality
document.addEventListener('DOMContentLoaded', () => {
    const printButton = document.getElementById('print-report');
    const downloadButton = document.getElementById('download-report');
    
    if (printButton) {
        printButton.addEventListener('click', () => {
            const reportContent = document.getElementById('report-content').innerHTML;
            const printWindow = window.open('', '_blank');
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>ADR Risk Assessment Report - ${patientInfo.name}</title>
                    <style>
                        body { 
                            font-family: 'Arial', sans-serif; 
                            line-height: 1.6; 
                            color: #333; 
                            max-width: 800px; 
                            margin: 0 auto; 
                            padding: 20px; 
                        }
                        h1, h2, h3 { color: #2d3748; margin-top: 25px; }
                        h1 { border-bottom: 2px solid #667eea; padding-bottom: 10px; }
                        h2 { color: #667eea; }
                        strong { color: #2d3748; }
                        ul { margin: 15px 0; padding-left: 25px; }
                        li { margin-bottom: 8px; }
                        .header-grid { 
                            display: grid; 
                            grid-template-columns: repeat(2, 1fr); 
                            gap: 15px; 
                            margin-bottom: 25px; 
                        }
                        @media print {
                            body { margin: 0; padding: 15px; }
                            .header-grid { grid-template-columns: 1fr; }
                        }
                    </style>
                </head>
                <body>
                    ${reportContent}
                </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        });
    }
    
    if (downloadButton) {
        downloadButton.addEventListener('click', () => {
            showError('PDF download feature coming soon. Please use the print option for now.');
        });
    }
});

// Enhanced results display with patient info
function displayResults(result) {
    const riskLevel = result.risk_level.toLowerCase();
    const noAdrProb = result.no_adr_probability;
    const topRisks = result.top_adr_risks;
    
    resultsContent.innerHTML = `
        <div class="results-header">
            <h2><i class="fas fa-chart-bar"></i> Risk Assessment Results</h2>
            <div class="results-meta">
                <span class="patient-name-display">
                    <i class="fas fa-user"></i> ${patientInfo.name}
                </span>
                <span>
                    <i class="fas fa-calendar"></i> ${new Date().toLocaleDateString()}
                </span>
            </div>
        </div>
        
        <div class="risk-summary">
            <div class="risk-card ${riskLevel}">
                <h3>Overall Risk Level</h3>
                <div class="risk-value">${result.risk_level}</div>
                <div class="risk-label">Risk Assessment</div>
            </div>
            <div class="risk-card">
                <h3>No ADR Probability</h3>
                <div class="risk-value">${noAdrProb}%</div>
                <div class="risk-label">Safety Likelihood</div>
            </div>
            <div class="risk-card">
                <h3>Predicted ADR Type</h3>
                <div class="risk-value" style="font-size: 1.2rem; line-height: 1.2;">
                    ${result.predicted_adr_type}
                </div>
                <div class="risk-label">Most Likely Outcome</div>
            </div>
        </div>
        
        <div class="prediction-details">
            <h3><i class="fas fa-info-circle"></i> Assessment Details</h3>
            <div class="prediction-item">
                <span class="prediction-label">Patient Name:</span>
                <span class="prediction-value">${patientInfo.name}</span>
            </div>
            <div class="prediction-item">
                <span class="prediction-label">Risk Classification:</span>
                <span class="prediction-value ${riskLevel}">${result.risk_level} Risk</span>
            </div>
            <div class="prediction-item">
                <span class="prediction-label">Assessment Time:</span>
                <span class="prediction-value">${new Date(result.timestamp).toLocaleString()}</span>
            </div>
            <div class="prediction-item">
                <span class="prediction-label">Clinician:</span>
                <span class="prediction-value">${patientInfo.clinician}</span>
            </div>
            <div class="prediction-item">
                <span class="prediction-label">Model Confidence:</span>
                <span class="prediction-value">${getRiskDescription(riskLevel)}</span>
            </div>
        </div>
        
        <div class="top-risks">
            <h3><i class="fas fa-exclamation-triangle"></i> Top ADR Risk Probabilities</h3>
            ${Object.entries(topRisks).map(([adrType, probability]) => `
                <div class="risk-item">
                    <span class="risk-name">${adrType}</span>
                    <span class="risk-percentage">${probability}%</span>
                </div>
            `).join('')}
        </div>
    `;
    
    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}// Sample
 patient data
const samplePatients = {
    'high-risk': {
        name: 'High Risk Patient',
        data: {
            age: 75,
            sex: 'M',
            ethnicity: 'White',
            bmi: 32.5,
            creatinine: 2.1,
            egfr: 35,
            ast_alt: 95,
            bilirubin: 1.8,
            albumin: 2.8,
            diabetes: 1,
            liver_disease: 1,
            ckd: 1,
            cardiac_disease: 1,
            index_drug_dose: 200,
            concomitant_drugs_count: 12,
            indication: 'Cancer',
            cyp2c9: 'Poor',
            cyp2d6: 'PM',
            bp_systolic: 165,
            bp_diastolic: 95,
            heart_rate: 95,
            time_since_start_days: 45,
            cyp_inhibitors_flag: 1,
            qt_prolonging_flag: 1,
            hla_risk_allele_flag: 1,
            inpatient_flag: 1,
            prior_adr_history: 1
        }
    },
    'medium-risk': {
        name: 'Medium Risk Patient',
        data: {
            age: 55,
            sex: 'F',
            ethnicity: 'Asian',
            bmi: 27.2,
            creatinine: 1.3,
            egfr: 65,
            ast_alt: 45,
            bilirubin: 0.8,
            albumin: 3.5,
            diabetes: 1,
            liver_disease: 0,
            ckd: 0,
            cardiac_disease: 1,
            index_drug_dose: 150,
            concomitant_drugs_count: 6,
            indication: 'Pain',
            cyp2c9: 'Intermediate',
            cyp2d6: 'IM',
            bp_systolic: 140,
            bp_diastolic: 85,
            heart_rate: 78,
            time_since_start_days: 30,
            cyp_inhibitors_flag: 0,
            qt_prolonging_flag: 1,
            hla_risk_allele_flag: 0,
            inpatient_flag: 0,
            prior_adr_history: 0
        }
    },
    'low-risk': {
        name: 'Low Risk Patient',
        data: {
            age: 35,
            sex: 'M',
            ethnicity: 'White',
            bmi: 24.1,
            creatinine: 0.9,
            egfr: 95,
            ast_alt: 25,
            bilirubin: 0.5,
            albumin: 4.2,
            diabetes: 0,
            liver_disease: 0,
            ckd: 0,
            cardiac_disease: 0,
            index_drug_dose: 100,
            concomitant_drugs_count: 2,
            indication: 'Pain',
            cyp2c9: 'Wild',
            cyp2d6: 'EM',
            bp_systolic: 120,
            bp_diastolic: 75,
            heart_rate: 68,
            time_since_start_days: 14,
            cyp_inhibitors_flag: 0,
            qt_prolonging_flag: 0,
            hla_risk_allele_flag: 0,
            inpatient_flag: 0,
            prior_adr_history: 0
        }
    },
    'elderly': {
        name: 'Elderly Patient',
        data: {
            age: 82,
            sex: 'F',
            ethnicity: 'Hispanic',
            bmi: 28.8,
            creatinine: 1.6,
            egfr: 45,
            ast_alt: 38,
            bilirubin: 0.9,
            albumin: 3.2,
            diabetes: 1,
            liver_disease: 0,
            ckd: 1,
            cardiac_disease: 1,
            index_drug_dose: 100,
            concomitant_drugs_count: 9,
            indication: 'Autoimmune',
            cyp2c9: 'Intermediate',
            cyp2d6: 'EM',
            bp_systolic: 155,
            bp_diastolic: 88,
            heart_rate: 72,
            time_since_start_days: 60,
            cyp_inhibitors_flag: 1,
            qt_prolonging_flag: 0,
            hla_risk_allele_flag: 0,
            inpatient_flag: 1,
            prior_adr_history: 1
        }
    },
    'young-adult': {
        name: 'Young Adult Patient',
        data: {
            age: 28,
            sex: 'F',
            ethnicity: 'Black',
            bmi: 22.5,
            creatinine: 0.8,
            egfr: 105,
            ast_alt: 22,
            bilirubin: 0.4,
            albumin: 4.5,
            diabetes: 0,
            liver_disease: 0,
            ckd: 0,
            cardiac_disease: 0,
            index_drug_dose: 50,
            concomitant_drugs_count: 1,
            indication: 'Pain',
            cyp2c9: 'Wild',
            cyp2d6: 'EM',
            bp_systolic: 115,
            bp_diastolic: 70,
            heart_rate: 65,
            time_since_start_days: 7,
            cyp_inhibitors_flag: 0,
            qt_prolonging_flag: 0,
            hla_risk_allele_flag: 0,
            inpatient_flag: 0,
            prior_adr_history: 0
        }
    }
};

// Load sample data functionality
document.addEventListener('DOMContentLoaded', () => {
    const loadSampleButton = document.getElementById('load-sample-data');
    const sampleSelector = document.getElementById('sample-data-selector');
    
    if (loadSampleButton && sampleSelector) {
        loadSampleButton.addEventListener('click', () => {
            const selectedSample = sampleSelector.value;
            if (!selectedSample) {
                showError('Please select a sample patient first.');
                return;
            }
            
            loadSampleData(selectedSample);
        });
        
        // Also load when selector changes
        sampleSelector.addEventListener('change', (e) => {
            if (e.target.value) {
                loadSampleData(e.target.value);
            }
        });
    }
});

// Load sample data into form
function loadSampleData(sampleType) {
    const sampleData = samplePatients[sampleType];
    if (!sampleData) {
        showError('Sample data not found.');
        return;
    }
    
    const loadButton = document.getElementById('load-sample-data');
    loadButton.classList.add('loading');
    loadButton.innerHTML = '<i class="fas fa-spinner"></i> Loading...';
    
    // Simulate loading delay for better UX
    setTimeout(() => {
        try {
            // Fill form fields
            Object.entries(sampleData.data).forEach(([key, value]) => {
                const field = document.getElementById(key);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = value === 1;
                    } else {
                        field.value = value;
                    }
                    
                    // Trigger change event for validation
                    field.dispatchEvent(new Event('change'));
                }
            });
            
            // Show success message
            showSuccess(`Sample data loaded: ${sampleData.name}`);
            
            // Scroll to form
            document.getElementById('adr-form').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
        } catch (error) {
            console.error('Error loading sample data:', error);
            showError('Failed to load sample data.');
        } finally {
            loadButton.classList.remove('loading');
            loadButton.innerHTML = '<i class="fas fa-flask"></i> Load Sample Patient Data';
        }
    }, 800);
}

// Show success message
function showSuccess(message) {
    // Create success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add success styles if not already added
    if (!document.querySelector('#success-styles')) {
        const style = document.createElement('style');
        style.id = 'success-styles';
        style.textContent = `
            .success-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #c6f6d5;
                color: #22543d;
                padding: 15px 20px;
                border-radius: 10px;
                border-left: 4px solid #38a169;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                z-index: 1001;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            
            .success-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .success-content button {
                background: none;
                border: none;
                color: #22543d;
                cursor: pointer;
                padding: 5px;
                margin-left: auto;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(successDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 3000);
}