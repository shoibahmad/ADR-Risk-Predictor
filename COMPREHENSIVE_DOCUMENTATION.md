# ADR Risk Predictor - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Design](#architecture--design)
3. [Installation & Setup](#installation--setup)
4. [File Structure](#file-structure)
5. [Backend Components](#backend-components)
6. [Frontend Components](#frontend-components)
7. [Machine Learning Model](#machine-learning-model)
8. [API Documentation](#api-documentation)
9. [Database & Data Management](#database--data-management)
10. [AI Integration](#ai-integration)
11. [Security & Validation](#security--validation)
12. [Deployment](#deployment)
13. [Testing](#testing)
14. [Troubleshooting](#troubleshooting)
15. [Development Guidelines](#development-guidelines)

---

## Project Overview

### Purpose
The ADR Risk Predictor is a comprehensive clinical decision support system designed to assess the risk of Adverse Drug Reactions (ADRs) in patients using machine learning algorithms and AI-powered clinical analysis.

### Key Features
- **Multi-class ADR Risk Prediction**: Predicts 16+ different types of adverse drug reactions
- **AI-Powered Clinical Reports**: Uses Google Gemini AI for comprehensive clinical analysis
- **Flexible Input System**: Allows partial data entry with intelligent defaults
- **Real-time Risk Assessment**: Instant calculations with detailed probability breakdowns
- **Responsive Medical UI**: Professional interface optimized for clinical workflows
- **Comprehensive Patient Profiles**: Supports demographics, labs, comorbidities, medications, and pharmacogenomics

### Target Users
- Healthcare Professionals
- Clinical Researchers
- Medical Students
- Healthcare IT Developers
- Pharmacovigilance Teams

---

## Architecture & Design

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (HTML/JS/CSS) │◄──►│   (Flask/Python)│◄──►│   (Gemini AI)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   ML Model      │
                       │   (scikit-learn)│
                       └─────────────────┘
```

### Technology Stack

#### Backend Technologies
- **Flask 2.3+**: Web framework for Python
- **scikit-learn 1.3+**: Machine learning library
- **pandas 2.0+**: Data manipulation and analysis
- **numpy 1.24+**: Numerical computing
- **joblib 1.3+**: Model serialization
- **google-generativeai**: Gemini AI integration
- **gunicorn**: WSGI HTTP Server

#### Frontend Technologies
- **HTML5**: Semantic markup
- **CSS3**: Responsive styling with Flexbox/Grid
- **JavaScript ES6+**: Interactive functionality
- **Font Awesome 6.0**: Medical icons
- **Google Fonts**: Professional typography

#### Development Tools
- **Python 3.11**: Programming language
- **Git**: Version control
- **VS Code**: Development environment---


## Installation & Setup

### Prerequisites
- Python 3.11 or higher
- pip package manager
- 4GB+ RAM (for model training)
- Internet connection (for AI features)

### Step-by-Step Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd adr-risk-predictor
```

#### 2. Create Virtual Environment
```bash
# Windows
python -m venv myenv
myenv\Scripts\activate

# macOS/Linux
python3 -m venv myenv
source myenv/bin/activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Generate Training Data
```bash
python data_generator.py
```

#### 5. Train Machine Learning Model
```bash
python model_trainer.py
```

#### 6. Start Application
```bash
# Development server
python debug_server.py

# Production server
python app.py
```

### Environment Configuration

#### Required Environment Variables
```bash
# Optional: Custom Gemini API key
GEMINI_API_KEY=your_api_key_here

# Optional: Custom port
PORT=5000

# Optional: Debug mode
FLASK_DEBUG=True
```

---

## File Structure

### Root Directory
```
ADR-Risk-Predictor/
├── 📁 __pycache__/           # Python cache files
├── 📁 .git/                 # Git repository data
├── 📁 .vscode/              # VS Code settings
├── 📁 myenv/                # Virtual environment
├── 📁 static/               # Frontend assets
├── 📁 templates/            # HTML templates
├── 📄 .env                  # Environment variables
├── 📄 .gitignore           # Git ignore rules
├── 📄 adr_model.pkl        # Trained ML model
├── 📄 adr_preprocessor.pkl # Data preprocessor
├── 📄 app.py               # Main Flask application
├── 📄 build.sh             # Build script
├── 📄 check_models.py      # Gemini model checker
├── 📄 clinical_data.csv    # Training dataset
├── 📄 data_generator.py    # Data generation script
├── 📄 debug_server.py      # Development server
├── 📄 FIXES_SUMMARY.md     # Recent fixes documentation
├── 📄 LAB_INTERPRETATION_GUIDE.md # Clinical reference
├── 📄 model_trainer.py     # ML model training
├── 📄 patient_assessments.json # Patient data storage
├── 📄 Procfile            # Deployment configuration
├── 📄 README.md           # Project overview
├── 📄 render.yaml         # Render deployment config
├── 📄 requirements*.txt   # Python dependencies
├── 📄 runtime.txt         # Python version
└── 📄 test_gemini.py      # AI testing script
```### Stati
c Assets Structure
```
static/
├── 📁 css/
│   └── 📄 style.css         # Main stylesheet (responsive design)
├── 📁 js/
│   ├── 📄 script.js         # Main JavaScript functionality
│   └── 📄 detailed_analysis.js # Advanced analysis features
└── 📄 manifest.json         # Web app manifest
```

### Templates Structure
```
templates/
├── 📄 index.html           # Main assessment form
├── 📄 loading.html         # Loading page
├── 📄 patient_details.html # Patient management
└── 📄 welcome.html         # Landing page
```

---

## Backend Components

### Core Application Files

#### app.py - Main Flask Application
**Purpose**: Production-ready Flask server with core functionality
**Key Features**:
- RESTful API endpoints
- Model loading and prediction
- AI report generation
- Error handling and logging
- CORS support for cross-origin requests

**Main Routes**:
```python
@app.route('/')                    # Landing page
@app.route('/assessment')          # Main assessment form
@app.route('/patient-details')     # Patient management
@app.route('/predict', methods=['POST'])        # ML prediction
@app.route('/generate_report', methods=['POST']) # AI reports
@app.route('/health')              # Health check
```

#### debug_server.py - Development Server
**Purpose**: Enhanced development server with detailed logging
**Additional Features**:
- Comprehensive debug logging
- Enhanced error messages
- Development-specific endpoints
- Detailed request/response tracking

**Debug Features**:
```python
@app.route('/debug')               # Debug information
@app.route('/test_gemini')         # AI connectivity test
@app.route('/test_report')         # Report generation test
```

#### data_generator.py - Synthetic Data Creation
**Purpose**: Generates realistic clinical training data
**Key Components**:
- Patient demographics simulation
- Clinical parameter generation
- Comorbidity modeling
- Drug interaction simulation
- ADR outcome calculation

**Data Generation Process**:
1. **Demographics**: Age, sex, ethnicity, BMI
2. **Clinical Labs**: Creatinine, eGFR, liver function
3. **Comorbidities**: Age-dependent disease modeling
4. **Medications**: Dosing and interaction patterns
5. **Genomics**: CYP enzyme status simulation
6. **ADR Outcomes**: Risk-based ADR type assignment##
## model_trainer.py - Machine Learning Pipeline
**Purpose**: Trains and validates the ADR prediction model
**Key Components**:
- Data preprocessing pipeline
- Feature engineering
- Model training and validation
- Performance evaluation
- Model serialization

**Training Process**:
```python
# 1. Data Loading
df = pd.read_csv('clinical_data.csv')

# 2. Feature Selection
X = df.drop(columns=['time_to_adr_days', 'adr_outcome', 'adr_type'])
y = df['adr_type']

# 3. Preprocessing Pipeline
preprocessor = ColumnTransformer([
    ('num', StandardScaler(), numerical_features),
    ('cat', OneHotEncoder(), categorical_features)
])

# 4. Model Training
model = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', LogisticRegression(multi_class='multinomial'))
])

# 5. Model Evaluation and Saving
model.fit(X_train, y_train)
joblib.dump(model, 'adr_model.pkl')
```

---

## Frontend Components

### HTML Templates

#### index.html - Main Assessment Interface
**Purpose**: Primary patient assessment form
**Key Sections**:

1. **Header Information**
   - Patient ID generation
   - Assessment timestamp
   - Clinician information

2. **Demographics Section**
   - Age, sex, ethnicity
   - Height, weight, BMI calculation
   - Real-time BMI categorization

3. **Laboratory Values Section**
   - Renal function (creatinine, eGFR)
   - Liver function (AST/ALT, bilirubin, albumin)
   - Interactive lab interpretation

4. **Comorbidities Section**
   - Checkbox grid for medical conditions
   - Diabetes, liver disease, CKD, cardiac disease
   - Hypertension, respiratory, neurological conditions

5. **Medication Profile Section**
   - Primary medication and dosing
   - Concomitant drug management
   - Drug-drug interaction assessment
   - Treatment duration tracking

6. **Pharmacogenomics Section**
   - CYP2C9 metabolizer status
   - CYP2D6 metabolizer status
   - Genetic risk factors

7. **Clinical Parameters Section**
   - Vital signs (BP, heart rate)
   - Risk flags and indicators
   - Treatment context information#### pa
tient_details.html - Patient Management
**Purpose**: View and manage patient assessment history
**Features**:
- Patient list with search/filter
- Assessment history tracking
- Detailed patient profiles
- Export capabilities

#### welcome.html - Landing Page
**Purpose**: Application introduction and navigation
**Features**:
- Feature overview
- Quick start guide
- Navigation to assessment tools

#### loading.html - Loading Interface
**Purpose**: Loading states during processing
**Features**:
- Animated loading indicators
- Progress feedback
- User guidance during waits

### CSS Styling (style.css)

#### Design Principles
- **Medical-Grade UI**: Professional healthcare interface
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized for clinical workflows

#### Key Style Components

1. **Color Palette**
```css
:root {
    --medical-primary: #667eea;
    --medical-secondary: #764ba2;
    --medical-success: #10b981;
    --medical-warning: #f59e0b;
    --medical-danger: #ef4444;
    --medical-info: #3b82f6;
}
```

2. **Typography**
```css
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 16px;
    line-height: 1.6;
}
```

3. **Layout System**
```css
.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
}
```

4. **Responsive Breakpoints**
```css
/* Mobile: < 768px */
/* Tablet: 768px - 1024px */
/* Desktop: > 1024px */
```

### JavaScript Functionality (script.js)

#### Core Functions

1. **Form Management**
```javascript
// Form initialization
function initializeDOMElements()
function setupFormHandler()
function setupClearHandler()

// Validation
function validateFormWithFeedback()
function checkSectionCompletion()
```

2. **Data Processing**
```javascript
// BMI calculation
function calculateBMI()
function updateBMIDisplay()

// Sample data loading
function loadSampleData(type)
function initializeQuickActions()
```

3. **API Communication**
```javascript
// Prediction requests
async function submitPrediction(patientData)

// Report generation
async function generateClinicalReport()
async function generateDetailedAnalysis()
```

4. **UI Interactions**
```javascript
// Results display
function displayResults(result)
function displayFormattedReport(report)

// Notifications
function showSuccess(message)
function showError(message)
function showLoading()
```