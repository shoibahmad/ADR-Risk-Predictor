// DOM Elements - will be initialized when DOM is ready
let form, clearButton, resultsContainer, resultsContent, generateReportButton, reportContainer, reportContent, loadingOverlay;

// Global variables
let currentPatientData = {};
let currentPredictionResult = {};
let patientInfo = {};

// Generate random patient ID
function generatePatientId() {
    const prefix = 'PT';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${year}${month}${day}${random}`;
}

// Initialize patient info with generated ID
function initializePatientInfo() {
    const patientId = generatePatientId();
    const currentDate = new Date().toLocaleDateString();

    patientInfo = {
        id: patientId,
        name: 'New Patient',
        clinician: 'Healthcare Provider',
        startTime: new Date().toISOString()
    };

    // Update displays
    updatePatientDisplay();

    // Store in session
    sessionStorage.setItem('patientId', patientId);
    sessionStorage.setItem('assessmentStartTime', patientInfo.startTime);
}

// Update patient display elements
function updatePatientDisplay() {
    const patientIdDisplay = document.getElementById('patient-id-display');
    const patientNameDisplay = document.getElementById('patient-name-display');
    const assessmentDateDisplay = document.getElementById('assessment-date-display');

    if (patientIdDisplay) {
        patientIdDisplay.textContent = `ID: ${patientInfo.id}`;
    }

    if (patientNameDisplay) {
        patientNameDisplay.textContent = patientInfo.name;
    }

    if (assessmentDateDisplay) {
        assessmentDateDisplay.textContent = new Date().toLocaleDateString();
    }
}

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

    // Setup BMI calculation
    setupBMICalculation();
}

// Mobile Navigation Functions
function initializeMobileNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const menuItems = document.querySelectorAll('.menu-item');

    // Function to open sidebar
    function openSidebar() {
        if (sidebar) {
            sidebar.classList.add('active');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Function to close sidebar
    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove('active');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Toggle sidebar
    if (navToggle && sidebar) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar.classList.contains('active')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    // Close sidebar with close button
    if (sidebarClose) {
        sidebarClose.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSidebar();
        });
    }

    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Menu item navigation
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding section
            const section = item.dataset.section;
            showSection(section);

            // Close sidebar on mobile
            if (window.innerWidth < 768) {
                closeSidebar();
            }
        });
    });

    // Close sidebar when clicking outside (backup)
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 768 &&
            sidebar && sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            navToggle && !navToggle.contains(e.target)) {
            closeSidebar();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
}

// Show specific section
function showSection(sectionName) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Form Progress Tracking
function updateFormProgress() {
    const sections = ['demographics', 'laboratory', 'comorbidities', 'medication', 'pharmacogenomics', 'clinical'];

    sections.forEach(section => {
        const isComplete = checkSectionCompletion(section);
        const progressCircle = document.querySelector(`[data-section="${section}"]`);

        if (progressCircle) {
            if (isComplete) {
                progressCircle.classList.add('completed');
            } else {
                progressCircle.classList.remove('completed');
            }
        }
    });
}

// BMI Calculation Function
function calculateBMI() {
    const heightField = document.getElementById('height');
    const weightField = document.getElementById('weight');
    const bmiField = document.getElementById('bmi');
    const bmiValueDisplay = document.getElementById('bmi-value');
    const bmiCategoryDisplay = document.getElementById('bmi-category');

    if (!heightField || !weightField || !bmiField) {
        console.warn('BMI calculation fields not found');
        return;
    }

    const height = parseFloat(heightField.value);
    const weight = parseFloat(weightField.value);

    if (height && weight && height > 0) {
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);

        bmiField.value = bmi.toFixed(1);

        // Update BMI category and display
        let category = '';
        let categoryClass = '';

        if (bmi < 18.5) {
            category = 'Underweight';
            categoryClass = 'underweight';
        } else if (bmi < 25) {
            category = 'Normal Weight';
            categoryClass = 'normal';
        } else if (bmi < 30) {
            category = 'Overweight';
            categoryClass = 'overweight';
        } else {
            category = 'Obese';
            categoryClass = 'obese';
        }

        // Update displays
        if (bmiValueDisplay) {
            bmiValueDisplay.textContent = bmi.toFixed(1);
        }

        if (bmiCategoryDisplay) {
            bmiCategoryDisplay.textContent = category;
            bmiCategoryDisplay.className = `bmi-category ${categoryClass}`;
        }

    } else {
        bmiField.value = '';
        if (bmiValueDisplay) {
            bmiValueDisplay.textContent = '--';
        }
        if (bmiCategoryDisplay) {
            bmiCategoryDisplay.textContent = 'Enter height & weight';
            bmiCategoryDisplay.className = 'bmi-category';
        }
    }
}

// Update BMI visual display
function updateBMIDisplay(bmi, category, categoryClass) {
    const bmiDisplay = document.querySelector('.bmi-display');
    if (!bmiDisplay) return;

    const bmiNumber = bmiDisplay.querySelector('.bmi-number');
    const bmiCategoryElement = bmiDisplay.querySelector('.bmi-category');
    const bmiProgressFill = bmiDisplay.querySelector('.bmi-progress-fill');
    const healthIcon = bmiDisplay.querySelector('.health-icon');
    const healthText = bmiDisplay.querySelector('.health-text');

    if (bmiNumber) bmiNumber.textContent = bmi.toFixed(1);
    if (bmiCategoryElement) {
        bmiCategoryElement.textContent = category;
        bmiCategoryElement.className = `bmi-category ${categoryClass}`;
    }

    // Update progress bar
    if (bmiProgressFill) {
        let progressWidth = 0;
        if (bmi < 18.5) progressWidth = (bmi / 18.5) * 25;
        else if (bmi < 25) progressWidth = 25 + ((bmi - 18.5) / 6.5) * 25;
        else if (bmi < 30) progressWidth = 50 + ((bmi - 25) / 5) * 25;
        else prog
        // Setup BMI Calculation
        function setupBMICalculation() {
            const heightField = document.getElementById('height');
            const weightField = document.getElementById('weight');

            if (heightField && weightField) {
                heightField.addEventListener('input', calculateBMI);
                weightField.addEventListener('input', calculateBMI);
            }
        }

        // Check if a form section is complete
        function checkSectionCompletion(section) {
            switch (section) {
                case 'demographics':
                    return document.getElementById('age').value &&
                        document.getElementById('sex').value &&
                        document.getElementById('ethnicity').value &&
                        document.getElementById('height').value &&
                        document.getElementById('weight').value &&
                        document.getElementById('bmi').value;

                case 'laboratory':
                    return document.getElementById('creatinine').value &&
                        document.getElementById('egfr').value &&
                        document.getElementById('ast_alt').value &&
                        document.getElementById('bilirubin').value &&
                        document.getElementById('albumin').value;

                case 'comorbidities':
                    return true; // Comorbidities are optional

                case 'medication':
                    return document.getElementById('medication_name').value &&
                        document.getElementById('index_drug_dose').value &&
                        document.getElementById('concomitant_drugs_count').value &&
                        document.getElementById('drug_interactions').value &&
                        document.getElementById('indication').value;

                case 'pharmacogenomics':
                    return document.getElementById('cyp2c9').value &&
                        document.getElementById('cyp2d6').value;

                case 'clinical':
                    return document.getElementById('bp_systolic').value &&
                        document.getElementById('bp_diastolic').value &&
                        document.getElementById('heart_rate').value &&
                        document.getElementById('time_since_start_days').value;

                default:
                    return false;
            }
        }

        // Quick Actions
        function initializeQuickActions() {
            const loadSampleBtn = document.getElementById('load-sample-data');
            const clearFormBtn = document.getElementById('clear-form');
            const voiceInputBtn = document.getElementById('voice-input');
            const sampleSelector = document.getElementById('sample-data-selector');
            const sampleContainer = document.getElementById('sample-selector-container');

            // Load sample data
            if (loadSampleBtn) {
                loadSampleBtn.addEventListener('click', () => {
                    if (sampleContainer.style.display === 'none' || !sampleContainer.style.display) {
                        sampleContainer.style.display = 'block';
                    } else {
                        sampleContainer.style.display = 'none';
                    }
                });
            }

            // Sample selector change
            if (sampleSelector) {
                sampleSelector.addEventListener('change', (e) => {
                    if (e.target.value) {
                        loadSampleData(e.target.value);
                        sampleContainer.style.display = 'none';
                    }
                });
            }

            // Clear form
            if (clearFormBtn) {
                clearFormBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to clear all form data?')) {
                        form.reset();
                        updateFormProgress();
                        showSuccess('Form cleared successfully');
                    }
                });
            }

            // Voice input (placeholder)
            if (voiceInputBtn) {
                voiceInputBtn.addEventListener('click', () => {
                    showInfo('Voice input feature coming soon!');
                });
            }
        }

        // Enhanced form validation with visual feedback
        function validateFormWithFeedback() {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            let firstInvalidField = null;

            requiredFields.forEach(field => {
                const inputGroup = field.closest('.input-group');

                if (!field.value.trim()) {
                    field.style.borderColor = 'var(--medical-danger)';
                    field.style.backgroundColor = 'rgba(220, 38, 38, 0.05)';

                    if (inputGroup) {
                        inputGroup.classList.add('error');
                    }

                    if (!firstInvalidField) {
                        firstInvalidField = field;
                    }

                    isValid = false;
                } else {
                    field.style.borderColor = 'var(--medical-success)';
                    field.style.backgroundColor = 'rgba(5, 150, 105, 0.05)';

                    if (inputGroup) {
                        inputGroup.classList.remove('error');
                    }
                }
            });

            // Scroll to first invalid field
            if (firstInvalidField) {
                firstInvalidField.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                firstInvalidField.focus();
            }

            return isValid;
        }

        // Form submission handler
        function setupFormHandler() {
            if (!form) {
                console.error('Form element not found!');
                return;
            }

            console.log('Form handler setup successfully');

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('Form submitted!');

                // Basic validation
                const requiredFields = [
                    'age', 'sex', 'ethnicity', 'height', 'weight', 'bmi',
                    'creatinine', 'egfr', 'ast_alt', 'bilirubin', 'albumin',
                    'medication_name', 'index_drug_dose', 'concomitant_drugs_count', 'drug_interactions', 'indication',
                    'cyp2c9', 'cyp2d6',
                    'bp_systolic', 'bp_diastolic', 'heart_rate', 'time_since_start_days'
                ];
                const missingFields = [];

                for (const field of requiredFields) {
                    const element = document.getElementById(field);
                    if (!element || !element.value.trim()) {
                        missingFields.push(field.replace(/_/g, ' '));
                    }
                }

                if (missingFields.length > 0) {
                    showError(`Please complete the following required fields: ${missingFields.join(', ')}`);
                    return;
                }

                try {
                    showLoading();

                    // Collect form data
                    const formData = new FormData(form);
                    const patientData = {};

                    // Process form data
                    for (let [key, value] of formData.entries()) {
                        if (value === '') continue;

                        // Handle checkboxes
                        if (['diabetes', 'liver_disease', 'ckd', 'cardiac_disease', 'hypertension',
                            'respiratory_disease', 'neurological_disease', 'autoimmune_disease',
                            'cyp_inhibitors_flag', 'qt_prolonging_flag', 'hla_risk_allele_flag',
                            'inpatient_flag', 'prior_adr_history'].includes(key)) {
                            patientData[key] = 1;
                        } else {
                            // Convert numeric fields
                            if (['age', 'height', 'weight', 'bmi', 'creatinine', 'egfr', 'ast_alt', 'bilirubin', 'albumin',
                                'index_drug_dose', 'concomitant_drugs_count', 'bp_systolic',
                                'bp_diastolic', 'heart_rate', 'time_since_start_days'].includes(key)) {
                                patientData[key] = parseFloat(value);
                            } else {
                                patientData[key] = value;
                            }
                        }
                    }

                    // Set default values for unchecked checkboxes
                    const checkboxFields = ['diabetes', 'liver_disease', 'ckd', 'cardiac_disease', 'hypertension',
                        'respiratory_disease', 'neurological_disease', 'autoimmune_disease',
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
                        const errorText = await response.text();
                        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                    }

                    const result = await response.json();
                    console.log('Prediction result:', result);

                    // Store current prediction result
                    currentPredictionResult = result;

                    // Display results
                    displayResults(result);

                    // Switch to results section
                    showSection('results');

                    // Show success message
                    showSuccess('ADR risk assessment completed successfully!');

                } catch (error) {
                    console.error('Error:', error);
                    showError(`Failed to assess ADR risk: ${error.message}`);
                } finally {
                    hideLoading();
                }
            });
        }

        // Clear form handler
        function setupClearHandler() {
            if (!clearButton) return;

            clearButton.addEventListener('click', () => {
                form.reset();
                resultsContainer.style.display = 'none';
                reportContainer.style.display = 'none';
                currentPatientData = {};
                currentPredictionResult = {};
            });
        }

        // Generate report handler
        function setupReportHandler() {
            if (!generateReportButton) return;

            generateReportButton.addEventListener('click', async () => {
                await generateClinicalReport();
            });
        }

        // Generate clinical report function
        async function generateClinicalReport() {
            try {
                console.log('=== Starting clinical report generation ===');
                showLoading();

                // Show loading in report section
                showReportLoading();

                // Ensure we have the required data
                if (!currentPatientData || !currentPredictionResult) {
                    console.error('Missing data:', {
                        hasPatientData: !!currentPatientData,
                        hasPredictionResult: !!currentPredictionResult
                    });
                    throw new Error('Missing patient data or prediction results');
                }

                const requestData = {
                    patient_data: currentPatientData,
                    prediction_result: currentPredictionResult,
                    patient_name: patientInfo.name || 'Patient',
                    patient_id: patientInfo.id || '',
                    clinician_name: patientInfo.clinician || 'Clinician'
                };

                console.log('Sending report request with data:', requestData);

                const response = await fetch('/generate_report', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });

                console.log('Response status:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server error response:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const result = await response.json();
                console.log('Report generated successfully, AI generated:', result.ai_generated);
                console.log('Report length:', result.report ? result.report.length : 0);

                // Display formatted report
                displayFormattedReport(result.report);

                // Show success message
                showSuccess(`Clinical report generated successfully! ${result.ai_generated ? '(AI-powered)' : '(Fallback)'}`)

            } catch (error) {
                console.error('Error generating report:', error);
                showError(`Failed to generate clinical report: ${error.message}`);

                // Show fallback message in report area
                if (reportContent) {
                    reportContent.innerHTML = `
                <div class="report-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Report Generation Failed</h4>
                    <p>Unable to generate clinical report: ${error.message}</p>
                    <button onclick="generateClinicalReport()" class="btn btn-secondary">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
                }
            } finally {
                hideLoading();
            }
        }

        // This function is replaced by the enhanced version below

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
            if (loadingOverlay) {
                loadingOverlay.style.display = 'flex';
            } else {
                console.log('Loading...');
            }
        }

        // Hide loading overlay
        function hideLoading() {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
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
                color: #2f855a;
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
                color: #2f855a;
                cursor: pointer;
                padding: 5px;
                margin-left: auto;
            }
        `;
                document.head.appendChild(style);
            }

            document.body.appendChild(successDiv);

            // Auto remove after 4 seconds
            setTimeout(() => {
                if (successDiv.parentElement) {
                    successDiv.remove();
                }
            }, 4000);
        }

        // Show report loading state
        function showReportLoading() {
            const reportContent = document.getElementById('report-content');
            const reportContainer = document.getElementById('report-container');

            if (reportContent && reportContainer) {
                reportContainer.style.display = 'block';
                reportContent.innerHTML = `
            <div class="report-loading">
                <div class="loading-spinner"></div>
                <h3>Generating Clinical Report...</h3>
                <p>AI is analyzing patient data and generating comprehensive clinical recommendations.</p>
            </div>
        `;

                // Add loading styles if not already added
                if (!document.querySelector('#report-loading-styles')) {
                    const style = document.createElement('style');
                    style.id = 'report-loading-styles';
                    style.textContent = `
                .report-loading {
                    text-align: center;
                    padding: 60px 20px;
                    color: #4a5568;
                }
                
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid #e2e8f0;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .report-loading h3 {
                    margin-bottom: 10px;
                    color: #2d3748;
                }
                
                .report-loading p {
                    font-size: 0.9rem;
                    opacity: 0.8;
                }
            `;
                    document.head.appendChild(style);
                }
            }
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

        // Setup form validation
        function setupFormValidation() {
            if (!form) return;

            // Real-time validation
            form.addEventListener('input', (e) => {
                if (e.target.hasAttribute('required') && e.target.value.trim()) {
                    e.target.style.borderColor = '#48bb78';
                }
            });
        }

        // Initialize page
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🏥 Medical ADR Risk Predictor initialized');

            // Initialize assessment page
            initializeAssessmentPage();

            // Initialize DOM elements
            initializeDOMElements();

            // Initialize mobile navigation
            initializeMobileNavigation();

            // Initialize quick actions
            initializeQuickActions();

            // Setup event handlers
            setupFormHandler();
            setupReportHandler();
            setupSampleDataHandlers();
            setupFormValidation();
            setupPrintHandlers();

            // Show patient header
            const patientHeader = document.getElementById('patient-header-card');
            if (patientHeader) {
                patientHeader.style.display = 'flex';
            }

            // Add form input listeners for progress tracking
            const formInputs = form.querySelectorAll('input, select');
            formInputs.forEach(input => {
                input.addEventListener('input', updateFormProgress);
                input.addEventListener('change', updateFormProgress);
            });

            // Check if model is loaded (silently)
            fetch('/health')
                .then(response => response.json())
                .then(data => {
                    if (data.model_loaded) {
                        console.log('✅ Medical AI system ready');
                    } else {
                        console.warn('⚠️ Model not loaded');
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
        // lay formatted report with better styling
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

        // Setup print report functionality
        function setupPrintHandlers() {
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
        }

        // Enhanced results display with patient info
        function displayResults(result) {
            console.log('Displaying results:', result);

            if (!resultsContent || !resultsContainer) {
                console.error('Results container elements not found');
                showError('Unable to display results. Please refresh the page.');
                return;
            }

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
        
        ${result.top_specific_adr_risks ? `
        <div class="specific-adr-risks">
            <h3><i class="fas fa-medical-kit"></i> Specific ADR Type Risks</h3>
            <div class="adr-types-grid">
                ${Object.entries(result.top_specific_adr_risks).map(([adrType, probability]) => {
                const riskCategory = probability > 15 ? 'high' : probability > 5 ? 'medium' : 'low';
                return `
                        <div class="adr-type-card ${riskCategory}">
                            <div class="adr-type-name">${adrType}</div>
                            <div class="adr-type-probability">${probability}%</div>
                            <div class="adr-type-category">${riskCategory.charAt(0).toUpperCase() + riskCategory.slice(1)} Risk</div>
                        </div>
                    `;
            }).join('')}
            </div>
            ${Object.keys(result.all_adr_types || {}).length > 3 ? `
                <div class="additional-adr-info">
                    <i class="fas fa-info-circle"></i>
                    ${Object.keys(result.all_adr_types).length - 3} additional ADR types monitored with lower probabilities
                </div>
            ` : ''}
        </div>
        ` : ''}
    `;

            resultsContainer.style.display = 'block';
            resultsContainer.scrollIntoView({ behavior: 'smooth' });

            // Show loading state in report section
            showReportLoading();

            // Auto-generate report after a short delay
            setTimeout(() => {
                generateClinicalReport();
            }, 1500);
        }// Sample patient data
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

        // Setup sample data handlers
        function setupSampleDataHandlers() {
            const loadSampleButton = document.getElementById('load-sample-data');
            const sampleSelector = document.getElementById('sample-data-selector');

            if (loadSampleButton && sampleSelector) {
                loadSampleButton.addEventListener('click', () => {
                    const selectedSample = sampleSelector.value;
                    if (!selectedSample) {
                        // Load default high-risk sample if none selected
                        loadSampleData('high-risk');
                        sampleSelector.value = 'high-risk';
                    } else {
                        loadSampleData(selectedSample);
                    }
                });

                // Also load when selector changes
                sampleSelector.addEventListener('change', (e) => {
                    if (e.target.value) {
                        loadSampleData(e.target.value);
                    }
                });
            }
        }

        // Load sample data into form
        function loadSampleData(sampleType) {
            const sampleData = samplePatients[sampleType];
            if (!sampleData) {
                showError('Sample data not found.');
                return;
            }

            const loadButton = document.getElementById('load-sample-data');
            if (loadButton) {
                loadButton.classList.add('loading');
                loadButton.innerHTML = '<i class="fas fa-spinner"></i> Loading...';
            }

            try {
                // Fill form fields immediately
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

                        // Add visual feedback
                        field.style.borderColor = '#48bb78';
                        field.style.backgroundColor = '#f0fff4';

                        // Reset styling after a moment
                        setTimeout(() => {
                            field.style.borderColor = '';
                            field.style.backgroundColor = '';
                        }, 1000);
                    }
                });

                // Show success message
                showSuccess(`Sample data loaded: ${sampleData.name}`);

                // Scroll to form
                const formElement = document.getElementById('adr-form');
                if (formElement) {
                    formElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }

            } catch (error) {
                console.error('Error loading sample data:', error);
                showError('Failed to load sample data.');
            } finally {
                if (loadButton) {
                    setTimeout(() => {
                        loadButton.classList.remove('loading');
                        loadButton.innerHTML = '<i class="fas fa-flask"></i> Load Sample Patient Data';
                    }, 500);
                }
            }
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
        // Show loading state in report section
        function showReportLoading() {
            if (reportContent) {
                reportContent.innerHTML = `
            <div class="report-loading">
                <i class="fas fa-spinner"></i>
                <p>Generating AI clinical report...</p>
                <p class="report-hint">This may take a few moments</p>
            </div>
        `;
            }
        }

        // Enhanced report display with better formatting
        function displayFormattedReport(reportText) {
            if (!reportContent) {
                console.error('Report content element not found');
                return;
            }

            // Add patient header to report
            const patientHeader = `
        <div class="report-patient-header">
            <h4>Patient Information</h4>
            <div class="patient-info-grid">
                <div><strong>Patient:</strong> ${patientInfo.name || 'N/A'}</div>
                ${patientInfo.id ? `<div><strong>ID:</strong> ${patientInfo.id}</div>` : ''}
                <div><strong>Clinician:</strong> ${patientInfo.clinician || 'N/A'}</div>
                <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
                <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
            </div>
        </div>
    `;

            // Format the report text with better styling
            let formattedReport = reportText
                // Convert markdown-style headers
                .replace(/^### (.*$)/gm, '<h4 class="report-h4">$1</h4>')
                .replace(/^## (.*$)/gm, '<h3 class="report-h3">$1</h3>')
                .replace(/^# (.*$)/gm, '<h2 class="report-h2">$1</h2>')
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
            formattedReport = '<div class="report-body"><p>' + formattedReport + '</p></div>';
            formattedReport = formattedReport.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
            formattedReport = formattedReport.replace(/<\/ul><br><ul>/g, '');
            formattedReport = formattedReport.replace(/<p><\/p>/g, '');

            // Display the formatted report
            reportContent.innerHTML = patientHeader + formattedReport;

            // Add success styling
            reportContent.parentElement.classList.add('report-success');

            // Show report actions
            const reportActions = document.querySelector('.report-actions');
            if (reportActions) {
                reportActions.style.display = 'flex';
            }
        }

        // Add additional CSS for report formatting
        function addReportStyles() {
            if (!document.querySelector('#report-styles')) {
                const style = document.createElement('style');
                style.id = 'report-styles';
                style.textContent = `
            .report-patient-header {
                background: #f7fafc;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 25px;
                border-left: 4px solid #667eea;
            }
            
            .report-patient-header h4 {
                color: #2d3748;
                margin: 0 0 15px 0;
                font-size: 1.1rem;
            }
            
            .patient-info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                font-size: 0.9rem;
                color: #4a5568;
            }
            
            .report-body {
                line-height: 1.7;
                color: #2d3748;
            }
            
            .report-h2 {
                color: #2d3748;
                font-size: 1.3rem;
                margin: 25px 0 15px 0;
                padding-bottom: 8px;
                border-bottom: 2px solid #667eea;
            }
            
            .report-h3 {
                color: #667eea;
                font-size: 1.1rem;
                margin: 20px 0 12px 0;
            }
            
            .report-h4 {
                color: #4a5568;
                font-size: 1rem;
                margin: 15px 0 10px 0;
                font-weight: 600;
            }
            
            .report-body ul {
                margin: 15px 0;
                padding-left: 25px;
            }
            
            .report-body li {
                margin-bottom: 8px;
                color: #4a5568;
            }
            
            .report-body strong {
                color: #2d3748;
                font-weight: 600;
            }
            
            .report-body p {
                margin-bottom: 15px;
            }
        `;
                document.head.appendChild(style);
            }
        }
        // ===
        // == MOBILE RESPONSIVE ENHANCEMENTS =====

        // Add mobile-specific optimizations
        function addMobileOptimizations() {
            // Detect mobile device
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            if (isMobile || isTouch) {
                document.body.classList.add('mobile-device');

                // Add touch-friendly interactions
                addTouchOptimizations();

                // Optimize form interactions for mobile
                optimizeFormForMobile();

                // Add mobile-specific event listeners
                addMobileEventListeners();
            }

            // Handle orientation changes
            window.addEventListener('orientationchange', handleOrientationChange);
            window.addEventListener('resize', debounce(handleResize, 250));
        }

        // Add touch-friendly optimizations
        function addTouchOptimizations() {
            // Add touch feedback to buttons
            const buttons = document.querySelectorAll('.btn, .risk-item, .adr-type-card');
            buttons.forEach(button => {
                button.addEventListener('touchstart', function () {
                    this.style.transform = 'scale(0.98)';
                });

                button.addEventListener('touchend', function () {
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 150);
                });
            });

            // Prevent double-tap zoom on buttons
            const clickableElements = document.querySelectorAll('.btn, button, .checkbox-group');
            clickableElements.forEach(element => {
                element.addEventListener('touchend', function (e) {
                    e.preventDefault();
                    this.click();
                });
            });
        }

        // Optimize form for mobile
        function optimizeFormForMobile() {
            // Auto-focus prevention on mobile (prevents keyboard popup)
            const inputs = document.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('focus', function () {
                    // Scroll element into view on mobile
                    if (window.innerWidth <= 768) {
                        setTimeout(() => {
                            this.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center'
                            });
                        }, 300);
                    }
                });

                // Add input validation feedback
                input.addEventListener('blur', function () {
                    if (this.hasAttribute('required') && !this.value.trim()) {
                        this.classList.add('error');
                    } else {
                        this.classList.remove('error');
                    }
                });
            });

            // Optimize select dropdowns for mobile
            const selects = document.querySelectorAll('select');
            selects.forEach(select => {
                if (window.innerWidth <= 768) {
                    select.setAttribute('size', '1');
                }
            });
        }

        // Add mobile-specific event listeners
        function addMobileEventListeners() {
            // Handle swipe gestures for results sections
            let startX, startY, distX, distY;
            const threshold = 100;

            const swipeableElements = document.querySelectorAll('.results-container, .report-container');
            swipeableElements.forEach(element => {
                element.addEventListener('touchstart', function (e) {
                    const touch = e.touches[0];
                    startX = touch.clientX;
                    startY = touch.clientY;
                });

                element.addEventListener('touchmove', function (e) {
                    if (!startX || !startY) return;

                    const touch = e.touches[0];
                    distX = touch.clientX - startX;
                    distY = touch.clientY - startY;
                });

                element.addEventListener('touchend', function (e) {
                    if (!startX || !startY) return;

                    // Horizontal swipe detection
                    if (Math.abs(distX) > Math.abs(distY) && Math.abs(distX) > threshold) {
                        if (distX > 0) {
                            // Swipe right - could trigger previous section
                            console.log('Swipe right detected');
                        } else {
                            // Swipe left - could trigger next section
                            console.log('Swipe left detected');
                        }
                    }

                    // Reset values
                    startX = startY = distX = distY = null;
                });
            });

            // Add pull-to-refresh functionality (optional)
            let startY_refresh = 0;
            document.addEventListener('touchstart', function (e) {
                startY_refresh = e.touches[0].clientY;
            });

            document.addEventListener('touchmove', function (e) {
                const currentY = e.touches[0].clientY;
                const pullDistance = currentY - startY_refresh;

                // If at top of page and pulling down
                if (window.scrollY === 0 && pullDistance > 100) {
                    // Could add pull-to-refresh indicator here
                    console.log('Pull to refresh detected');
                }
            });
        }

        // Handle orientation changes
        function handleOrientationChange() {
            // Delay to allow for orientation change to complete
            setTimeout(() => {
                // Recalculate layout if needed
                const activeElement = document.activeElement;
                if (activeElement && activeElement.tagName === 'INPUT') {
                    activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                // Adjust grid layouts for landscape/portrait
                adjustLayoutForOrientation();
            }, 500);
        }

        // Handle window resize
        function handleResize() {
            // Adjust layouts based on new window size
            adjustLayoutForOrientation();

            // Update any dynamic calculations
            updateDynamicSizing();
        }

        // Adjust layout for current orientation
        function adjustLayoutForOrientation() {
            const isLandscape = window.innerWidth > window.innerHeight;
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                if (isLandscape) {
                    document.body.classList.add('landscape-mobile');
                    document.body.classList.remove('portrait-mobile');
                } else {
                    document.body.classList.add('portrait-mobile');
                    document.body.classList.remove('landscape-mobile');
                }
            } else {
                document.body.classList.remove('landscape-mobile', 'portrait-mobile');
            }
        }

        // Update dynamic sizing
        function updateDynamicSizing() {
            // Update any elements that need dynamic sizing
            const riskCards = document.querySelectorAll('.risk-card');
            riskCards.forEach(card => {
                // Ensure consistent height on mobile
                if (window.innerWidth <= 768) {
                    card.style.minHeight = 'auto';
                }
            });
        }

        // Debounce function for performance
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Enhanced error handling for mobile
        function showMobileError(message) {
            // Use native mobile alerts for critical errors
            if (window.innerWidth <= 480) {
                alert(message);
            } else {
                showError(message);
            }
        }

        // Enhanced success handling for mobile
        function showMobileSuccess(message) {
            // Show success with haptic feedback if available
            if ('vibrate' in navigator) {
                navigator.vibrate(200);
            }
            showSuccess(message);
        }

        // Add mobile-specific styles dynamically
        function addMobileStyles() {
            const style = document.createElement('style');
            style.id = 'mobile-dynamic-styles';
            style.textContent = `
        .mobile-device .form-group input:focus,
        .mobile-device .form-group select:focus {
            transform: scale(1.02);
            transition: transform 0.2s ease;
        }
        
        .mobile-device .btn:active {
            transform: scale(0.98);
        }
        
        .mobile-device .risk-item:active,
        .mobile-device .adr-type-card:active {
            transform: scale(0.98);
            transition: transform 0.1s ease;
        }
        
        .mobile-device input.error {
            border-color: #e53e3e;
            background-color: #fed7d7;
            animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        /* Landscape mobile optimizations */
        .landscape-mobile .form-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .landscape-mobile .checkbox-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .landscape-mobile .risk-summary {
            grid-template-columns: repeat(3, 1fr);
        }
        
        /* Portrait mobile optimizations */
        .portrait-mobile .form-actions {
            position: sticky;
            bottom: 10px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.1);
        }
    `;
            document.head.appendChild(style);
        }

        // Initialize mobile optimizations when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            addMobileOptimizations();
            addMobileStyles();
        });

        // Add viewport height fix for mobile browsers
        function fixMobileViewportHeight() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }

        // Update viewport height on resize
        window.addEventListener('resize', fixMobileViewportHeight);
        fixMobileViewportHeight();// 
        // Display Results Function
        function displayResults(result) {
            console.log('Displaying results:', result);

            const resultsContainer = document.getElementById('results-container');
            const resultsContent = document.getElementById('results-content');

            if (!resultsContainer || !resultsContent) {
                console.error('Results container elements not found');
                showError('Unable to display results. Please refresh the page.');
                return;
            }

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
        
        ${result.top_specific_adr_risks ? `
        <div class="specific-adr-risks">
            <h3><i class="fas fa-medical-kit"></i> Specific ADR Type Risks</h3>
            <div class="adr-types-grid">
                ${Object.entries(result.top_specific_adr_risks).map(([adrType, probability]) => {
                const riskCategory = probability > 15 ? 'high' : probability > 5 ? 'medium' : 'low';
                return `
                        <div class="adr-type-card ${riskCategory}">
                            <div class="adr-type-name">${adrType}</div>
                            <div class="adr-type-probability">${probability}%</div>
                            <div class="adr-type-category">${riskCategory.charAt(0).toUpperCase() + riskCategory.slice(1)} Risk</div>
                        </div>
                    `;
            }).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="enhanced-features">
            <div class="feature-buttons">
                <button onclick="showRiskFactorAnalysis()" class="btn btn-feature">
                    <i class="fas fa-chart-pie"></i> Risk Analysis
                </button>
                <button onclick="checkDrugInteractions()" class="btn btn-feature">
                    <i class="fas fa-pills"></i> Drug Interactions
                </button>
                <button onclick="showRiskTrendAnalysis()" class="btn btn-feature">
                    <i class="fas fa-chart-line"></i> Trend Analysis
                </button>
                <button onclick="generateClinicalReport()" class="btn btn-feature">
                    <i class="fas fa-file-medical-alt"></i> Generate Report
                </button>
            </div>
        </div>
    `;

            resultsContainer.style.display = 'block';

            // Save assessment for trend analysis
            saveCurrentAssessment();

            // Auto-generate report
            setTimeout(() => {
                generateClinicalReport();
            }, 1500);
        }

        // Generate Clinical Report Function
        function generateClinicalReport() {
            if (!currentPatientData || !currentPredictionResult) {
                showError('Please complete a patient assessment first');
                return;
            }

            showLoading();

            const requestData = {
                patient_data: currentPatientData,
                prediction_result: currentPredictionResult,
                patient_name: patientInfo.name || 'Patient',
                patient_id: patientInfo.id || '',
                clinician_name: patientInfo.clinician || 'Clinician'
            };

            fetch('/generate_report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            })
                .then(response => response.json())
                .then(data => {
                    displayFormattedReport(data.report);
                    showSection('reports');
                    showSuccess('Clinical report generated successfully!');
                })
                .catch(error => {
                    console.error('Error generating report:', error);
                    showError('Failed to generate clinical report');
                })
                .finally(() => {
                    hideLoading();
                });
        }

        // Display Formatted Report
        function displayFormattedReport(reportText) {
            const reportContent = document.getElementById('report-content');
            if (!reportContent) return;

            // Add patient header to report
            const patientHeader = `
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px;">
            <h1 style="color: #1e293b; margin: 0 0 10px 0;">ADR Risk Assessment Report</h1>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 0.95rem; color: #475569;">
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
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/^- (.*$)/gm, '<li>$1</li>')
                .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');

            formattedReport = '<p>' + formattedReport + '</p>';
            formattedReport = formattedReport.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
            formattedReport = formattedReport.replace(/<\/ul><br><ul>/g, '');
            formattedReport = formattedReport.replace(/<p><\/p>/g, '');

            reportContent.innerHTML = patientHeader + formattedReport;

            // Show report actions
            const reportActions = document.querySelector('.report-actions');
            if (reportActions) {
                reportActions.style.display = 'flex';
            }
        }// 
        // Save Assessment for Trend Analysis
        function saveCurrentAssessment() {
            if (!currentPatientData || !currentPredictionResult) {
                console.log('No assessment data to save');
                return; // Silently fail if no data
            }

            const assessmentData = {
                patient_id: patientInfo.id || patientInfo.name,
                patient_name: patientInfo.name,
                clinician_name: patientInfo.clinician,
                patient_data: currentPatientData,
                prediction_result: currentPredictionResult
            };

            fetch('/save_assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assessmentData)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        console.log('Assessment saved for trend analysis');
                    }
                })
                .catch(error => {
                    console.error('Error saving assessment:', error);
                });
        }// 
        // Updated Mobile Navigation Functions
        function initializeMobileNavigation() {
            const navToggle = document.getElementById('nav-toggle');
            const sidebar = document.getElementById('sidebar');
            const sidebarClose = document.getElementById('sidebar-close');
            const sidebarOverlay = document.getElementById('sidebar-overlay');
            const menuItems = document.querySelectorAll('.menu-item');

            // Toggle sidebar
            if (navToggle) {
                navToggle.addEventListener('click', () => {
                    sidebar.classList.toggle('active');
                    if (sidebarOverlay) {
                        sidebarOverlay.classList.toggle('active');
                    }
                });
            }

            // Close sidebar
            function closeSidebar() {
                sidebar.classList.remove('active');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('active');
                }
            }

            if (sidebarClose) {
                sidebarClose.addEventListener('click', closeSidebar);
            }

            if (sidebarOverlay) {
                sidebarOverlay.addEventListener('click', closeSidebar);
            }

            // Menu item navigation
            menuItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();

                    // Update active menu item
                    menuItems.forEach(mi => mi.classList.remove('active'));
                    item.classList.add('active');

                    // Show corresponding section
                    const section = item.dataset.section;
                    showSection(section);

                    // Close sidebar on mobile
                    if (window.innerWidth < 768) {
                        closeSidebar();
                    }
                });
            });

            // Close sidebar when clicking outside (backup)
            document.addEventListener('click', (e) => {
                if (window.innerWidth < 768 &&
                    !sidebar.contains(e.target) &&
                    !navToggle.contains(e.target) &&
                    sidebar.classList.contains('active')) {
                    closeSidebar();
                }
            });
        }
        // Fallback functions for enhanced features (to prevent errors)
        function showRiskFactorAnalysis() {
            showInfo('Risk factor analysis feature will be available after completing an assessment');
        }

        function checkDrugInteractions() {
            showInfo('Drug interaction checker feature coming soon');
        }

        function showRiskTrendAnalysis() {
            showInfo('Risk trend analysis feature will be available after multiple assessments');
        }
        // / Clean initialization function
        function initializePatientInfo() {
            const patientId = generatePatientId();

            patientInfo = {
                id: patientId,
                name: 'New Patient',
                clinician: 'Healthcare Provider',
                startTime: new Date().toISOString()
            };

            // Update displays
            updatePatientDisplay();

            // Store in session
            sessionStorage.setItem('patientId', patientId);
            sessionStorage.setItem('patientName', 'New Patient');
            sessionStorage.setItem('clinicianName', 'Healthcare Provider');
            sessionStorage.setItem('assessmentStartTime', patientInfo.startTime);

            console.log(`🏥 New patient initialized: ${patientId}`);
        }// 
        // Clean sample data loading
        function loadSampleData(sampleType) {
            const samplePatients = {
                'high-risk': {
                    age: 75, sex: 'M', ethnicity: 'White', bmi: 32.5,
                    creatinine: 2.1, egfr: 35, ast_alt: 95, bilirubin: 1.8, albumin: 2.8,
                    diabetes: true, liver_disease: true, ckd: true, cardiac_disease: true,
                    index_drug_dose: 200, concomitant_drugs_count: 12, indication: 'Cancer',
                    cyp2c9: 'Poor', cyp2d6: 'PM', bp_systolic: 165, bp_diastolic: 95,
                    heart_rate: 95, time_since_start_days: 45,
                    cyp_inhibitors_flag: true, qt_prolonging_flag: true, hla_risk_allele_flag: true,
                    inpatient_flag: true, prior_adr_history: true
                },
                'medium-risk': {
                    age: 55, sex: 'F', ethnicity: 'Asian', bmi: 27.2,
                    creatinine: 1.3, egfr: 65, ast_alt: 45, bilirubin: 0.8, albumin: 3.5,
                    diabetes: true, liver_disease: false, ckd: false, cardiac_disease: true,
                    index_drug_dose: 150, concomitant_drugs_count: 6, indication: 'Pain',
                    cyp2c9: 'Intermediate', cyp2d6: 'IM', bp_systolic: 140, bp_diastolic: 85,
                    heart_rate: 78, time_since_start_days: 30,
                    cyp_inhibitors_flag: false, qt_prolonging_flag: true, hla_risk_allele_flag: false,
                    inpatient_flag: false, prior_adr_history: false
                },
                'low-risk': {
                    age: 35, sex: 'M', ethnicity: 'White', bmi: 24.1,
                    creatinine: 0.9, egfr: 95, ast_alt: 25, bilirubin: 0.5, albumin: 4.2,
                    diabetes: false, liver_disease: false, ckd: false, cardiac_disease: false,
                    index_drug_dose: 100, concomitant_drugs_count: 2, indication: 'Pain',
                    cyp2c9: 'Wild', cyp2d6: 'EM', bp_systolic: 120, bp_diastolic: 75,
                    heart_rate: 68, time_since_start_days: 14,
                    cyp_inhibitors_flag: false, qt_prolonging_flag: false, hla_risk_allele_flag: false,
                    inpatient_flag: false, prior_adr_history: false
                }
            };

            const sampleData = samplePatients[sampleType];
            if (!sampleData) return;

            // Fill form fields
            Object.keys(sampleData).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = sampleData[key];
                    } else {
                        element.value = sampleData[key];
                    }
                }
            });

            // Update progress
            updateFormProgress();
            showSuccess(`${sampleType.replace('-', ' ')} sample data loaded successfully!`);
        }// P
        // Patient Name Modal Functions
        function showPatientNameModal() {
            const modal = document.getElementById('patient-name-modal');
            if (modal) {
                modal.classList.add('active');
                const input = document.getElementById('patient-name-input');
                if (input) {
                    setTimeout(() => input.focus(), 300);
                }
            }
        }

        function closePatientModal() {
            const modal = document.getElementById('patient-name-modal');
            if (modal) {
                modal.classList.remove('active');
            }
        }

        function startAssessment() {
            const input = document.getElementById('patient-name-input');
            const patientName = input.value.trim();

            if (!patientName) {
                showError('Please enter patient name');
                input.focus();
                return;
            }

            // Update patient info with the entered name
            const patientId = generatePatientId();
            patientInfo = {
                id: patientId,
                name: patientName,
                clinician: 'Healthcare Provider',
                startTime: new Date().toISOString()
            };

            // Update displays
            updatePatientDisplay();

            // Store in session
            sessionStorage.setItem('patientId', patientId);
            sessionStorage.setItem('patientName', patientName);
            sessionStorage.setItem('clinicianName', 'Healthcare Provider');
            sessionStorage.setItem('assessmentStartTime', patientInfo.startTime);

            // Show patient header
            const patientHeader = document.getElementById('patient-header-card');
            if (patientHeader) {
                patientHeader.style.display = 'flex';
            }

            // Close modal
            closePatientModal();

            // Show success message
            showSuccess(`Assessment started for ${patientName}`);

            console.log(`🏥 Assessment started for: ${patientName} (ID: ${patientId})`);
        }

        // Handle Enter key in patient name input
        document.addEventListener('DOMContentLoaded', () => {
            const input = document.getElementById('patient-name-input');
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        startAssessment();
                    }
                });
            }
        });

        // Show modal when assessment page loads
        function initializeAssessmentPage() {
            // Check if we already have patient info
            const existingPatientName = sessionStorage.getItem('patientName');

            if (!existingPatientName || existingPatientName === 'New Patient') {
                // Show modal to get patient name
                setTimeout(() => {
                    showPatientNameModal();
                }, 500);
            } else {
                // Use existing patient info
                patientInfo = {
                    id: sessionStorage.getItem('patientId') || generatePatientId(),
                    name: existingPatientName,
                    clinician: sessionStorage.getItem('clinicianName') || 'Healthcare Provider',
                    startTime: sessionStorage.getItem('assessmentStartTime') || new Date().toISOString()
                };

                updatePatientDisplay();

                const patientHeader = document.getElementById('patient-header-card');
                if (patientHeader) {
                    patientHeader.style.display = 'flex';
                }
            }
        }//
        //  Show specific section function
        function showSection(sectionName) {
            console.log(`Switching to section: ${sectionName}`);

            // Hide all sections
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => {
                section.classList.remove('active');
            });

            // Show target section
            const targetSection = document.getElementById(`${sectionName}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
                console.log(`Section ${sectionName} activated`);
            } else {
                console.warn(`Section ${sectionName}-section not found`);
            }

            // Update page title based on section
            const sectionTitles = {
                'assessment': 'Patient Assessment',
                'results': 'Assessment Results',
                'reports': 'Clinical Reports',
                'history': 'Patient History'
            };

            if (sectionTitles[sectionName]) {
                document.title = `ADR Risk Predictor - ${sectionTitles[sectionName]}`;
            }
        }
    }
}
// L
// oad sample data function
async function loadSampleData(sampleType) {
    try {
        showLoading();

        const response = await fetch(`/sample_data/${sampleType}`);
        if (!response.ok) {
            throw new Error(`Failed to load sample data: ${response.status}`);
        }

        const sampleData = await response.json();

        // Populate form fields
        Object.keys(sampleData).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = sampleData[key] === 1;
                } else {
                    field.value = sampleData[key];
                }
            }
        });

        // Trigger BMI calculation if height and weight are loaded
        if (sampleData.height && sampleData.weight) {
            calculateBMI();
        }

        showSuccess(`Sample data loaded: ${sampleData.name}`);

    } catch (error) {
        console.error('Error loading sample data:', error);
        showError(`Failed to load sample data: ${error.message}`);
    } finally {
        hideLoading();
    }
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
                color: #2f855a;
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
                color: #2f855a;
                cursor: pointer;
                padding: 5px;
                margin-left: auto;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(successDiv);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 4000);
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

// Show info message
function showInfo(message) {
    // Create info notification
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-notification';
    infoDiv.innerHTML = `
        <div class="info-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add info styles if not already added
    if (!document.querySelector('#info-styles')) {
        const style = document.createElement('style');
        style.id = 'info-styles';
        style.textContent = `
            .info-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #bee3f8;
                color: #2b6cb0;
                padding: 15px 20px;
                border-radius: 10px;
                border-left: 4px solid #3182ce;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                z-index: 1001;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            
            .info-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .info-content button {
                background: none;
                border: none;
                color: #2b6cb0;
                cursor: pointer;
                padding: 5px;
                margin-left: auto;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(infoDiv);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (infoDiv.parentElement) {
            infoDiv.remove();
        }
    }, 4000);
}
// / Multiple Medications Management
let medicationCount = 1;
let medications = [];

// Initialize medication management
function initializeMedicationManagement() {
    const addMedicationBtn = document.getElementById('add-medication');
    if (addMedicationBtn) {
        addMedicationBtn.addEventListener('click', addMedication);
    }

    // Initialize first medication
    setupMedicationEventListeners(0);
    updateMedicationSummary();
}

// Add new medication
function addMedication() {
    const container = document.getElementById('medications-container');
    if (!container) return;

    const medicationCard = createMedicationCard(medicationCount);
    container.appendChild(medicationCard);

    setupMedicationEventListeners(medicationCount);
    medicationCount++;
    updateMedicationSummary();

    // Scroll to new medication
    medicationCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Create medication card HTML
function createMedicationCard(index) {
    const card = document.createElement('div');
    card.className = 'medication-card';
    card.setAttribute('data-medication-index', index);

    card.innerHTML = `
        <div class="medication-header">
            <span class="medication-label">${index === 0 ? 'Primary Medication' : `Medication ${index + 1}`}</span>
            <div class="dose-index-display">
                <span class="dose-index-label">Dose Index:</span>
                <span class="dose-index-value" id="dose-index-${index}">0.0</span>
            </div>
            ${index > 0 ? `<button type="button" class="btn-remove-medication" onclick="removeMedication(${index})"><i class="fas fa-times"></i></button>` : ''}
        </div>
        
        <div class="medication-form-grid">
            <div class="modern-form-group">
                <label for="medication_name_${index}">Medication Name</label>
                <select id="medication_name_${index}" name="medication_name_${index}" required>
                    <option value="">Select medication...</option>
                    <option value="Warfarin">Warfarin</option>
                    <option value="Metformin">Metformin</option>
                    <option value="Atorvastatin">Atorvastatin</option>
                    <option value="Lisinopril">Lisinopril</option>
                    <option value="Amlodipine">Amlodipine</option>
                    <option value="Metoprolol">Metoprolol</option>
                    <option value="Omeprazole">Omeprazole</option>
                    <option value="Levothyroxine">Levothyroxine</option>
                    <option value="Aspirin">Aspirin</option>
                    <option value="Clopidogrel">Clopidogrel</option>
                    <option value="Furosemide">Furosemide</option>
                    <option value="Digoxin">Digoxin</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label for="dose_${index}">Dose (mg)</label>
                <input type="number" id="dose_${index}" name="dose_${index}" min="1" max="2000" step="0.1" placeholder="Enter dose" required>
            </div>
            
            <div class="modern-form-group">
                <label for="frequency_${index}">Frequency</label>
                <select id="frequency_${index}" name="frequency_${index}" required>
                    <option value="">Select frequency...</option>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Four times daily">Four times daily</option>
                    <option value="As needed">As needed</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label for="route_${index}">Route</label>
                <select id="route_${index}" name="route_${index}" required>
                    <option value="">Select route...</option>
                    <option value="Oral">Oral</option>
                    <option value="IV">Intravenous</option>
                    <option value="IM">Intramuscular</option>
                    <option value="SC">Subcutaneous</option>
                    <option value="Topical">Topical</option>
                    <option value="Inhaled">Inhaled</option>
                    <option value="Rectal">Rectal</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label for="duration_${index}">Duration (days)</label>
                <input type="number" id="duration_${index}" name="duration_${index}" min="1" max="365" placeholder="Treatment duration" required>
            </div>
            
            <div class="modern-form-group">
                <label for="indication_${index}">Indication</label>
                <select id="indication_${index}" name="indication_${index}" required>
                    <option value="">Select indication...</option>
                    <option value="Pain">Pain Management</option>
                    <option value="Cancer">Cancer Treatment</option>
                    <option value="Autoimmune">Autoimmune Disease</option>
                    <option value="Cardiovascular">Cardiovascular Disease</option>
                    <option value="Diabetes">Diabetes</option>
                    <option value="Hypertension">Hypertension</option>
                    <option value="Infection">Infection</option>
                    <option value="Mental Health">Mental Health</option>
                    <option value="Respiratory">Respiratory Disease</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                    <option value="Neurological">Neurological</option>
                    <option value="Endocrine">Endocrine Disorder</option>
                </select>
            </div>
        </div>
    `;

    return card;
}

// Remove medication
function removeMedication(index) {
    const card = document.querySelector(`[data-medication-index="${index}"]`);
    if (card && index > 0) { // Don't allow removing primary medication
        card.remove();
        updateMedicationSummary();
        detectDrugInteractions();
    }
}

// Setup event listeners for medication fields
function setupMedicationEventListeners(index) {
    const doseField = document.getElementById(`dose_${index}`);
    const frequencyField = document.getElementById(`frequency_${index}`);
    const durationField = document.getElementById(`duration_${index}`);
    const medicationField = document.getElementById(`medication_name_${index}`);

    if (doseField) {
        doseField.addEventListener('input', () => calculateDoseIndex(index));
    }

    if (frequencyField) {
        frequencyField.addEventListener('change', () => calculateDoseIndex(index));
    }

    if (durationField) {
        durationField.addEventListener('input', () => calculateDoseIndex(index));
    }

    if (medicationField) {
        medicationField.addEventListener('change', () => {
            calculateDoseIndex(index);
            detectDrugInteractions();
        });
    }
}

// Calculate dose index for a medication
function calculateDoseIndex(index) {
    const dose = parseFloat(document.getElementById(`dose_${index}`)?.value || 0);
    const frequency = document.getElementById(`frequency_${index}`)?.value || '';
    const duration = parseFloat(document.getElementById(`duration_${index}`)?.value || 0);

    // Convert frequency to daily multiplier
    const frequencyMultiplier = {
        'Once daily': 1,
        'Twice daily': 2,
        'Three times daily': 3,
        'Four times daily': 4,
        'As needed': 0.5,
        'Weekly': 1 / 7,
        'Monthly': 1 / 30
    };

    const dailyMultiplier = frequencyMultiplier[frequency] || 0;
    const totalDose = dose * dailyMultiplier * duration;

    // Calculate dose index (normalized score)
    const doseIndex = totalDose > 0 ? Math.min(totalDose / 1000, 10).toFixed(1) : '0.0';

    const doseIndexElement = document.getElementById(`dose-index-${index}`);
    if (doseIndexElement) {
        doseIndexElement.textContent = doseIndex;

        // Color code based on dose index
        const display = doseIndexElement.parentElement;
        if (parseFloat(doseIndex) > 5) {
            display.style.background = '#ef4444'; // High dose - red
        } else if (parseFloat(doseIndex) > 2) {
            display.style.background = '#f59e0b'; // Medium dose - orange
        } else {
            display.style.background = '#667eea'; // Normal dose - blue
        }
    }

    updateMedicationSummary();
}

// Update medication summary
function updateMedicationSummary() {
    const medicationCards = document.querySelectorAll('.medication-card');
    const totalMedications = medicationCards.length;

    // Update total count
    const totalElement = document.getElementById('total-medications');
    if (totalElement) {
        totalElement.textContent = totalMedications;
    }

    // Calculate average dose index
    let totalDoseIndex = 0;
    let validMedications = 0;

    medicationCards.forEach((card, index) => {
        const doseIndexElement = document.getElementById(`dose-index-${card.dataset.medicationIndex}`);
        if (doseIndexElement) {
            const doseIndex = parseFloat(doseIndexElement.textContent);
            if (!isNaN(doseIndex)) {
                totalDoseIndex += doseIndex;
                validMedications++;
            }
        }
    });

    const averageDoseIndex = validMedications > 0 ? (totalDoseIndex / validMedications).toFixed(1) : '0.0';
    const averageElement = document.getElementById('average-dose-index');
    if (averageElement) {
        averageElement.textContent = averageDoseIndex;
    }
}

// Detect drug interactions
function detectDrugInteractions() {
    const medicationCards = document.querySelectorAll('.medication-card');
    const medications = [];

    medicationCards.forEach(card => {
        const index = card.dataset.medicationIndex;
        const medicationName = document.getElementById(`medication_name_${index}`)?.value;
        if (medicationName) {
            medications.push(medicationName);
        }
    });

    // Simple interaction detection logic
    let interactionLevel = 'None';

    if (medications.length > 1) {
        // Check for known high-risk combinations
        const highRiskCombinations = [
            ['Warfarin', 'Aspirin'],
            ['Warfarin', 'Clopidogrel'],
            ['Digoxin', 'Furosemide'],
            ['Metformin', 'Furosemide']
        ];

        const moderateRiskCombinations = [
            ['Atorvastatin', 'Digoxin'],
            ['Lisinopril', 'Furosemide'],
            ['Metoprolol', 'Digoxin']
        ];

        // Check for high-risk interactions
        for (const combo of highRiskCombinations) {
            if (combo.every(med => medications.includes(med))) {
                interactionLevel = 'Major';
                break;
            }
        }

        // Check for moderate-risk interactions if no high-risk found
        if (interactionLevel === 'None') {
            for (const combo of moderateRiskCombinations) {
                if (combo.every(med => medications.includes(med))) {
                    interactionLevel = 'Moderate';
                    break;
                }
            }
        }

        // If multiple medications but no specific interactions, mark as minor
        if (interactionLevel === 'None' && medications.length > 2) {
            interactionLevel = 'Minor';
        }
    }

    const interactionSelect = document.getElementById('drug_interactions');
    if (interactionSelect) {
        interactionSelect.value = interactionLevel;

        // Color code the select based on interaction level
        interactionSelect.style.borderColor = {
            'None': '#10b981',
            'Minor': '#f59e0b',
            'Moderate': '#ef4444',
            'Major': '#dc2626',
            'Contraindicated': '#7c2d12'
        }[interactionLevel] || '#e5e7eb';
    }
}

// Initialize patient info from session storage
function initializePatientInfo() {
    const patientName = sessionStorage.getItem('patientName') || 'Patient';
    const clinicianName = sessionStorage.getItem('clinicianName') || 'Clinician';
    const patientId = sessionStorage.getItem('patientId') || '0';

    const patientNameDisplay = document.getElementById('patient-name-display');
    const clinicianNameDisplay = document.getElementById('clinician-name-display');
    const timestampDisplay = document.getElementById('timestamp-display');

    if (patientNameDisplay) {
        patientNameDisplay.textContent = patientName;
    }

    if (clinicianNameDisplay) {
        clinicianNameDisplay.textContent = clinicianName;
    }

    if (timestampDisplay) {
        const now = new Date();
        timestampDisplay.textContent = now.toLocaleString();
    }

    // Update patient ID display
    const patientIdElements = document.querySelectorAll('.patient-id');
    patientIdElements.forEach(element => {
        element.textContent = patientId;
    });
}

// Enhanced form submission to handle multiple medications
function collectMedicationData() {
    const medicationCards = document.querySelectorAll('.medication-card');
    const medicationsData = [];

    medicationCards.forEach(card => {
        const index = card.dataset.medicationIndex;
        const medicationData = {
            name: document.getElementById(`medication_name_${index}`)?.value || '',
            dose: parseFloat(document.getElementById(`dose_${index}`)?.value || 0),
            frequency: document.getElementById(`frequency_${index}`)?.value || '',
            route: document.getElementById(`route_${index}`)?.value || '',
            duration: parseFloat(document.getElementById(`duration_${index}`)?.value || 0),
            indication: document.getElementById(`indication_${index}`)?.value || '',
            doseIndex: parseFloat(document.getElementById(`dose-index-${index}`)?.textContent || 0)
        };

        if (medicationData.name) {
            medicationsData.push(medicationData);
        }
    });

    return medicationsData;
}

// Update the main initialization to include medication management
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing application...');

    // Initialize all components
    initializeDOMElements();
    initializePatientInfo();
    initializeMedicationManagement();
    setupFormHandler();
    setupClearHandler();
    setupReportHandler();

    console.log('Application initialized successfully');
});
// / Setup sample data loading functionality
function setupSampleDataLoading() {
    const loadSampleBtn = document.getElementById('load-sample-data');
    const sampleSelector = document.getElementById('sample-data-selector');

    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', () => {
            const selectedValue = sampleSelector ? sampleSelector.value : '';
            if (selectedValue) {
                loadSampleData(selectedValue);
                sampleSelector.value = '';
            } else {
                showNotification('Please select a sample patient first', 'error');
            }
        });
    }

    if (sampleSelector) {
        sampleSelector.addEventListener('change', (e) => {
            if (e.target.value) {
                loadSampleData(e.target.value);
                e.target.value = '';
            }
        });
    }
}

// Enhanced load sample data function
async function loadSampleDataEnhanced(sampleType) {
    try {
        showLoading();

        const response = await fetch(`/sample_data/${sampleType}`);
        if (!response.ok) {
            throw new Error(`Failed to load sample data: ${response.status}`);
        }

        const sampleData = await response.json();

        // Populate form fields
        Object.keys(sampleData).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = sampleData[key] === 1;
                } else {
                    field.value = sampleData[key];
                }
            }
        });

        // Trigger BMI calculation if height and weight are loaded
        if (sampleData.height && sampleData.weight) {
            calculateBMI();
        }

        showNotification(`Sample data loaded: ${sampleData.name}`, 'success');

    } catch (error) {
        console.error('Error loading sample data:', error);
        showNotification(`Failed to load sample data: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Enhanced notification system
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; margin-left: auto; cursor: pointer;">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add notification styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 12px;
                color: white;
                font-weight: 600;
                z-index: 1001;
                animation: slideIn 0.3s ease;
                max-width: 400px;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            }
            
            .notification.success {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }
            
            .notification.error {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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

    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 4000);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing enhanced application...');

    // Initialize patient info
    initializePatientInfo();

    // Setup sample data loading
    setupSampleDataLoading();

    // Show initial loading
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 1500);
    }

    console.log('Enhanced application initialized successfully');
});