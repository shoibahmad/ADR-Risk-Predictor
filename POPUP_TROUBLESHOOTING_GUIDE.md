# High Risk ADR Popup Troubleshooting Guide

## 🚨 Issue: Popup not appearing on main index.html page

### 🔍 Debugging Steps

#### 1. **Check Browser Console**
Open your browser's Developer Tools (F12) and check the Console tab for any JavaScript errors:

```javascript
// Expected console messages when high risk is detected:
🎯 Risk level detected: high from result: High
🚨 HIGH RISK ADR DETECTED - Triggering warning system
🔍 Available functions: {showHighRiskWarningOverlay: "function", ...}
⏰ Timeout triggered - calling warning functions
📞 Calling showHighRiskWarningOverlay()
🚨 showHighRiskWarningOverlay() called
📞 Calling showHighRiskMedicalSuggestionsPopup()
🏥 showHighRiskMedicalSuggestionsPopup() called with result: {...}
```

#### 2. **Test Function Availability**
In the browser console, run this command to check if functions are loaded:
```javascript
console.log('Function check:', {
    generateHighRiskADRWarning: typeof generateHighRiskADRWarning,
    showHighRiskWarningOverlay: typeof showHighRiskWarningOverlay,
    showHighRiskMedicalSuggestionsPopup: typeof showHighRiskMedicalSuggestionsPopup,
    playWarningNotification: typeof playWarningNotification
});
```

#### 3. **Manual Test**
Use the "Test Warning" button I added to the main form, or run this in console:
```javascript
testHighRiskWarning();
```

#### 4. **Check Script Loading**
Verify that all JavaScript files are loading properly:
```javascript
// In browser console:
console.log('ADR Warning test:', window.testADRWarning ? window.testADRWarning() : 'Not loaded');
```

### 🛠️ Common Issues and Solutions

#### Issue 1: JavaScript Files Not Loading
**Symptoms:** Functions are `undefined`
**Solution:** 
- Check that `static/js/adr-warning.js` exists
- Verify Flask static file serving is working
- Check browser Network tab for 404 errors

#### Issue 2: Script Loading Order
**Symptoms:** Functions exist but don't work properly
**Solution:** 
- Ensure `adr-warning.js` loads before `script.js`
- Check the order in `templates/index.html`:
```html
<script src="{{ url_for('static', filename='js/script.js') }}"></script>
<script src="{{ url_for('static', filename='js/detailed_analysis.js') }}"></script>
<script src="{{ url_for('static', filename='js/adr-warning.js') }}"></script>
```

#### Issue 3: Risk Level Not Detected as High
**Symptoms:** No warning triggers despite high-risk patient data
**Solution:**
- Check the prediction result in console
- Verify `result.risk_level` is exactly `'High'` (case-sensitive)
- Check the risk calculation logic in `debug_server.py`

#### Issue 4: CSS Styles Not Applied
**Symptoms:** Popup appears but looks broken
**Solution:**
- Check that `static/css/style.css` includes the high-risk warning styles
- Verify CSS is loading properly
- Check for CSS conflicts

### 🧪 Testing Methods

#### Method 1: Use Test Button
1. Go to the main assessment page (`/assessment`)
2. Click the red "Test Warning" button
3. Should immediately show overlay and popup

#### Method 2: Use Standalone Test Page
1. Open `test_popup.html` in browser
2. Click "Test High Risk Warning" button
3. Check console for detailed logging

#### Method 3: Use Demo Page
1. Go to `/high-risk-demo`
2. Click "High Risk ADR" button
3. Should show full warning system

#### Method 4: Manual Console Test
```javascript
// Run in browser console:
const mockResult = {
    risk_level: 'High',
    predicted_adr_type: 'Hepatotoxicity',
    no_adr_probability: 15,
    top_specific_adr_risks: {
        'Hepatotoxicity': 25.8,
        'Nephrotoxicity': 18.3,
        'Cardiotoxicity': 12.7
    }
};

// Test overlay
showHighRiskWarningOverlay();

// Test popup
showHighRiskMedicalSuggestionsPopup(mockResult);
```

### 🔧 Quick Fixes

#### Fix 1: Force Function Loading
Add this to the end of `templates/index.html` before `</body>`:
```html
<script>
// Force load check
setTimeout(() => {
    if (typeof showHighRiskWarningOverlay === 'undefined') {
        console.error('❌ ADR Warning functions not loaded - reloading page');
        location.reload();
    } else {
        console.log('✅ ADR Warning functions loaded successfully');
    }
}, 2000);
</script>
```

#### Fix 2: Inline Test Function
Add this to `templates/index.html` in the script section:
```javascript
// Inline test function as backup
window.testHighRiskWarningInline = function() {
    console.log('🧪 Inline test function called');
    
    // Create overlay manually
    const overlay = document.createElement('div');
    overlay.id = 'high-risk-warning-overlay';
    overlay.className = 'high-risk-blinking-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, rgba(220, 38, 38, 0.1) 50%, rgba(220, 38, 38, 0.05) 100%);
        z-index: 999;
        animation: redWarningPulse 1s ease-in-out infinite alternate;
    `;
    
    document.body.appendChild(overlay);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, 10000);
    
    alert('High Risk ADR Detected!\n\nThis is a test of the warning system.');
};
```

#### Fix 3: Check Risk Level Calculation
Add debugging to the prediction result:
```javascript
// In displayResults function, add this logging:
console.log('🎯 Full prediction result:', result);
console.log('🎯 Risk level raw:', result.risk_level);
console.log('🎯 Risk level type:', typeof result.risk_level);
console.log('🎯 Risk level lowercase:', result.risk_level ? result.risk_level.toLowerCase() : 'undefined');
```

### 📋 Checklist for Troubleshooting

- [ ] Browser console shows no JavaScript errors
- [ ] All script files are loading (check Network tab)
- [ ] Functions are defined (`typeof showHighRiskWarningOverlay === 'function'`)
- [ ] CSS styles are loading properly
- [ ] Risk level is being detected as 'High'
- [ ] Test button works when clicked manually
- [ ] No browser popup blockers are interfering
- [ ] No ad blockers are blocking the overlay

### 🚀 Alternative Implementation

If the popup still doesn't work, here's a simplified version you can add directly to `templates/index.html`:

```html
<script>
// Simplified high-risk warning system
function showSimpleHighRiskWarning(result) {
    // Create simple overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(220, 38, 38, 0.8);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 1s infinite;
    `;
    
    overlay.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; text-align: center; max-width: 500px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
            <div style="color: #dc2626; font-size: 3rem; margin-bottom: 20px;">
                ⚠️
            </div>
            <h2 style="color: #dc2626; margin-bottom: 15px;">HIGH RISK ADR DETECTED</h2>
            <p style="margin-bottom: 20px;">Risk Level: <strong>${result.risk_level}</strong></p>
            <p style="margin-bottom: 20px;">Primary ADR: <strong>${result.predicted_adr_type}</strong></p>
            <p style="margin-bottom: 30px;">Safety Probability: <strong>${result.no_adr_probability}%</strong></p>
            <button onclick="this.closest('div').parentElement.remove()" style="background: #dc2626; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                Acknowledge Warning
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// Add CSS for pulse animation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { opacity: 0.8; }
        50% { opacity: 1; }
        100% { opacity: 0.8; }
    }
`;
document.head.appendChild(style);
</script>
```

### 📞 Support

If you're still having issues:

1. **Check the browser console** for any error messages
2. **Try the test button** on the main form
3. **Use the demo page** at `/high-risk-demo`
4. **Run the manual tests** in the browser console
5. **Check that the server is running** and serving static files properly

The most common issue is that the JavaScript functions aren't loading properly due to file path issues or server configuration problems.