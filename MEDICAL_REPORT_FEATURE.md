# Medical Report Feature Documentation

## Overview
A comprehensive medical report template has been added to the ADR Risk Predictor system. This feature allows healthcare professionals to generate, view, and download properly formatted medical reports containing all assessment data, results, and AI analysis.

## Features

### 1. **Professional Medical Report Template**
- Hospital/clinic header with logo
- Patient information section
- Clinical parameters table with normal range indicators
- Medication details
- Comorbidities and medical history
- Risk assessment with visual indicators
- Specific ADR type predictions
- Gemini AI clinical analysis
- Clinical recommendations
- Monitoring and follow-up plan
- Signature sections for physicians and pharmacists

### 2. **Download Functionality**
- **PDF Download**: Generate a professional PDF report using html2pdf.js
- **Print Option**: Direct browser printing with optimized print styles
- Automatic filename generation with patient name and date

### 3. **Data Integration**
- Automatically pulls data from the assessment form
- Includes all prediction results
- Displays Gemini AI analysis
- Shows clinical recommendations

## How to Use

### For Users:
1. Complete the patient assessment form
2. Submit the form and wait for results
3. Click the **"View/Download Medical Report"** button in the results section
4. The medical report opens in a new tab
5. Use the **"Download PDF"** button to save the report
6. Or use the **"Print Report"** button for direct printing

### For Developers:

#### New Files Created:
- `templates/medical_report.html` - Main medical report template

#### Modified Files:
- `app.py` - Added `/medical-report` route
- `templates/index.html` - Added button and JavaScript functions

#### Key Functions:

**In index.html:**
```javascript
function openMedicalReport() {
    // Stores assessment data and prediction results in sessionStorage
    // Opens medical report in new tab
}
```

**In medical_report.html:**
```javascript
function downloadPDF() {
    // Generates PDF using html2pdf.js library
    // Saves with formatted filename
}
```

## Technical Details

### Dependencies:
- **html2pdf.js** (v0.10.1) - For PDF generation
- **Font Awesome** (v6.0.0) - For icons
- **Google Fonts (Inter)** - For typography

### Data Flow:
1. User completes assessment → Data stored in form
2. Prediction made → Results stored in `window.currentPredictionResult`
3. User clicks report button → Data saved to `sessionStorage`
4. Medical report page loads → Reads from `sessionStorage`
5. Report populated with all data → Ready for download/print

### Storage Keys:
- `assessmentData` - Form input data
- `predictionResults` - ML model and AI analysis results
- `patientName`, `patientId`, `clinicianName`, etc. - Individual patient details

## Customization

### Styling:
The report uses a clean, professional medical document style with:
- White background for print compatibility
- Color-coded risk indicators (Red/Yellow/Green)
- Responsive design for mobile viewing
- Print-optimized CSS

### Branding:
To customize the hospital/clinic information, edit the `hospital-info` section in `medical_report.html`:
```html
<div class="hospital-details">
    <h1>Your Hospital Name</h1>
    <p>Your Department</p>
</div>
```

## Future Enhancements
- Digital signature integration
- QR code for report verification
- Multi-language support
- Email report functionality
- Cloud storage integration
- Report history and archiving

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Responsive design supported

## Notes
- Reports are generated client-side for privacy
- No data is sent to external servers during PDF generation
- All patient data remains in the browser session
- Clear session storage to remove sensitive data after use
