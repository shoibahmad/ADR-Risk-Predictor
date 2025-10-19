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
    console.log('🔍 Initializing DOM elements...');
    
    form = document.getElementById('adr-form');
    clearButton = document.getElementById('clear-form');
    resultsContainer = document.getElementById('results-container');
    resultsContent = document.getElementById('results-content');
    generateReportButton = document.getElementById('generate-report');
    reportContainer = document.getElementById('report-container');
    reportContent = document.getElementById('report-content');
    loadingOverlay = document.getElementById('loading-overlay');

    // Log which elements were found
    console.log('📋 DOM Elements Status:', {
        'adr-form': !!form,
        'clear-form': !!clearButton,
        'results-container': !!resultsContainer,
        'results-content': !!resultsContent,
        'generate-report': !!generateReportButton,
        'report-container': !!reportContainer,
        'report-content': !!reportContent,
        'loading-overlay': !!loadingOverlay
    });

    // Make elements globally accessible for debugging
    window.resultsContainer = resultsContainer;
    window.resultsContent = resultsContent;
    window.reportContent = reportContent;

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
            // All sections are now optional - users can leave fields empty
            // We'll just check if at least one field in each section has a value
            switch (section) {
                case 'demographics':
                    return document.getElementById('age').value ||
                        document.getElementById('sex').value ||
                        document.getElementById('ethnicity').value ||
                        document.getElementById('height').value ||
                        document.getElementById('weight').value;

                case 'laboratory':
                    return document.getElementById('creatinine').value ||
                        document.getElementById('egfr').value ||
                        document.getElementById('ast_alt').value ||
                        document.getElementById('bilirubin').value ||
                        document.getElementById('albumin').value;

                case 'comorbidities':
                    return true; // Comorbidities are always optional

                case 'medication':
                    return document.getElementById('medication_name').value ||
                        document.getElementById('index_drug_dose').value ||
                        document.getElementById('concomitant_drugs_count').value ||
                        document.getElementById('drug_interactions').value;

                case 'pharmacogenomics':
                    return document.getElementById('cyp2c9').value ||
                        document.getElementById('cyp2d6').value;

                case 'clinical':
                    return document.getElementById('bp_systolic').value ||
                        document.getElementById('bp_diastolic').value ||
                        document.getElementById('heart_rate').value ||
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
                console.log('Form element:', form);
                console.log('Results container:', document.getElementById('results-container'));
                console.log('AI analysis container:', document.getElementById('ai-detailed-analysis-container'));

                // Basic validation - only check for invalid numeric values, not missing fields
                const invalidFields = [];
                const numericFields = ['age', 'height', 'weight', 'bmi', 'creatinine', 'egfr', 'ast_alt',
                    'bilirubin', 'albumin', 'index_drug_dose', 'concomitant_drugs_count',
                    'bp_systolic', 'bp_diastolic', 'heart_rate', 'time_since_start_days'];

                for (const field of numericFields) {
                    const element = document.getElementById(field);
                    if (element && element.value.trim()) {
                        const value = element.value.trim();
                        const numValue = parseFloat(value);
                        if (isNaN(numValue) || numValue < 0) {
                            invalidFields.push(`${field.replace(/_/g, ' ')} (must be a positive number)`);
                        }
                    }
                }

                if (invalidFields.length > 0) {
                    showError(`Please correct the following fields: ${invalidFields.join(', ')}`);
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

                    // Validate numeric fields before sending
                    const numericFields = ['age', 'height', 'weight', 'bmi', 'creatinine', 'egfr', 'ast_alt',
                        'bilirubin', 'albumin', 'index_drug_dose', 'concomitant_drugs_count',
                        'bp_systolic', 'bp_diastolic', 'heart_rate', 'time_since_start_days'];

                    for (const field of numericFields) {
                        if (field in patientData) {
                            const value = patientData[field];
                            if (isNaN(value) || value === null || value === undefined) {
                                console.error(`❌ Invalid numeric value for ${field}:`, value);
                                throw new Error(`Invalid numeric value for ${field}: ${value}`);
                            }
                        }
                    }

                    console.log('✅ Data validation passed');
                    console.log('📤 Sending patient data:', patientData);

                    // Collect concomitant drug names
                    const concomitantDrugs = [];
                    const drugInputs = document.querySelectorAll('.concomitant-drug-input');
                    drugInputs.forEach(input => {
                        if (input.value.trim()) {
                            concomitantDrugs.push(input.value.trim());
                        }
                    });
                    patientData.concomitant_drug_names = concomitantDrugs;

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

                    // Show detailed analysis container
                    showDetailedAnalysisContainer();

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
                const reportContentElement = document.getElementById('report-content');
                if (reportContentElement) {
                    reportContentElement.innerHTML = `
                <div class="report-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Report Generation Failed</h4>
                    <p>Unable to generate clinical report: ${error.message}</p>
                    <button onclick="generateClinicalReport()" class="btn btn-secondary">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
                } else {
                    console.error('❌ report-content element not found');
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

            // Generate AI-powered detailed analysis
            generateAIDetailedAnalysis(result);

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
            if (reportContent) {
                reportContent.innerHTML = patientHeader + formattedReport;
            } else {
                console.error('❌ reportContent is null, cannot display report');
            }

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

            // Store current prediction result for enhanced analysis
            currentPredictionResult = result;

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

            // Generate AI-powered detailed analysis
            generateAIDetailedAnalysis(result);

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

// Enhanced results display function
function displayEnhancedResults(result) {
    console.log('Displaying enhanced results:', result);

    // Ensure enhanced results container is visible
    const enhancedContainer = document.getElementById('enhanced-results-container');
    if (enhancedContainer) {
        enhancedContainer.style.display = 'block';
        console.log('Enhanced results container made visible');
    } else {
        console.error('Enhanced results container not found');
        return;
    }

    // Display major ADR factors with enhanced clinical information
    console.log('Major ADR factors:', result.major_adr_factors);
    if (result.major_adr_factors && result.major_adr_factors.length > 0) {
        const factorsHtml = result.major_adr_factors.map(factor => `
            <div class="adr-factor-card ${factor.risk_contribution.toLowerCase()}-risk">
                <div class="factor-header">
                    <h5>${factor.factor}</h5>
                    <span class="risk-badge ${factor.risk_contribution.toLowerCase()}">${factor.risk_contribution} Risk</span>
                </div>
                <div class="factor-value">${factor.value}</div>
                <div class="factor-description">${factor.description}</div>
                ${factor.clinical_reference ? `<div class="factor-reference"><i class="fas fa-book-medical"></i> ${factor.clinical_reference}</div>` : ''}
            </div>
        `).join('');

        const factorsContainer = document.getElementById('major-factors-container');
        if (factorsContainer) {
            factorsContainer.innerHTML = factorsHtml;
        }
    } else {
        const factorsContainer = document.getElementById('major-factors-container');
        if (factorsContainer) {
            factorsContainer.innerHTML = '<div class="no-data">No major ADR factors identified or data not available.</div>';
        }
    }

    // Display medication list
    console.log('Medication list:', result.medication_list);
    if (result.medication_list && result.medication_list.length > 0) {
        const medicationsHtml = result.medication_list.map(med => `
            <div class="medication-card ${med.risk_level.toLowerCase()}-risk">
                <div class="med-header">
                    <h5>${med.name}</h5>
                    <span class="med-type ${med.type.toLowerCase()}">${med.type}</span>
                </div>
                <div class="med-details">
                    <div class="med-dose">${med.dose}</div>
                    <div class="med-indication">${med.indication}</div>
                    <div class="med-risk">Risk Level: ${med.risk_level}</div>
                </div>
            </div>
        `).join('');

        const medicationsContainer = document.getElementById('medications-container');
        if (medicationsContainer) {
            medicationsContainer.innerHTML = medicationsHtml;
        }
    } else {
        const medicationsContainer = document.getElementById('medications-container');
        if (medicationsContainer) {
            medicationsContainer.innerHTML = '<div class="no-data">Medication list not available.</div>';
        }
    }

    // Display ADR list
    console.log('ADR list:', result.adr_list);
    if (result.adr_list && result.adr_list.length > 0) {
        const adrHtml = result.adr_list.map(adr => `
            <div class="adr-detail-card">
                <div class="adr-header">
                    <h5>${adr.name}</h5>
                    <span class="adr-probability">${adr.probability}%</span>
                </div>
                <div class="adr-info">
                    <div class="adr-category">${adr.category} - ${adr.severity}</div>
                    <div class="adr-onset">Onset: ${adr.onset}</div>
                    <div class="adr-symptoms">
                        <strong>Symptoms:</strong> ${adr.symptoms.join(', ')}
                    </div>
                    <div class="adr-monitoring">
                        <strong>Monitoring:</strong> ${adr.monitoring}
                    </div>
                </div>
            </div>
        `).join('');

        const adrContainer = document.getElementById('adr-details-container');
        if (adrContainer) {
            adrContainer.innerHTML = adrHtml;
        }
    } else {
        const adrContainer = document.getElementById('adr-details-container');
        if (adrContainer) {
            adrContainer.innerHTML = '<div class="no-data">ADR risk profile not available.</div>';
        }
    }
}

// Trigger detailed analysis function
function triggerDetailedAnalysis() {
    if (!currentPredictionResult || !currentPatientData) {
        showNotification('Please complete a risk assessment first', 'error');
        return;
    }
    
    generateAIDetailedAnalysis(currentPredictionResult);
}

// AI-Powered Detailed Analysis function - Enhanced with all field details
function generateAIDetailedAnalysis(result) {
    console.log('Generating AI-powered detailed analysis:', result);

    const aiContainer = document.getElementById('ai-detailed-analysis-container');
    const aiContent = document.getElementById('ai-detailed-content');

    if (!aiContainer || !aiContent) {
        console.error('AI detailed analysis containers not found');
        return;
    }

    // Show the container
    aiContainer.style.display = 'block';

    // Show loading state first
    aiContent.innerHTML = `
        <div class="ai-analysis-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Generating comprehensive clinical analysis using AI...</p>
        </div>
    `;

    // Generate content after a short delay
    setTimeout(() => {
        const analysisContent = generateComprehensiveAnalysis(result, currentPatientData);
        aiContent.innerHTML = analysisContent;
        console.log('AI detailed analysis generated successfully');
    }, 1500);
}

// Generate comprehensive analysis with all entered fields
function generateComprehensiveAnalysis(result, patientData) {
    const riskLevel = result.risk_level || 'High';
    const predictedADR = result.predicted_adr_type || 'Hepatotoxicity';
    const noADRProb = result.no_adr_probability || 8.51;
    const topRisks = result.top_adr_risks || {};

    return `
        <div class="comprehensive-analysis">
            <h1><i class="fas fa-brain"></i> Comprehensive ADR Risk Assessment</h1>
            
            <!-- Patient Overview Section -->
            <div class="analysis-section patient-overview">
                <h2><i class="fas fa-user-md"></i> Patient Overview</h2>
                <div class="patient-summary-grid">
                    ${generatePatientSummaryCards(patientData)}
                </div>
            </div>

            <!-- Risk Assessment Summary -->
            <div class="analysis-section risk-summary">
                <h2><i class="fas fa-exclamation-triangle"></i> Risk Assessment Summary</h2>
                <div class="risk-overview-cards">
                    <div class="risk-card primary-risk">
                        <div class="risk-icon"><i class="fas fa-warning"></i></div>
                        <div class="risk-content">
                            <h3>Primary Risk</h3>
                            <p class="risk-value">${predictedADR}</p>
                            <p class="risk-probability">${topRisks[Object.keys(topRisks)[0]] || '60.06'}% probability</p>
                        </div>
                    </div>
                    <div class="risk-card overall-risk">
                        <div class="risk-icon"><i class="fas fa-chart-line"></i></div>
                        <div class="risk-content">
                            <h3>Overall Risk Level</h3>
                            <p class="risk-value risk-${riskLevel.toLowerCase()}">${riskLevel}</p>
                            <p class="risk-description">${getRiskDescription(riskLevel)}</p>
                        </div>
                    </div>
                    <div class="risk-card safety-margin">
                        <div class="risk-icon"><i class="fas fa-shield-alt"></i></div>
                        <div class="risk-content">
                            <h3>Safety Probability</h3>
                            <p class="risk-value safety">${noADRProb}%</p>
                            <p class="risk-description">No adverse reactions</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detailed Field Analysis -->
            <div class="analysis-section field-analysis">
                <h2><i class="fas fa-microscope"></i> Detailed Field Analysis</h2>
                ${generateDetailedFieldAnalysis(patientData)}
            </div>

            <!-- Laboratory Values Analysis -->
            <div class="analysis-section lab-analysis">
                <h2><i class="fas fa-flask"></i> Laboratory Values Assessment</h2>
                ${generateLabAnalysis(patientData)}
            </div>

            <!-- Medication Analysis -->
            <div class="analysis-section medication-analysis">
                <h2><i class="fas fa-pills"></i> Medication Risk Analysis</h2>
                ${generateMedicationAnalysis(patientData)}
            </div>

            <!-- Clinical Recommendations -->
            <div class="analysis-section recommendations">
                <h2><i class="fas fa-clipboard-list"></i> Clinical Recommendations</h2>
                ${generateClinicalRecommendations(riskLevel, predictedADR, patientData)}
            </div>

            <!-- Monitoring Protocol -->
            <div class="analysis-section monitoring">
                <h2><i class="fas fa-heartbeat"></i> Monitoring Protocol</h2>
                ${generateMonitoringProtocol(riskLevel, patientData)}
            </div>

            <!-- Follow-up Timeline -->
            <div class="analysis-section timeline">
                <h2><i class="fas fa-calendar-alt"></i> Follow-up Timeline</h2>
                ${generateFollowupTimeline(riskLevel)}
            </div>
        </div>
    `;
}

// Generate patient summary cards
function generatePatientSummaryCards(patientData) {
    const demographics = [
        { label: 'Age', value: patientData.age, unit: 'years', icon: 'fas fa-birthday-cake' },
        { label: 'Sex', value: patientData.sex, icon: 'fas fa-venus-mars' },
        { label: 'Ethnicity', value: patientData.ethnicity, icon: 'fas fa-globe' },
        { label: 'BMI', value: patientData.bmi, unit: 'kg/m²', icon: 'fas fa-weight' }
    ];

    return demographics.map(item => `
        <div class="summary-card">
            <div class="summary-icon"><i class="${item.icon}"></i></div>
            <div class="summary-content">
                <h4>${item.label}</h4>
                <p>${item.value || 'Not specified'} ${item.unit || ''}</p>
            </div>
        </div>
    `).join('');
}

// Generate detailed field analysis
function generateDetailedFieldAnalysis(patientData) {
    const fieldCategories = {
        'Demographics': {
            fields: ['age', 'sex', 'ethnicity', 'height', 'weight', 'bmi'],
            icon: 'fas fa-user',
            color: '#3b82f6'
        },
        'Laboratory Values': {
            fields: ['creatinine', 'egfr', 'ast_alt', 'bilirubin', 'albumin', 'temperature', 'ind_value', 'atpp_value'],
            icon: 'fas fa-flask',
            color: '#10b981'
        },
        'Complete Blood Count (CBC)': {
            fields: ['hemoglobin', 'hematocrit', 'wbc_count', 'platelet_count', 'rbc_count'],
            icon: 'fas fa-tint',
            color: '#ef4444'
        },
        'Vital Signs': {
            fields: ['bp_systolic', 'bp_diastolic', 'heart_rate'],
            icon: 'fas fa-heartbeat',
            color: '#f59e0b'
        },
        'Comorbidities': {
            fields: ['diabetes', 'liver_disease', 'ckd', 'cardiac_disease', 'hypertension', 'respiratory_disease', 'neurological_disease', 'autoimmune_disease'],
            icon: 'fas fa-notes-medical',
            color: '#8b5cf6'
        },
        'Medications': {
            fields: ['medication_name', 'index_drug_dose', 'concomitant_drugs_count', 'drug_interactions', 'indication'],
            icon: 'fas fa-pills',
            color: '#06b6d4'
        },
        'Pharmacogenomics': {
            fields: ['cyp2c9', 'cyp2d6', 'cyp_inhibitors_flag', 'qt_prolonging_flag', 'hla_risk_allele_flag'],
            icon: 'fas fa-dna',
            color: '#ec4899'
        },
        'Clinical Context': {
            fields: ['time_since_start_days', 'inpatient_flag', 'prior_adr_history'],
            icon: 'fas fa-hospital',
            color: '#84cc16'
        }
    };

    let analysisHtml = '<div class="comprehensive-field-analysis">';
    let totalFieldsAnalyzed = 0;
    
    Object.entries(fieldCategories).forEach(([category, config]) => {
        const categoryFields = config.fields.filter(field => 
            patientData[field] !== undefined && patientData[field] !== null && patientData[field] !== ''
        );

        if (categoryFields.length > 0) {
            totalFieldsAnalyzed += categoryFields.length;
            analysisHtml += `
                <div class="field-category" style="border-left: 4px solid ${config.color};">
                    <div class="category-header" style="background: linear-gradient(135deg, ${config.color}15 0%, ${config.color}05 100%);">
                        <h3><i class="${config.icon}" style="color: ${config.color};"></i> ${category}</h3>
                        <span class="field-count">${categoryFields.length} field${categoryFields.length > 1 ? 's' : ''} analyzed</span>
                    </div>
                    <div class="field-grid">
                        ${categoryFields.map(field => generateEnhancedFieldCard(field, patientData[field], config.color)).join('')}
                    </div>
                </div>
            `;
        }
    });

    analysisHtml += `
        <div class="analysis-summary">
            <div class="summary-card">
                <i class="fas fa-chart-bar"></i>
                <div class="summary-content">
                    <h4>Analysis Summary</h4>
                    <p><strong>${totalFieldsAnalyzed}</strong> clinical parameters analyzed across <strong>${Object.keys(fieldCategories).filter(cat => fieldCategories[cat].fields.some(field => patientData[field] !== undefined && patientData[field] !== null && patientData[field] !== '')).length}</strong> categories</p>
                </div>
            </div>
        </div>
    </div>`;

    return analysisHtml || '<p class="no-data-message">No clinical data available for detailed analysis.</p>';
}

// Generate enhanced individual field card
function generateEnhancedFieldCard(fieldName, value, categoryColor) {
    const fieldLabels = {
        // Demographics
        'age': 'Age (years)',
        'sex': 'Sex',
        'ethnicity': 'Ethnicity',
        'height': 'Height (cm)',
        'weight': 'Weight (kg)',
        'bmi': 'BMI (kg/m²)',
        
        // Laboratory Values
        'creatinine': 'Creatinine (mg/dL)',
        'egfr': 'eGFR (mL/min/1.73m²)',
        'ast_alt': 'AST/ALT (U/L)',
        'bilirubin': 'Bilirubin (mg/dL)',
        'albumin': 'Albumin (g/dL)',
        'temperature': 'Temperature (°F)',
        'ind_value': 'INR',
        'atpp_value': 'aPTT (sec)',
        
        // CBC
        'hemoglobin': 'Hemoglobin (g/dL)',
        'hematocrit': 'Hematocrit (%)',
        'wbc_count': 'WBC Count (×10³/μL)',
        'platelet_count': 'Platelet Count (×10³/μL)',
        'rbc_count': 'RBC Count (×10⁶/μL)',
        
        // Vital Signs
        'bp_systolic': 'Systolic BP (mmHg)',
        'bp_diastolic': 'Diastolic BP (mmHg)',
        'heart_rate': 'Heart Rate (bpm)',
        
        // Comorbidities
        'diabetes': 'Diabetes Mellitus',
        'liver_disease': 'Liver Disease',
        'ckd': 'Chronic Kidney Disease',
        'cardiac_disease': 'Cardiac Disease',
        'hypertension': 'Hypertension',
        'respiratory_disease': 'Respiratory Disease',
        'neurological_disease': 'Neurological Disease',
        'autoimmune_disease': 'Autoimmune Disease',
        
        // Medications
        'medication_name': 'Primary Medication',
        'index_drug_dose': 'Drug Dose (mg)',
        'concomitant_drugs_count': 'Concomitant Medications',
        'drug_interactions': 'Drug Interactions',
        'indication': 'Indication',
        
        // Pharmacogenomics
        'cyp2c9': 'CYP2C9 Genotype',
        'cyp2d6': 'CYP2D6 Genotype',
        'cyp_inhibitors_flag': 'CYP Inhibitors',
        'qt_prolonging_flag': 'QT Prolonging Drugs',
        'hla_risk_allele_flag': 'HLA Risk Alleles',
        
        // Clinical Context
        'time_since_start_days': 'Treatment Duration (days)',
        'inpatient_flag': 'Inpatient Status',
        'prior_adr_history': 'Prior ADR History'
    };

    const normalRanges = {
        'age': '18-65 (adult)',
        'bmi': '18.5-24.9',
        'creatinine': '0.6-1.2',
        'egfr': '>90',
        'ast_alt': '10-40',
        'bilirubin': '0.2-1.2',
        'albumin': '3.5-5.0',
        'hemoglobin': 'M: 13.5-17.5, F: 12.0-15.5',
        'hematocrit': 'M: 41-50, F: 36-44',
        'wbc_count': '4.5-11.0',
        'platelet_count': '150-450',
        'rbc_count': 'M: 4.7-6.1, F: 4.2-5.4',
        'bp_systolic': '90-140',
        'bp_diastolic': '60-90',
        'heart_rate': '60-100',
        'temperature': '97.0-99.5',
        'ind_value': '0.8-1.2',
        'atpp_value': '25-35'
    };

    // Format display value
    let displayValue = value;
    if (typeof value === 'number' && [0, 1].includes(value) && (fieldName.includes('disease') || fieldName.includes('flag') || fieldName.includes('history'))) {
        displayValue = value === 1 ? 'Present' : 'Absent';
    } else if (typeof value === 'number' && !Number.isInteger(value)) {
        displayValue = parseFloat(value).toFixed(2);
    }

    const riskLevel = assessFieldRisk(fieldName, value);
    const interpretation = getEnhancedFieldInterpretation(fieldName, value);
    const normalRange = normalRanges[fieldName];
    
    return `
        <div class="enhanced-field-card ${riskLevel}" style="border-top: 3px solid ${categoryColor};">
            <div class="field-header">
                <div class="field-title">
                    <h4>${fieldLabels[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                    ${normalRange ? `<span class="normal-range">Normal: ${normalRange}</span>` : ''}
                </div>
                <span class="field-risk-badge ${riskLevel}" style="background: ${getRiskColor(riskLevel)};">
                    ${getRiskIcon(riskLevel)} ${riskLevel.toUpperCase()}
                </span>
            </div>
            <div class="field-content">
                <div class="field-value" style="color: ${getRiskColor(riskLevel)};">
                    ${displayValue}
                    ${getValueTrend(fieldName, value)}
                </div>
                <div class="field-interpretation">
                    ${interpretation}
                </div>
                ${getRiskFactorContribution(fieldName, value)}
            </div>
        </div>
    `;
}

// Helper functions for enhanced field analysis
function getRiskColor(riskLevel) {
    const colors = {
        'low': '#10b981',
        'normal': '#10b981', 
        'moderate': '#f59e0b',
        'high': '#ef4444',
        'critical': '#dc2626'
    };
    return colors[riskLevel] || '#6b7280';
}

function getRiskIcon(riskLevel) {
    const icons = {
        'low': '🟢',
        'normal': '🟢',
        'moderate': '🟡',
        'high': '🔴',
        'critical': '🚨'
    };
    return icons[riskLevel] || '⚪';
}

function getValueTrend(fieldName, value) {
    // Add trend indicators for numeric values
    if (typeof value === 'number') {
        const trends = {
            'creatinine': value > 1.5 ? ' ↗️' : value < 0.8 ? ' ↘️' : '',
            'egfr': value < 60 ? ' ↘️' : value > 90 ? ' ↗️' : '',
            'ast_alt': value > 50 ? ' ↗️' : '',
            'bilirubin': value > 2.0 ? ' ↗️' : '',
            'hemoglobin': value < 10 ? ' ↘️' : value > 16 ? ' ↗️' : '',
            'wbc_count': value > 12 ? ' ↗️' : value < 4 ? ' ↘️' : '',
            'platelet_count': value < 150 ? ' ↘️' : value > 450 ? ' ↗️' : '',
            'bp_systolic': value > 140 ? ' ↗️' : value < 90 ? ' ↘️' : '',
            'heart_rate': value > 100 ? ' ↗️' : value < 60 ? ' ↘️' : ''
        };
        return trends[fieldName] || '';
    }
    return '';
}

function getEnhancedFieldInterpretation(fieldName, value) {
    const interpretations = {
        'age': value > 65 ? 'Elderly patient - increased ADR risk due to age-related physiological changes' : 
               value < 18 ? 'Pediatric considerations may apply' : 'Adult patient within standard age range',
        
        'bmi': value > 30 ? 'Obese - may affect drug distribution and metabolism' :
               value > 25 ? 'Overweight - monitor for dose adjustments' :
               value < 18.5 ? 'Underweight - may require dose modifications' : 'Normal weight range',
        
        'creatinine': value > 2.0 ? 'Significantly elevated - severe renal impairment, dose adjustments required' :
                     value > 1.5 ? 'Elevated - moderate renal impairment, monitor closely' :
                     value > 1.2 ? 'Mildly elevated - mild renal impairment' : 'Within normal range',
        
        'egfr': value < 30 ? 'Severe renal impairment - significant dose adjustments needed' :
                value < 60 ? 'Moderate renal impairment - dose modifications may be required' :
                value < 90 ? 'Mild renal impairment - monitor renal function' : 'Normal kidney function',
        
        'ast_alt': value > 200 ? 'Severely elevated - significant hepatic impairment' :
                   value > 100 ? 'Markedly elevated - moderate hepatic impairment' :
                   value > 50 ? 'Mildly elevated - monitor liver function' : 'Normal liver enzymes',
        
        'hemoglobin': value < 8 ? 'Severe anemia - may affect drug tolerance' :
                      value < 10 ? 'Moderate anemia - monitor for symptoms' :
                      value < 12 ? 'Mild anemia' : 'Normal hemoglobin levels',
        
        'wbc_count': value > 15 ? 'Significantly elevated - possible infection or inflammation' :
                     value > 11 ? 'Elevated - monitor for infection' :
                     value < 4 ? 'Low - increased infection risk' : 'Normal white cell count',
        
        'platelet_count': value < 100 ? 'Thrombocytopenia - bleeding risk increased' :
                          value < 150 ? 'Low normal - monitor for bleeding' :
                          value > 450 ? 'Elevated - thrombosis risk' : 'Normal platelet count',
        
        'bp_systolic': value > 180 ? 'Hypertensive crisis - immediate attention needed' :
                       value > 140 ? 'Hypertensive - cardiovascular risk increased' :
                       value < 90 ? 'Hypotensive - monitor for symptoms' : 'Normal blood pressure',
        
        'diabetes': value === 1 ? 'Present - affects drug metabolism and increases ADR risk' : 'Not present',
        'liver_disease': value === 1 ? 'Present - significantly affects drug metabolism' : 'Not present',
        'ckd': value === 1 ? 'Present - requires dose adjustments for renally cleared drugs' : 'Not present',
        'cardiac_disease': value === 1 ? 'Present - increases risk of cardiovascular ADRs' : 'Not present'
    };
    
    return interpretations[fieldName] || `Value: ${value} - Clinical significance being evaluated`;
}

function getRiskFactorContribution(fieldName, value) {
    const riskContributions = {
        'age': value > 65 ? 'High' : value > 50 ? 'Moderate' : 'Low',
        'creatinine': value > 2.0 ? 'High' : value > 1.5 ? 'Moderate' : 'Low',
        'ast_alt': value > 100 ? 'High' : value > 50 ? 'Moderate' : 'Low',
        'diabetes': value === 1 ? 'Moderate' : 'Low',
        'liver_disease': value === 1 ? 'High' : 'Low',
        'ckd': value === 1 ? 'High' : 'Low'
    };
    
    const contribution = riskContributions[fieldName];
    if (contribution && contribution !== 'Low') {
        return `<div class="risk-contribution ${contribution.toLowerCase()}">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${contribution} ADR Risk Contribution</span>
        </div>`;
    }
    return '';
}

// Generate laboratory analysis
function generateLabAnalysis(patientData) {
    const labFields = {
        'creatinine': { label: 'Creatinine (mg/dL)', normal: '0.6-1.2' },
        'egfr': { label: 'eGFR (mL/min/1.73m²)', normal: '>90' },
        'ast_alt': { label: 'AST/ALT (U/L)', normal: '10-40' },
        'bilirubin': { label: 'Bilirubin (mg/dL)', normal: '0.2-1.2' },
        'albumin': { label: 'Albumin (g/dL)', normal: '3.5-5.0' },
        'hemoglobin': { label: 'Hemoglobin (g/dL)', normal: 'M: 13.5-17.5, F: 12.0-15.5' },
        'hematocrit': { label: 'Hematocrit (%)', normal: 'M: 41-50, F: 36-44' },
        'wbc_count': { label: 'WBC Count (×10³/μL)', normal: '4.5-11.0' },
        'platelet_count': { label: 'Platelet Count (×10³/μL)', normal: '150-450' },
        'rbc_count': { label: 'RBC Count (×10⁶/μL)', normal: 'M: 4.7-6.1, F: 4.2-5.4' }
    };

    const enteredLabs = Object.entries(labFields).filter(([field]) => 
        patientData[field] !== undefined && patientData[field] !== null && patientData[field] !== ''
    );

    if (enteredLabs.length === 0) {
        return '<p>No laboratory values entered for analysis.</p>';
    }

    return `
        <div class="lab-analysis-grid">
            ${enteredLabs.map(([field, config]) => `
                <div class="lab-card ${assessLabRisk(field, patientData[field])}">
                    <div class="lab-header">
                        <h4>${config.label}</h4>
                        <span class="lab-normal">Normal: ${config.normal}</span>
                    </div>
                    <div class="lab-value-section">
                        <div class="lab-value">${patientData[field]}</div>
                        <div class="lab-status ${assessLabRisk(field, patientData[field])}">${getLabStatus(field, patientData[field])}</div>
                    </div>
                    <div class="lab-interpretation">${getLabInterpretation(field, patientData[field])}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// Generate medication analysis
function generateMedicationAnalysis(patientData) {
    const medicationFields = ['medication_name', 'index_drug_dose', 'concomitant_drugs_count', 'drug_interactions'];
    const enteredMeds = medicationFields.filter(field => 
        patientData[field] !== undefined && patientData[field] !== null && patientData[field] !== ''
    );

    if (enteredMeds.length === 0) {
        return '<p>No medication information entered for analysis.</p>';
    }

    return `
        <div class="medication-analysis-content">
            ${patientData.medication_name ? `
                <div class="med-primary">
                    <h4><i class="fas fa-prescription-bottle-alt"></i> Primary Medication</h4>
                    <div class="med-details">
                        <span class="med-name">${patientData.medication_name}</span>
                        ${patientData.index_drug_dose ? `<span class="med-dose">${patientData.index_drug_dose} mg</span>` : ''}
                    </div>
                </div>
            ` : ''}
            
            <div class="med-metrics">
                ${patientData.concomitant_drugs_count ? `
                    <div class="med-metric">
                        <div class="metric-icon"><i class="fas fa-pills"></i></div>
                        <div class="metric-content">
                            <h5>Concomitant Medications</h5>
                            <p class="metric-value">${patientData.concomitant_drugs_count}</p>
                            <p class="metric-risk ${patientData.concomitant_drugs_count > 10 ? 'high' : patientData.concomitant_drugs_count > 5 ? 'medium' : 'low'}">
                                ${patientData.concomitant_drugs_count > 10 ? 'High polypharmacy risk' : patientData.concomitant_drugs_count > 5 ? 'Moderate polypharmacy' : 'Low medication burden'}
                            </p>
                        </div>
                    </div>
                ` : ''}
                
                ${patientData.drug_interactions ? `
                    <div class="med-metric">
                        <div class="metric-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="metric-content">
                            <h5>Drug Interactions</h5>
                            <p class="metric-value interaction-${patientData.drug_interactions.toLowerCase()}">${patientData.drug_interactions}</p>
                            <p class="metric-risk ${patientData.drug_interactions.toLowerCase()}">
                                ${getInteractionRiskDescription(patientData.drug_interactions)}
                            </p>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Generate clinical recommendations
function generateClinicalRecommendations(riskLevel, predictedADR, patientData) {
    return `
        <div class="recommendations-content">
            <div class="recommendation-category immediate">
                <h4><i class="fas fa-exclamation"></i> Immediate Actions</h4>
                <ul>
                    <li>Implement ${riskLevel.toLowerCase()}-risk monitoring protocols immediately</li>
                    <li>Educate patient on early warning signs of ${predictedADR.toLowerCase()}</li>
                    <li>Establish baseline laboratory values for monitoring</li>
                    <li>Schedule follow-up within ${riskLevel === 'High' ? '1-2 days' : riskLevel === 'Medium' ? '3-7 days' : '1-2 weeks'}</li>
                </ul>
            </div>
            
            <div class="recommendation-category monitoring">
                <h4><i class="fas fa-stethoscope"></i> Monitoring Strategy</h4>
                <ul>
                    <li><strong>Laboratory Monitoring:</strong> ${getLabMonitoringFrequency(riskLevel, patientData)}</li>
                    <li><strong>Clinical Assessment:</strong> ${getClinicalMonitoringFrequency(riskLevel)}</li>
                    <li><strong>Patient Education:</strong> Signs and symptoms to report immediately</li>
                    <li><strong>Emergency Protocol:</strong> Clear instructions for severe reactions</li>
                </ul>
            </div>
            
            <div class="recommendation-category mitigation">
                <h4><i class="fas fa-shield-alt"></i> Risk Mitigation</h4>
                <ul>
                    <li>${getDoseMitigationAdvice(patientData)}</li>
                    <li>Evaluate alternative therapeutic options if appropriate</li>
                    <li>${getSpecificMitigationAdvice(predictedADR)}</li>
                    <li>Optimize concomitant medication regimen</li>
                </ul>
            </div>
        </div>
    `;
}

// Generate monitoring protocol
function generateMonitoringProtocol(riskLevel, patientData) {
    return `
        <div class="monitoring-protocol">
            <div class="protocol-timeline">
                <div class="timeline-item immediate">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h5>Immediate (Today)</h5>
                        <p>Patient counseling, baseline assessments, emergency contact information</p>
                    </div>
                </div>
                
                <div class="timeline-item short-term">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h5>${getShortTermTiming(riskLevel)}</h5>
                        <p>First follow-up, laboratory monitoring, symptom assessment</p>
                    </div>
                </div>
                
                <div class="timeline-item ongoing">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h5>Ongoing</h5>
                        <p>Regular monitoring, dose adjustments, risk reassessment</p>
                    </div>
                </div>
            </div>
            
            <div class="monitoring-parameters">
                <h5>Key Parameters to Monitor</h5>
                <div class="parameter-grid">
                    ${generateMonitoringParameters(patientData)}
                </div>
            </div>
        </div>
    `;
}

// Generate follow-up timeline
function generateFollowupTimeline(riskLevel) {
    const timelines = {
        'High': [
            { time: '24-48 hours', action: 'Initial safety check and symptom assessment' },
            { time: '1 week', action: 'Comprehensive follow-up with laboratory monitoring' },
            { time: '2 weeks', action: 'Risk reassessment and dose optimization' },
            { time: 'Monthly', action: 'Ongoing monitoring and management' }
        ],
        'Medium': [
            { time: '3-7 days', action: 'Initial follow-up and patient education' },
            { time: '2 weeks', action: 'First comprehensive assessment' },
            { time: 'Monthly', action: 'Regular monitoring and reassessment' },
            { time: 'Quarterly', action: 'Long-term safety evaluation' }
        ],
        'Low': [
            { time: '1-2 weeks', action: 'Initial follow-up and baseline establishment' },
            { time: 'Monthly', action: 'Routine monitoring' },
            { time: 'Quarterly', action: 'Comprehensive reassessment' },
            { time: 'Annually', action: 'Long-term safety review' }
        ]
    };

    const timeline = timelines[riskLevel] || timelines['Medium'];
    
    return `
        <div class="followup-timeline">
            ${timeline.map((item, index) => `
                <div class="timeline-step step-${index + 1}">
                    <div class="step-marker">${index + 1}</div>
                    <div class="step-content">
                        <h5>${item.time}</h5>
                        <p>${item.action}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Generate simple detailed clinical analysis content
function generateSimpleDetailedAnalysis(result) {
    const riskLevel = result.risk_level || 'Unknown';
    const predictedADR = result.predicted_adr_type || 'Unknown';
    const noADRProb = result.no_adr_probability || 0;
    const topRisks = result.top_adr_risks || {};

    return `
        <h2>🎯 Risk Assessment Summary</h2>
        <div class="risk-summary-section">
            <div class="risk-metrics">
                <div class="metric-card">
                    <div class="metric-title">Overall Risk Level</div>
                    <div class="metric-value risk-${riskLevel.toLowerCase()}">${riskLevel}</div>
                    <div class="metric-desc">${getRiskDescription(riskLevel)}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Primary Concern</div>
                    <div class="metric-value">${predictedADR}</div>
                    <div class="metric-desc">Most likely ADR type</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Safety Probability</div>
                    <div class="metric-value">${noADRProb}%</div>
                    <div class="metric-desc">No adverse reactions</div>
                </div>
            </div>
        </div>

        <h2>🔍 Detailed Risk Breakdown</h2>
        <div class="risk-breakdown-section">
            ${Object.entries(topRisks).slice(0, 5).map(([adr, prob]) => `
                <div class="risk-item">
                    <div class="risk-item-name">${adr}</div>
                    <div class="risk-item-prob">${prob}%</div>
                    <div class="risk-item-bar">
                        <div class="risk-bar-fill" style="width: ${prob}%; background-color: ${prob > 20 ? '#ef4444' : prob > 10 ? '#f59e0b' : '#10b981'}"></div>
                    </div>
                </div>
            `).join('')}
        </div>

        <h2>💊 Clinical Recommendations</h2>
        <div class="recommendations-section">
            <div class="recommendation-box">
                <h3>Immediate Actions</h3>
                <ul>
                    <li>Implement ${riskLevel.toLowerCase()}-risk monitoring protocols</li>
                    <li>Patient education on warning signs</li>
                    <li>Schedule appropriate follow-up</li>
                </ul>
            </div>
            
            <div class="recommendation-box">
                <h3>Monitoring Strategy</h3>
                <ul>
                    <li>${getMonitoringRecommendation(riskLevel)}</li>
                    <li>Regular effectiveness vs. risk assessment</li>
                    <li>Patient-reported outcome tracking</li>
                </ul>
            </div>

            <div class="recommendation-box">
                <h3>Risk Mitigation</h3>
                <ul>
                    <li>${getRiskMitigationAdvice(riskLevel)}</li>
                    <li>Consider dose optimization</li>
                    <li>Evaluate alternative therapies if needed</li>
                </ul>
            </div>
        </div>

        <h2>📋 Follow-up Timeline</h2>
        <div class="timeline-section">
            <div class="timeline-item">
                <div class="timeline-marker immediate"></div>
                <div class="timeline-content">
                    <strong>Today:</strong> Patient counseling and baseline assessments
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-marker short-term"></div>
                <div class="timeline-content">
                    <strong>${getFollowUpTiming(riskLevel)}:</strong> First follow-up and monitoring
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-marker long-term"></div>
                <div class="timeline-content">
                    <strong>Ongoing:</strong> Continuous monitoring and reassessment
                </div>
            </div>
        </div>

        <div class="clinical-note">
            <p><strong>Clinical Note:</strong> This AI-powered analysis provides decision support based on statistical modeling. Clinical judgment should always supersede algorithmic recommendations.</p>
        </div>
    `;
}

// Generate detailed clinical analysis content
function generateDetailedClinicalAnalysis(result) {
    const riskLevel = result.risk_level;
    const predictedADR = result.predicted_adr_type;
    const noADRProb = result.no_adr_probability;
    const topRisks = result.top_adr_risks || {};

    return `
        <div class="clinical-analysis-section">
            <h3 class="analysis-section-title">🎯 Risk Assessment Summary</h3>
            <div class="risk-overview">
                <div class="risk-grid">
                    <div class="risk-metric">
                        <div class="metric-label">Overall Risk Classification</div>
                        <div class="metric-value risk-${riskLevel.toLowerCase()}">${riskLevel} Risk</div>
                        <div class="metric-description">${getRiskDescription(riskLevel)}</div>
                    </div>
                    <div class="risk-metric">
                        <div class="metric-label">Primary ADR Concern</div>
                        <div class="metric-value">${predictedADR}</div>
                        <div class="metric-description">${getADRDescription(predictedADR)}</div>
                    </div>
                    <div class="risk-metric">
                        <div class="metric-label">Safety Probability</div>
                        <div class="metric-value">${noADRProb}%</div>
                        <div class="metric-description">Likelihood of no adverse reactions</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="clinical-analysis-section">
            <h3 class="analysis-section-title">🔍 Detailed Risk Analysis</h3>
            <div class="detailed-risks">
                ${Object.entries(topRisks).slice(0, 5).map(([adr, prob]) => `
                    <div class="risk-detail-item">
                        <div class="risk-name">${adr}</div>
                        <div class="risk-probability">${prob}%</div>
                        <div class="risk-bar">
                            <div class="risk-fill" style="width: ${prob}%; background: ${getRiskColor(prob)}"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="clinical-analysis-section">
            <h3 class="analysis-section-title">💊 Clinical Recommendations</h3>
            <div class="recommendations">
                <div class="recommendation-category">
                    <h4>Immediate Actions</h4>
                    <ul>
                        <li>Implement ${riskLevel.toLowerCase()}-risk monitoring protocols</li>
                        <li>Educate patient on ${predictedADR !== 'No ADR' ? predictedADR.toLowerCase() : 'potential ADR'} warning signs</li>
                        <li>Schedule appropriate follow-up based on risk level</li>
                    </ul>
                </div>
                
                <div class="recommendation-category">
                    <h4>Monitoring Strategy</h4>
                    <ul>
                        <li>${getMonitoringRecommendation(riskLevel, predictedADR)}</li>
                        <li>Regular assessment of medication effectiveness vs. risk</li>
                        <li>Patient-reported outcome monitoring</li>
                    </ul>
                </div>

                <div class="recommendation-category">
                    <h4>Risk Mitigation</h4>
                    <ul>
                        <li>${getRiskMitigationAdvice(riskLevel, predictedADR)}</li>
                        <li>Consider dose optimization if clinically appropriate</li>
                        <li>Evaluate alternative therapeutic options if high risk</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="clinical-analysis-section">
            <h3 class="analysis-section-title">📋 Next Steps</h3>
            <div class="next-steps">
                <div class="step-timeline">
                    <div class="timeline-item">
                        <div class="timeline-marker immediate"></div>
                        <div class="timeline-content">
                            <div class="timeline-title">Immediate (Today)</div>
                            <div class="timeline-description">Patient counseling and baseline assessments</div>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-marker short-term"></div>
                        <div class="timeline-content">
                            <div class="timeline-title">${getFollowUpTiming(riskLevel)}</div>
                            <div class="timeline-description">First follow-up and monitoring assessment</div>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-marker long-term"></div>
                        <div class="timeline-content">
                            <div class="timeline-title">Ongoing</div>
                            <div class="timeline-description">Continuous monitoring and risk reassessment</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="clinical-disclaimer">
            <p><strong>Clinical Note:</strong> This AI-powered analysis provides decision support based on statistical modeling. Clinical judgment should always supersede algorithmic recommendations. Consider individual patient factors, contraindications, and current clinical guidelines.</p>
        </div>
    `;
}

// Helper functions for clinical analysis
function getRiskDescription(riskLevel) {
    switch (riskLevel.toLowerCase()) {
        case 'high': return 'Enhanced monitoring and immediate intervention required';
        case 'medium': return 'Regular monitoring with proactive management';
        case 'low': return 'Standard monitoring with routine follow-up';
        default: return 'Risk assessment completed';
    }
}

function getADRDescription(adrType) {
    const descriptions = {
        'Hepatotoxicity': 'Liver function monitoring and hepatoprotective measures essential',
        'Nephrotoxicity': 'Renal function surveillance and hydration status management',
        'Cardiotoxicity': 'Cardiac monitoring and rhythm assessment protocols',
        'Gastrointestinal': 'GI symptom monitoring and supportive care measures',
        'Neurological': 'Neurological assessment and cognitive function monitoring',
        'Hematological': 'Blood count monitoring and bleeding risk assessment',
        'Dermatological': 'Skin examination and allergic reaction monitoring',
        'No ADR': 'Continue standard monitoring protocols'
    };
    return descriptions[adrType] || 'Specific monitoring protocols as clinically indicated';
}

function getRiskColor(probability) {
    if (probability > 20) return '#ef4444';
    if (probability > 10) return '#f59e0b';
    if (probability > 5) return '#eab308';
    return '#10b981';
}

function getMonitoringRecommendation(riskLevel) {
    const monitoring = {
        'High': 'Weekly clinical assessments with laboratory monitoring',
        'Medium': 'Bi-weekly follow-up with targeted laboratory tests',
        'Low': 'Monthly monitoring with routine laboratory panels'
    };
    return monitoring[riskLevel] || 'Standard monitoring protocols';
}

function getRiskMitigationAdvice(riskLevel) {
    if (riskLevel === 'High') {
        return 'Consider dose reduction, alternative therapy, or enhanced supportive care';
    } else if (riskLevel === 'Medium') {
        return 'Optimize dosing regimen and implement preventive measures';
    } else {
        return 'Continue current therapy with standard precautions';
    }
}

function getFollowUpTiming(riskLevel) {
    switch (riskLevel.toLowerCase()) {
        case 'high': return '1-3 Days';
        case 'medium': return '1-2 Weeks';
        case 'low': return '2-4 Weeks';
        default: return '1-2 Weeks';
    }
}

// Generate fallback analysis when AI is not available
function generateFallbackAnalysis(result) {
    const riskLevel = result.risk_level;
    const predictedADR = result.predicted_adr_type;
    const noADRProb = result.no_adr_probability;

    return `
        <div class="fallback-section">
            <h4>Risk Assessment Summary</h4>
            <div class="risk-summary-grid">
                <div class="risk-item">
                    <span class="risk-label">Overall Risk Level:</span>
                    <span class="risk-value ${riskLevel.toLowerCase()}">${riskLevel}</span>
                </div>
                <div class="risk-item">
                    <span class="risk-label">Predicted ADR Type:</span>
                    <span class="risk-value">${predictedADR}</span>
                </div>
                <div class="risk-item">
                    <span class="risk-label">No ADR Probability:</span>
                    <span class="risk-value">${noADRProb}%</span>
                </div>
            </div>
        </div>
        
        <div class="fallback-section">
            <h4>Clinical Recommendations</h4>
            <ul>
                <li>Monitor patient closely for signs of ${predictedADR !== 'No ADR' ? predictedADR.toLowerCase() : 'any adverse reactions'}</li>
                <li>Consider ${riskLevel.toLowerCase()} risk monitoring protocols</li>
                <li>Regular follow-up appointments recommended</li>
                <li>Patient education on potential side effects</li>
            </ul>
        </div>
        
        <div class="fallback-section">
            <h4>Next Steps</h4>
            <p>This assessment provides a baseline risk evaluation. Clinical judgment should always supersede algorithmic recommendations. Consider individual patient factors not captured in the model.</p>
        </div>
    `;
}

// Clean version of detailed analysis generator
function generateCleanDetailedAnalysis(result) {
    try {
        const riskLevel = result.risk_level || 'Unknown';
        const predictedADR = result.predicted_adr_type || 'Unknown';
        const noADRProb = result.no_adr_probability || 0;
        const topRisks = result.top_adr_risks || {};

        return `
            <h2>🎯 Risk Assessment Summary</h2>
            <div class="risk-summary-section">
                <div class="risk-metrics">
                    <div class="metric-card">
                        <div class="metric-title">Overall Risk Level</div>
                        <div class="metric-value risk-${riskLevel.toLowerCase()}">${riskLevel}</div>
                        <div class="metric-desc">Enhanced monitoring ${riskLevel.toLowerCase() === 'high' ? 'required' : 'recommended'}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Primary Concern</div>
                        <div class="metric-value">${predictedADR}</div>
                        <div class="metric-desc">Most likely ADR type</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Safety Probability</div>
                        <div class="metric-value">${noADRProb}%</div>
                        <div class="metric-desc">No adverse reactions</div>
                    </div>
                </div>
            </div>

            <h2>🔍 Detailed Risk Breakdown</h2>
            <div class="risk-breakdown-section">
                ${Object.entries(topRisks).slice(0, 5).map(([adr, prob]) => `
                    <div class="risk-item">
                        <div class="risk-item-name">${adr}</div>
                        <div class="risk-item-prob">${prob}%</div>
                        <div class="risk-item-bar">
                            <div class="risk-bar-fill" style="width: ${Math.min(prob, 100)}%; background-color: ${prob > 20 ? '#ef4444' : prob > 10 ? '#f59e0b' : '#10b981'}"></div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <h2>💊 Clinical Recommendations</h2>
            <div class="recommendations-section">
                <div class="recommendation-box">
                    <h3>Immediate Actions</h3>
                    <ul>
                        <li>Implement ${riskLevel.toLowerCase()}-risk monitoring protocols</li>
                        <li>Patient education on warning signs</li>
                        <li>Schedule appropriate follow-up</li>
                    </ul>
                </div>
                
                <div class="recommendation-box">
                    <h3>Monitoring Strategy</h3>
                    <ul>
                        <li>${riskLevel.toLowerCase() === 'high' ? 'Weekly clinical assessments' : riskLevel.toLowerCase() === 'medium' ? 'Bi-weekly follow-up' : 'Monthly monitoring'}</li>
                        <li>Regular effectiveness vs. risk assessment</li>
                        <li>Patient-reported outcome tracking</li>
                    </ul>
                </div>

                <div class="recommendation-box">
                    <h3>Risk Mitigation</h3>
                    <ul>
                        <li>${riskLevel.toLowerCase() === 'high' ? 'Consider dose reduction or alternative therapy' : riskLevel.toLowerCase() === 'medium' ? 'Optimize dosing regimen' : 'Continue current therapy with standard precautions'}</li>
                        <li>Consider dose optimization</li>
                        <li>Evaluate alternative therapies if needed</li>
                    </ul>
                </div>
            </div>

            <h2>📋 Follow-up Timeline</h2>
            <div class="timeline-section">
                <div class="timeline-item">
                    <div class="timeline-marker immediate"></div>
                    <div class="timeline-content">
                        <strong>Today:</strong> Patient counseling and baseline assessments
                    </div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-marker short-term"></div>
                    <div class="timeline-content">
                        <strong>${riskLevel.toLowerCase() === 'high' ? '1-3 Days' : riskLevel.toLowerCase() === 'medium' ? '1-2 Weeks' : '2-4 Weeks'}:</strong> First follow-up and monitoring
                    </div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-marker long-term"></div>
                    <div class="timeline-content">
                        <strong>Ongoing:</strong> Continuous monitoring and reassessment
                    </div>
                </div>
            </div>

            <div class="clinical-note">
                <p><strong>Clinical Note:</strong> This AI-powered analysis provides decision support based on statistical modeling. Clinical judgment should always supersede algorithmic recommendations.</p>
            </div>
        `;
    } catch (error) {
        console.error('Error generating detailed analysis:', error);
        return `
            <div class="error-message">
                <h3>⚠️ Analysis Generation Error</h3>
                <p>Unable to generate detailed analysis. Please try refreshing the page.</p>
            </div>
        `;
    }
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
// 
// Display formatted report function
function displayFormattedReport(reportText) {
    console.log('Displaying formatted report...');

    if (!reportContent) {
        console.error('Report content element not found');
        return;
    }

    if (!reportText) {
        console.error('No report text provided');
        reportContent.innerHTML = `
            <div class="report-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>No Report Content</h4>
                <p>The report was generated but contains no content.</p>
            </div>
        `;
        return;
    }

    // Convert markdown-style formatting to HTML
    let formattedReport = reportText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic text
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')             // H1 headers
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')            // H2 headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')           // H3 headers
        .replace(/^- (.*$)/gm, '<li>$1</li>')             // List items
        .replace(/\n\n/g, '</p><p>')                      // Paragraphs
        .replace(/\n/g, '<br>');                          // Line breaks

    // Wrap in paragraphs if not already wrapped
    if (!formattedReport.includes('<p>')) {
        formattedReport = '<p>' + formattedReport + '</p>';
    }

    // Wrap list items in ul tags
    formattedReport = formattedReport.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');

    // Display the formatted report
    reportContent.innerHTML = `
        <div class="clinical-report">
            <div class="report-header">
                <i class="fas fa-file-medical"></i>
                <h2>Clinical ADR Risk Assessment Report</h2>
                <div class="report-meta">
                    <span class="report-date">Generated: ${new Date().toLocaleString()}</span>
                    <span class="ai-badge">
                        <i class="fas fa-robot"></i> AI-Powered Analysis
                    </span>
                </div>
            </div>
            
            <div class="report-content">
                ${formattedReport}
            </div>
            
            <div class="report-actions">
                <button onclick="printReport()" class="btn btn-secondary">
                    <i class="fas fa-print"></i> Print Report
                </button>
                <button onclick="downloadReport()" class="btn btn-secondary">
                    <i class="fas fa-download"></i> Download PDF
                </button>
                <button onclick="generateClinicalReport()" class="btn btn-primary">
                    <i class="fas fa-redo"></i> Regenerate Report
                </button>
            </div>
        </div>
    `;

    // Show the report container
    if (reportContainer) {
        reportContainer.style.display = 'block';
        reportContainer.scrollIntoView({ behavior: 'smooth' });
    }

    console.log('Report displayed successfully');
}

// Show report loading function
function showReportLoading() {
    if (reportContent) {
        reportContent.innerHTML = `
            <div class="report-loading">
                <div class="loading-spinner"></div>
                <h3>Generating detailed clinical analysis using AI...</h3>
                <p>Please wait while we analyze the patient data and generate a comprehensive report.</p>
            </div>
        `;
    }

    if (reportContainer) {
        reportContainer.style.display = 'block';
    }
}

// Print report function
function printReport() {
    const reportContent = document.querySelector('.clinical-report');
    if (reportContent) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Clinical ADR Risk Assessment Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .clinical-report { max-width: 800px; margin: 0 auto; }
                        .report-header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                        .report-actions { display: none; }
                        h1, h2, h3 { color: #333; }
                        .ai-badge { background: #e3f2fd; padding: 5px 10px; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    ${reportContent.outerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// Download report function (placeholder)
function downloadReport() {
    showInfo('PDF download feature coming soon!');
}

// Display results function
function displayResults(result) {
    console.log('Displaying results:', result);

    const resultsContainer = document.getElementById('results-container');
    const resultsContent = document.getElementById('results-content');

    if (!resultsContainer || !resultsContent) {
        console.error('Results container elements not found');
        return;
    }

    // Show results container
    resultsContainer.style.display = 'block';

    // Generate results HTML
    const resultsHTML = generateResultsHTML(result);
    if (resultsContent) {
        resultsContent.innerHTML = resultsHTML;
    } else {
        console.error('❌ resultsContent is null, cannot set innerHTML');
    }

    // Trigger detailed clinical analysis
    setTimeout(() => {
        generateDetailedClinicalAnalysis(currentPatientData, result);
    }, 1000);

    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Generate results HTML
function generateResultsHTML(result) {
    const riskLevel = result.risk_level || 'Unknown';
    const predictedADR = result.predicted_adr_type || 'Unknown';
    const noADRProb = result.no_adr_probability || 0;
    const topRisks = result.top_adr_risks || {};
    const specificRisks = result.top_specific_adr_risks || {};

    // Risk level styling
    const getRiskColor = (level) => {
        switch (level.toLowerCase()) {
            case 'high': return '#dc2626';
            case 'medium': return '#d97706';
            case 'low': return '#059669';
            default: return '#6b7280';
        }
    };

    const getRiskBg = (level) => {
        switch (level.toLowerCase()) {
            case 'high': return '#fef2f2';
            case 'medium': return '#fffbeb';
            case 'low': return '#f0fdf4';
            default: return '#f9fafb';
        }
    };

    return `
        <div class="results-summary">
            <div class="risk-overview">
                <div class="risk-card main-risk" style="background: ${getRiskBg(riskLevel)}; border-left: 4px solid ${getRiskColor(riskLevel)};">
                    <div class="risk-header">
                        <h3 style="color: ${getRiskColor(riskLevel)};">Overall Risk Level</h3>
                        <div class="risk-badge ${riskLevel.toLowerCase()}" style="background: ${getRiskColor(riskLevel)}; color: white;">
                            ${riskLevel.toUpperCase()}
                        </div>
                    </div>
                    <div class="risk-details">
                        <div class="risk-probability">
                            <span class="prob-label">No ADR Probability:</span>
                            <span class="prob-value" style="color: ${getRiskColor(riskLevel)};">${noADRProb}%</span>
                        </div>
                        <div class="predicted-adr">
                            <span class="adr-label">Most Likely ADR:</span>
                            <span class="adr-value">${predictedADR}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="risk-breakdown">
                <h3><i class="fas fa-chart-pie"></i> Risk Breakdown</h3>
                <div class="risk-types-grid">
                    ${Object.entries(topRisks).slice(0, 4).map(([type, prob]) => `
                        <div class="risk-type-card">
                            <div class="risk-type-name">${type}</div>
                            <div class="risk-type-prob">${prob}%</div>
                            <div class="risk-type-bar">
                                <div class="risk-type-fill" style="width: ${prob}%; background: ${prob > 50 ? '#dc2626' : prob > 25 ? '#d97706' : '#059669'};"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${Object.keys(specificRisks).length > 0 ? `
                <div class="specific-adr-risks">
                    <h3><i class="fas fa-exclamation-triangle"></i> Specific ADR Type Risks</h3>
                    <div class="specific-risks-grid">
                        ${Object.entries(specificRisks).map(([type, prob]) => `
                            <div class="specific-risk-card">
                                <div class="specific-risk-name">${type}</div>
                                <div class="specific-risk-prob">${prob}%</div>
                                <div class="specific-risk-level ${prob > 15 ? 'high' : prob > 5 ? 'medium' : 'low'}">
                                    ${prob > 15 ? 'High Risk' : prob > 5 ? 'Medium Risk' : 'Low Risk'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="clinical-actions">
                <button id="generate-report-btn" class="btn btn-primary" onclick="generateClinicalReport()">
                    <i class="fas fa-file-medical"></i> Generate Clinical Report
                </button>
                <button onclick="showDetailedAnalysis()" class="btn btn-secondary">
                    <i class="fas fa-microscope"></i> View Detailed Analysis
                </button>
            </div>
        </div>
        
        <style>
            .results-summary { padding: 20px 0; }
            .risk-overview { margin-bottom: 30px; }
            .risk-card { padding: 20px; border-radius: 12px; margin-bottom: 15px; }
            .risk-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .risk-badge { padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
            .risk-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .prob-value, .adr-value { font-weight: 600; font-size: 1.1rem; }
            .risk-breakdown { margin-bottom: 30px; }
            .risk-types-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
            .risk-type-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .risk-type-name { font-weight: 600; margin-bottom: 8px; }
            .risk-type-prob { font-size: 1.2rem; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
            .risk-type-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
            .risk-type-fill { height: 100%; transition: width 0.5s ease; }
            .specific-adr-risks { margin-bottom: 30px; }
            .specific-risks-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px; }
            .specific-risk-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center; }
            .specific-risk-name { font-weight: 600; margin-bottom: 8px; }
            .specific-risk-prob { font-size: 1.4rem; font-weight: 700; margin-bottom: 8px; }
            .specific-risk-level { padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
            .specific-risk-level.high { background: #fef2f2; color: #dc2626; }
            .specific-risk-level.medium { background: #fffbeb; color: #d97706; }
            .specific-risk-level.low { background: #f0fdf4; color: #059669; }
            .clinical-actions { display: flex; gap: 15px; justify-content: center; margin-top: 30px; }
            
            @media (max-width: 768px) {
                .risk-details { grid-template-columns: 1fr; }
                .risk-types-grid, .specific-risks-grid { grid-template-columns: 1fr; }
                .clinical-actions { flex-direction: column; }
            }
        </style>
    `;
}

// Generate detailed clinical analysis using AI
async function generateDetailedClinicalAnalysis(patientData, predictionResult) {
    console.log('Generating detailed clinical analysis...');

    const analysisContainer = document.getElementById('ai-detailed-analysis-container');
    const analysisContent = document.getElementById('ai-detailed-content');

    if (!analysisContainer || !analysisContent) {
        console.error('AI analysis container elements not found');
        return;
    }

    // Show loading state
    analysisContent.innerHTML = `
        <div class="ai-analysis-loading">
            <div class="loading-spinner"></div>
            <p>Generating detailed clinical analysis using AI...</p>
        </div>
    `;

    try {
        // Prepare comprehensive data for AI analysis
        const analysisData = {
            patient_data: patientData,
            prediction_result: predictionResult,
            analysis_type: 'detailed_clinical',
            patient_name: patientInfo.name || 'Patient',
            patient_id: patientInfo.id || '',
            clinician_name: patientInfo.clinician || 'Clinician'
        };

        console.log('Sending detailed analysis request...');

        const response = await fetch('/generate_detailed_analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(analysisData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Detailed analysis generated:', result.model_based ? 'Model-based' : 'AI-generated');

        // Display the analysis
        displayDetailedAnalysis(result.analysis, result.model_based);

    } catch (error) {
        console.error('Error generating detailed analysis:', error);

        // Show fallback analysis
        const fallbackAnalysis = generateFallbackAnalysis(patientData, predictionResult);
        displayDetailedAnalysis(fallbackAnalysis);
    }
}

// Display detailed clinical analysis
function displayDetailedAnalysis(analysisText, isModelBased = false) {
    const analysisContent = document.getElementById('ai-analysis-content');

    if (!analysisContent) {
        console.error('Analysis content element not found');
        return;
    }

    // Format the analysis text
    let formattedAnalysis = analysisText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^# (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h4>$1</h4>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Wrap in paragraphs
    if (!formattedAnalysis.includes('<p>')) {
        formattedAnalysis = '<p>' + formattedAnalysis + '</p>';
    }

    // Wrap list items
    formattedAnalysis = formattedAnalysis.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');

    analysisContent.innerHTML = `
        <div class="detailed-analysis-content">
            ${formattedAnalysis}
            
            <div class="analysis-actions">
                <button onclick="regenerateAnalysis()" class="btn btn-secondary">
                    <i class="fas fa-redo"></i> Regenerate Analysis
                </button>
                <button onclick="exportAnalysis()" class="btn btn-secondary">
                    <i class="fas fa-download"></i> Export Analysis
                </button>
            </div>
        </div>
        
        <style>
            .detailed-analysis-content { 
                background: white; 
                padding: 25px; 
                border-radius: 12px; 
                border: 1px solid #e5e7eb;
                line-height: 1.6;
            }
            .detailed-analysis-content h3 { 
                color: #1f2937; 
                margin: 20px 0 10px 0; 
                padding-bottom: 8px;
                border-bottom: 2px solid #e5e7eb;
            }
            .detailed-analysis-content h
                color: #374151; 
                margin: 15px 0 8px 0; 
            }
            .detailed-analysis-content p { 
                margin: 12px 0; 
                color: #4b5563;
            }
            .detailed-analysis-content ul { 
                margin: 12px 0; 
                padding-left: 20px; 
            }
            .detailed-analysis-content li { 
                margin: 6px 0; 
                color: #4b5563;
            }
            .analysis-actions { 
                margin-top: 25px; 
                padding-top: 20px; 
                border-top: 1px solid #e5e7eb;
                display: flex; 
                gap: 10px; 
                justify-content: center;
            }
            
            @media (max-width: 768px) {
                .detailed-analysis-content { padding: 15px; }
                .analysis-actions { flex-direction: column; }
            }
        </style>
    `;
}

// Generate fallback analysis when AI is not available
function generateFallbackAnalysis(patientData, predictionResult) {
    const riskLevel = predictionResult.risk_level || 'Unknown';
    const predictedADR = predictionResult.predicted_adr_type || 'Unknown';
    const noADRProb = predictionResult.no_adr_probability || 0;

    return `
# Detailed Clinical Analysis

## Risk Assessment Summary
The patient presents with a **${riskLevel}** risk profile for adverse drug reactions, with a ${noADRProb}% probability of no ADR occurrence.

## mary Risk Factors
- **Age**: ${patientData.age} years - ${patientData.age > 65 ? 'Increased risk due to advanced age' : 'Age within normal risk range'}
- **Renal Function**: eGFR ${patientData.egfr} mL/min/1.73m² - ${patientData.egfr < 60 ? 'Reduced renal function requiring dose adjustment' : 'Normal renal function'}
- **Hepatic Function**: ${patientData.ast_alt > 40 ? 'Elevated liver enzymes suggesting hepatic impairment' : 'Normal liver function parameters'}

## Predicted ADR Type: ${predictedADR}
${predictedADR !== 'No ADR' ? `
The model predicts **${predictedADR}** as the most likely adverse reaction type. This requires:
- Enhanced monitoring for specific symptoms
- Patient education on warning signs
- Appropriate intervention protocols
` : 'Low probability of adverse drug reactions with current medication regimen.'}

## Clinical Recommendations
- **Monitoring Frequency**: ${riskLevel === 'High' ? 'Weekly clinical assessments' : riskLevel === 'Medium' ? 'Bi-weekly follow-up' : 'Monthly monitoring'}
- **Laboratory Monitoring**: ${patientData.egfr < 60 || patientData.ast_alt > 40 ? 'Enhanced laboratory monitoring recommended' : 'Standard laboratory monitoring'}
- **Dose Adjustments**: ${riskLevel === 'High' ? 'Consider dose reduction or alternative therapy' : 'Continue current dosing with monitoring'}

## Patient Education Points
- Recognition of early warning signs
- When to contact healthcare provider
- Importance of medication adherence
- Regular follow-up appointments

---
*This analysis is generated using clinical decision support algorithms. Clinical judgment should always supersede algorithmic recommendations.*
    `;
}

// Regenerate analysis function
async function regenerateAnalysis() {
    if (currentPatientData && currentPredictionResult) {
        await generateDetailedClinicalAnalysis(currentPatientData, currentPredictionResult);
    }
}

// Export analysis function
function exportAnalysis() {
    const analysisContent = document.querySelector('.detailed-analysis-content');
    {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Detailed Clinical Analysis</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                        h3 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
                        h4 { color: #374151; }
                        .analysis-actions { display: none; }
                    </style>
                </head>
                <body>
                    <h1>Detailed Clinical Analysis</h1>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                    ${analysisContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// Show detailed analysis (for button click)
function showDetailedAnalysis() {
    const analysisContainer = document.getElementById('ai-detailed-analysis-container');
    if (analysisContainer) {
        analysisContainer.scrollIntoView({ behavior: 'smooth' });
    }
}// 
// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing application...');

    // Initialize DOM elements
    initializeDOMElements();

    // Initialize patient info
    initializePatientInfo();

    // Setup form handlers
    setupFormHandler();
    setupClearHandler();
    setupReportHandler();

    // Setup mobile navigation
    initializeMobileNavigation();

    // Setup quick actions
    initializeQuickActions();

    console.log('Application initialized successfully');
});

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

    console.log('DOM elements initialized');
}

// Setup BMI Calculation
function setupBMICalculation() {
    const heightField = document.getElementById('height');
    const weightField = document.getElementById('weight');

    if (heightField && weightField) {
        heightField.addEventListener('input', calculateBMI);
        weightField.addEventListener('input', calculateBMI);
    }
}

// Initialize mobile navigation
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
        document.body.style.overflow = 'hidden';
    }

    // Function to close sidebar
    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove('active');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
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

    // Close sidebar when clicking outside
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

// Initialize quick actions
function initializeQuickActions() {
    const loadSampleBtn = document.getElementById('load-sample-data');
    const clearFormBtn = document.getElementById('clear-form');
    const voiceInputBtn = document.getElementById('voice-input');
    const sampleSelector = document.getElementById('sample-data-selector');
    const sampleContainer = document.getElementById('sample-selector-container');

    // Load sample data
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', () => {
            if (sampleContainer && (sampleContainer.style.display === 'none' || !sampleContainer.style.display)) {
                sampleContainer.style.display = 'block';
            } else if (sampleContainer) {
                sampleContainer.style.display = 'none';
            }
        });
    }

    // Sample selector change
    if (sampleSelector) {
        sampleSelector.addEventListener('change', (e) => {
            if (e.target.value) {
                loadSampleData(e.target.value);
                if (sampleContainer) {
                    sampleContainer.style.display = 'none';
                }
            }
        });
    }

    // Clear form
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all form data?')) {
                if (form) {
                    form.reset();
                }
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

// Load sample data function (placeholder)
function loadSampleData(sampleType) {
    console.log('Loading sample data:', sampleType);
    showInfo(`Loading ${sampleType} sample data...`);

    // This would load actual sample data in a real implementation
    // For now, just show a message
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
                background: #dbeafe;
                color: #1e40af;
                padding: 15px 20px;
                border-radius: 10px;
                border-left: 4px solid #3b82f6;
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
                color: #1e40af;
                cursor: pointer;
                padding: 5px;
                margin-left: auto;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(infoDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (infoDiv.parentElement) {
            infoDiv.remove();
        }
    }, 3000);
}// Displa
// Display results function
function displayResults(result) {
    console.log('🎯 displayResults called with:', result);

    // Use global variables first, fallback to getElementById
    let resultsContainer = window.resultsContainer || document.getElementById('results-container');
    let resultsContent = window.resultsContent || document.getElementById('results-content');

    console.log('📦 Results container found:', !!resultsContainer);
    console.log('📄 Results content found:', !!resultsContent);

    if (!resultsContainer || !resultsContent) {
        console.error('❌ Results container elements not found');
        console.log('Available elements:', {
            'results-container': !!document.getElementById('results-container'),
            'results-content': !!document.getElementById('results-content'),
            'ai-detailed-analysis-container': !!document.getElementById('ai-detailed-analysis-container'),
            'ai-detailed-content': !!document.getElementById('ai-detailed-content')
        });
        
        // Try to create a temporary results display
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px; text-align: center;">
                <h3 style="color: #dc2626; margin-bottom: 10px;">⚠️ Display Error</h3>
                <p style="color: #7f1d1d;">Results container not found. Please refresh the page.</p>
                <button onclick="location.reload()" style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 4px; margin-top: 10px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
        document.body.appendChild(tempContainer);
        return;
    }

    console.log('✅ Showing results container...');
    // Show results container
    resultsContainer.style.display = 'block';

    // Generate results HTML
    console.log('🔧 Generating results HTML...');
    const resultsHTML = generateResultsHTML(result);
    if (resultsContent) {
        resultsContent.innerHTML = resultsHTML;
        console.log('✅ Results HTML set');
    } else {
        console.error('❌ resultsContent is null, cannot set innerHTML');
    }

    // Trigger detailed clinical analysis
    console.log('🤖 Triggering detailed analysis in 1 second...');
    setTimeout(() => {
        console.log('🚀 Starting detailed analysis...');
        generateDetailedClinicalAnalysis(currentPatientData, result);
    }, 1000);

    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
    console.log('✅ displayResults completed');
}

// Generate results HTML
function generateResultsHTML(result) {
    console.log('🔧 generateResultsHTML called with:', result);

    const riskLevel = result.risk_level || 'Unknown';
    const predictedADR = result.predicted_adr_type || 'Unknown';
    const noADRProb = result.no_adr_probability || 0;
    const topRisks = result.top_adr_risks || {};
    const specificRisks = result.top_specific_adr_risks || {};

    // Risk level styling
    const getRiskColor = (level) => {
        switch (level.toLowerCase()) {
            case 'high': return '#dc2626';
            case 'medium': return '#d97706';
            case 'low': return '#059669';
            default: return '#6b7280';
        }
    };

    const getRiskBg = (level) => {
        switch (level.toLowerCase()) {
            case 'high': return '#fef2f2';
            case 'medium': return '#fffbeb';
            case 'low': return '#f0fdf4';
            default: return '#f9fafb';
        }
    };

    const html = `
        <div class="results-summary">
            <div class="risk-overview">
                <div class="risk-card main-risk" style="background: ${getRiskBg(riskLevel)}; border-left: 4px solid ${getRiskColor(riskLevel)};">
                    <div class="risk-header">
                        <h3 style="color: ${getRiskColor(riskLevel)};">Overall Risk Level</h3>
                        <div class="risk-badge ${riskLevel.toLowerCase()}" style="background: ${getRiskColor(riskLevel)}; color: white;">
                            ${riskLevel.toUpperCase()}
                        </div>
                    </div>
                    <div class="risk-details">
                        <div class="risk-probability">
                            <span class="prob-label">No ADR Probability:</span>
                            <span class="prob-value" style="color: ${getRiskColor(riskLevel)};">${noADRProb}%</span>
                        </div>
                        <div class="predicted-adr">
                            <span class="adr-label">Most Likely ADR:</span>
                            <span class="adr-value">${predictedADR}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="risk-breakdown">
                <h3><i class="fas fa-chart-pie"></i> Risk Breakdown</h3>
                <div class="risk-types-grid">
                    ${Object.entries(topRisks).slice(0, 4).map(([type, prob]) => `
                        <div class="risk-type-card">
                            <div class="risk-type-name">${type}</div>
                            <div class="risk-type-prob">${prob}%</div>
                            <div class="risk-type-bar">
                                <div class="risk-type-fill" style="width: ${prob}%; background: ${prob > 50 ? '#dc2626' : prob > 25 ? '#d97706' : '#059669'};"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${Object.keys(specificRisks).length > 0 ? `
                <div class="specific-adr-risks">
                    <h3><i class="fas fa-exclamation-triangle"></i> Specific ADR Type Risks</h3>
                    <div class="specific-risks-grid">
                        ${Object.entries(specificRisks).map(([type, prob]) => `
                            <div class="specific-risk-card">
                                <div class="specific-risk-name">${type}</div>
                                <div class="specific-risk-prob">${prob}%</div>
                                <div class="specific-risk-level ${prob > 15 ? 'high' : prob > 5 ? 'medium' : 'low'}">
                                    ${prob > 15 ? 'High Risk' : prob > 5 ? 'Medium Risk' : 'Low Risk'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="clinical-actions">
                <button id="generate-report-btn" class="btn btn-primary" onclick="generateClinicalReport()">
                    <i class="fas fa-file-medical"></i> Generate Clinical Report
                </button>
                <button onclick="showDetailedAnalysis()" class="btn btn-secondary">
                    <i class="fas fa-microscope"></i> View Detailed Analysis
                </button>
            </div>
        </div>
        
        <style>
            .results-summary { padding: 20px 0; }
            .risk-overview { margin-bottom: 30px; }
            .risk-card { padding: 20px; border-radius: 12px; margin-bottom: 15px; }
            .risk-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .risk-badge { padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
            .risk-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .prob-value, .adr-value { font-weight: 600; font-size: 1.1rem; }
            .risk-breakdown { margin-bottom: 30px; }
            .risk-types-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
            .risk-type-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .risk-type-name { font-weight: 600; margin-bottom: 8px; }
            .risk-type-prob { font-size: 1.2rem; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
            .risk-type-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
            .risk-type-fill { height: 100%; transition: width 0.5s ease; }
            .specific-adr-risks { margin-bottom: 30px; }
            .specific-risks-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px; }
            .specific-risk-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center; }
            .specific-risk-name { font-weight: 600; margin-bottom: 8px; }
            .specific-risk-prob { font-size: 1.4rem; font-weight: 700; margin-bottom: 8px; }
            .specific-risk-level { padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
            .specific-risk-level.high { background: #fef2f2; color: #dc2626; }
            .specific-risk-level.medium { background: #fffbeb; color: #d97706; }
            .specific-risk-level.low { background: #f0fdf4; color: #059669; }
            .clinical-actions { display: flex; gap: 15px; justify-content: center; margin-top: 30px; }
            
            @media (max-width: 768px) {
                .risk-details { grid-template-columns: 1fr; }
                .risk-types-grid, .specific-risks-grid { grid-template-columns: 1fr; }
                .clinical-actions { flex-direction: column; }
            }
        </style>
    `;

    console.log('✅ Results HTML generated');
    return html;
}

// DOM Initialization - Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Initializing application...');
    
    try {
        // Initialize DOM elements
        initializeDOMElements();
        console.log('✅ DOM elements initialized');
        
        // Initialize patient info
        initializePatientInfo();
        console.log('✅ Patient info initialized');
        
        // Setup form handlers
        setupFormHandler();
        setupClearHandler();
        setupReportHandler();
        console.log('✅ Form handlers setup');
        
        // Initialize mobile navigation
        initializeMobileNavigation();
        console.log('✅ Mobile navigation initialized');
        
        // Initialize quick actions
        initializeQuickActions();
        console.log('✅ Quick actions initialized');
        
        console.log('🎉 Application initialization complete!');
        
    } catch (error) {
        console.error('❌ Error during initialization:', error);
        showError('Application initialization failed. Please refresh the page.');
    }
});

// Backup initialization for older browsers
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded
    initializeApp();
}

function initializeApp() {
    console.log('🔄 Backup initialization triggered');
    if (!document.getElementById('adr-form')) {
        console.log('⏳ Waiting for DOM elements...');
        setTimeout(initializeApp, 100);
        return;
    }
    
    try {
        initializeDOMElements();
        initializePatientInfo();
        setupFormHandler();
        setupClearHandler();
        setupReportHandler();
        initializeMobileNavigation();
        initializeQuickActions();
        console.log('✅ Backup initialization complete');
    } catch (error) {
        console.error('❌ Backup initialization error:', error);
    }
}
// Utility functions for field analysis
// Assess field risk level
function assessFieldRisk(fieldName, value) {
    const riskAssessments = {
        'age': (val) => val > 70 ? 'high' : val > 50 ? 'medium' : 'low',
        'bmi': (val) => val > 30 ? 'high' : val > 25 ? 'medium' : val < 18.5 ? 'medium' : 'low',
        'bp_systolic': (val) => val > 160 ? 'high' : val > 140 ? 'medium' : 'low',
        'bp_diastolic': (val) => val > 100 ? 'high' : val > 90 ? 'medium' : 'low',
        'heart_rate': (val) => val > 100 || val < 60 ? 'medium' : 'low',
        'diabetes': (val) => val === 1 ? 'medium' : 'low',
        'liver_disease': (val) => val === 1 ? 'high' : 'low',
        'ckd': (val) => val === 1 ? 'high' : 'low',
        'cardiac_disease': (val) => val === 1 ? 'medium' : 'low'
    };

    return riskAssessments[fieldName] ? riskAssessments[fieldName](value) : 'low';
}

// Get field interpretation
function getFieldInterpretation(fieldName, value) {
    const interpretations = {
        'age': (val) => val > 70 ? 'Advanced age increases ADR risk' : val > 50 ? 'Moderate age-related risk' : 'Low age-related risk',
        'bmi': (val) => val > 30 ? 'Obesity may affect drug metabolism' : val > 25 ? 'Overweight - monitor dosing' : val < 18.5 ? 'Underweight - consider dose adjustment' : 'Normal BMI',
        'bp_systolic': (val) => val > 160 ? 'Severe hypertension - high cardiovascular risk' : val > 140 ? 'Hypertension present' : 'Normal blood pressure',
        'bp_diastolic': (val) => val > 100 ? 'Severe diastolic hypertension' : val > 90 ? 'Diastolic hypertension' : 'Normal diastolic pressure',
        'heart_rate': (val) => val > 100 ? 'Tachycardia present' : val < 60 ? 'Bradycardia present' : 'Normal heart rate',
        'diabetes': (val) => val === 1 ? 'Diabetes increases ADR risk and affects drug metabolism' : 'No diabetes',
        'liver_disease': (val) => val === 1 ? 'Liver disease significantly increases hepatotoxicity risk' : 'No liver disease',
        'ckd': (val) => val === 1 ? 'Kidney disease increases nephrotoxicity risk' : 'No kidney disease',
        'cardiac_disease': (val) => val === 1 ? 'Cardiac disease increases cardiovascular ADR risk' : 'No cardiac disease'
    };

    return interpretations[fieldName] ? interpretations[fieldName](value) : 'Normal range';
}

// Assess laboratory risk
function assessLabRisk(fieldName, value) {
    const labRisks = {
        'creatinine': (val) => val > 2.0 ? 'high' : val > 1.5 ? 'medium' : 'low',
        'egfr': (val) => val < 30 ? 'high' : val < 60 ? 'medium' : 'low',
        'ast_alt': (val) => val > 200 ? 'high' : val > 80 ? 'medium' : 'low',
        'bilirubin': (val) => val > 3.0 ? 'high' : val > 1.5 ? 'medium' : 'low',
        'albumin': (val) => val < 2.5 ? 'high' : val < 3.0 ? 'medium' : 'low',
        'hemoglobin': (val) => val < 8.0 ? 'high' : val < 10.0 ? 'medium' : 'low',
        'wbc_count': (val) => val > 15.0 || val < 3.0 ? 'high' : val > 12.0 || val < 4.0 ? 'medium' : 'low',
        'platelet_count': (val) => val < 100 ? 'high' : val < 150 ? 'medium' : 'low'
    };

    return labRisks[fieldName] ? labRisks[fieldName](value) : 'low';
}

// Get lab status
function getLabStatus(fieldName, value) {
    const risk = assessLabRisk(fieldName, value);
    return risk === 'high' ? 'Critical' : risk === 'medium' ? 'Abnormal' : 'Normal';
}

// Get lab interpretation
function getLabInterpretation(fieldName, value) {
    const interpretations = {
        'creatinine': (val) => val > 2.0 ? 'Severe kidney impairment - high nephrotoxicity risk' : val > 1.5 ? 'Moderate kidney impairment' : 'Normal kidney function',
        'egfr': (val) => val < 30 ? 'Severe kidney disease - dose adjustment required' : val < 60 ? 'Moderate kidney disease' : 'Normal kidney function',
        'ast_alt': (val) => val > 200 ? 'Severe liver dysfunction - high hepatotoxicity risk' : val > 80 ? 'Elevated liver enzymes' : 'Normal liver function',
        'bilirubin': (val) => val > 3.0 ? 'Severe hyperbilirubinemia' : val > 1.5 ? 'Elevated bilirubin' : 'Normal bilirubin',
        'albumin': (val) => val < 2.5 ? 'Severe hypoalbuminemia - affects drug binding' : val < 3.0 ? 'Mild hypoalbuminemia' : 'Normal albumin',
        'hemoglobin': (val) => val < 8.0 ? 'Severe anemia' : val < 10.0 ? 'Moderate anemia' : 'Normal hemoglobin',
        'wbc_count': (val) => val > 15.0 ? 'Leukocytosis - possible infection' : val < 3.0 ? 'Leukopenia - immunosuppression risk' : 'Normal WBC count',
        'platelet_count': (val) => val < 100 ? 'Thrombocytopenia - bleeding risk' : val < 150 ? 'Low platelets' : 'Normal platelet count'
    };

    return interpretations[fieldName] ? interpretations[fieldName](value) : 'Within normal limits';
}

// Get interaction risk description
function getInteractionRiskDescription(interaction) {
    const descriptions = {
        'Major': 'Significant interaction risk - close monitoring required',
        'Moderate': 'Moderate interaction risk - monitor for effects',
        'Minor': 'Minor interaction risk - routine monitoring',
        'None': 'No significant interactions identified'
    };
    return descriptions[interaction] || 'Unknown interaction level';
}

// Get lab monitoring frequency
function getLabMonitoringFrequency(riskLevel, patientData) {
    if (patientData.liver_disease === 1) return 'Liver function tests every 1-2 weeks initially';
    if (patientData.ckd === 1) return 'Kidney function tests every 1-2 weeks initially';
    
    return riskLevel === 'High' ? 'Weekly laboratory monitoring initially' : 
           riskLevel === 'Medium' ? 'Bi-weekly laboratory monitoring' : 
           'Monthly laboratory monitoring';
}

// Get clinical monitoring frequency
function getClinicalMonitoringFrequency(riskLevel) {
    return riskLevel === 'High' ? 'Daily clinical assessment for first week' :
           riskLevel === 'Medium' ? 'Weekly clinical assessment for first month' :
           'Bi-weekly clinical assessment';
}

// Get dose mitigation advice
function getDoseMitigationAdvice(patientData) {
    if (patientData.liver_disease === 1) return 'Consider dose reduction due to liver impairment';
    if (patientData.ckd === 1) return 'Dose adjustment required for kidney impairment';
    if (patientData.age > 70) return 'Consider dose reduction for elderly patient';
    return 'Standard dosing appropriate with monitoring';
}

// Get specific mitigation advice
function getSpecificMitigationAdvice(predictedADR) {
    const advice = {
        'Hepatotoxicity': 'Implement hepatoprotective measures and avoid hepatotoxic drugs',
        'Nephrotoxicity': 'Ensure adequate hydration and avoid nephrotoxic agents',
        'Cardiovascular Event': 'Monitor cardiac function and blood pressure closely',
        'Hypersensitivity': 'Have emergency medications available and educate on signs'
    };
    return advice[predictedADR] || 'Implement general safety measures';
}

// Get short-term timing
function getShortTermTiming(riskLevel) {
    return riskLevel === 'High' ? '24-48 hours' :
           riskLevel === 'Medium' ? '3-7 days' :
           '1-2 weeks';
}

// Generate monitoring parameters
function generateMonitoringParameters(patientData) {
    const parameters = [];
    
    if (patientData.liver_disease === 1 || patientData.ast_alt > 80) {
        parameters.push({ name: 'Liver Function', icon: 'fas fa-liver', frequency: 'Weekly' });
    }
    
    if (patientData.ckd === 1 || patientData.creatinine > 1.5) {
        parameters.push({ name: 'Kidney Function', icon: 'fas fa-kidneys', frequency: 'Weekly' });
    }
    
    if (patientData.cardiac_disease === 1) {
        parameters.push({ name: 'Cardiac Function', icon: 'fas fa-heartbeat', frequency: 'Bi-weekly' });
    }
    
    parameters.push({ name: 'Vital Signs', icon: 'fas fa-thermometer-half', frequency: 'Each visit' });
    parameters.push({ name: 'Symptom Assessment', icon: 'fas fa-clipboard-list', frequency: 'Each visit' });
    
    return parameters.map(param => `
        <div class="parameter-card">
            <div class="param-icon"><i class="${param.icon}"></i></div>
            <div class="param-content">
                <h6>${param.name}</h6>
                <p>${param.frequency}</p>
            </div>
        </div>
    `).join('');
}