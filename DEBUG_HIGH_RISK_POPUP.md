# 🔍 Debug High-Risk ADR Popup - Step by Step

## 🚨 Issue: High-risk popup not appearing

Let's debug this systematically to find the exact problem.

## 📋 Step-by-Step Debugging

### Step 1: Check if JavaScript files are loading
1. Open the main assessment page: `http://localhost:5000/assessment`
2. Open browser Developer Tools (F12)
3. Go to **Console** tab
4. Look for this message: `🚨 ADR Warning JavaScript loaded successfully`
5. If you don't see it, there's a JavaScript loading issue

### Step 2: Test function availability
In the browser console, run:
```javascript
testADRWarning()
```

Expected output:
```javascript
{
  generateHighRiskADRWarning: "function",
  showHighRiskWarningOverlay: "function", 
  showHighRiskMedicalSuggestionsPopup: "function",
  playWarningNotification: "function"
}
```

### Step 3: Force test the popup
In the browser console, run:
```javascript
forceHighRiskPopup()
```

This should immediately show:
- Red pulsing overlay covering the screen
- Medical suggestions popup
- Audio warning (if browser allows)

### Step 4: Test with high-risk sample data
1. On the assessment page, find the sample data selector
2. Select: **"🔴 High Risk - Elderly with Multiple Comorbidities"**
3. Click **"Assess ADR Risk"**
4. Watch the console for these messages:

Expected console output:
```
🎯 Risk level detected: high from result: High
🚨 HIGH RISK ADR DETECTED - Triggering warning system
🔍 Available functions: {showHighRiskWarningOverlay: "function", ...}
⏰ Timeout triggered - calling warning functions
📞 Calling showHighRiskWarningOverlay()
🚨 showHighRiskWarningOverlay() called
📞 Calling showHighRiskMedicalSuggestionsPopup()
🏥 showHighRiskMedicalSuggestionsPopup() called with result: {...}
```

### Step 5: Check risk level calculation
In the console after submitting high-risk data, check:
```javascript
// Check the last prediction result
console.log('Last result:', window.currentPredictionResult);
```

The `risk_level` should be exactly `"High"` (capital H).

## 🔧 Common Issues and Solutions

### Issue 1: Functions not defined
**Symptoms:** `testADRWarning()` returns "undefined" for functions
**Solution:** 
- Check browser Network tab for 404 errors on JavaScript files
- Verify Flask server is running and serving static files
- Clear browser cache and reload

### Issue 2: Risk level not "High"
**Symptoms:** Console shows risk level as "medium" or "low" despite high-risk data
**Solution:**
- Check the server logs for risk calculation
- Verify the ML model is loaded properly
- Use the exact sample data provided

### Issue 3: Functions exist but popup doesn't show
**Symptoms:** Console shows functions are called but no visual popup
**Solution:**
- Check for CSS loading issues
- Look for JavaScript errors in console
- Try the `forceHighRiskPopup()` test

### Issue 4: Popup blocked by browser
**Symptoms:** Functions execute but overlay/popup doesn't appear
**Solution:**
- Check if popup blocker is active
- Disable ad blockers temporarily
- Try in incognito/private browsing mode

## 🧪 Manual Test Commands

Run these in the browser console for immediate testing:

### Test 1: Basic function check
```javascript
console.log('Functions available:', {
    overlay: typeof showHighRiskWarningOverlay,
    popup: typeof showHighRiskMedicalSuggestionsPopup,
    audio: typeof playWarningNotification
});
```

### Test 2: Force overlay only
```javascript
showHighRiskWarningOverlay();
```

### Test 3: Force popup only
```javascript
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
showHighRiskMedicalSuggestionsPopup(mockResult);
```

### Test 4: Check CSS styles
```javascript
// Check if CSS classes exist
const testDiv = document.createElement('div');
testDiv.className = 'high-risk-blinking-overlay';
document.body.appendChild(testDiv);
const styles = window.getComputedStyle(testDiv);
console.log('Overlay styles:', {
    position: styles.position,
    zIndex: styles.zIndex,
    background: styles.background
});
testDiv.remove();
```

## 📊 Expected Behavior

### When High Risk is Detected:
1. **Console Messages:** Debug messages showing detection and function calls
2. **Red Overlay:** Pulsing red background covering entire screen
3. **Medical Popup:** White popup with red header showing medical instructions
4. **Audio Alert:** 3 beeps (if browser allows audio)
5. **Browser Notification:** System notification (if permitted)

### Visual Indicators:
- **Overlay:** `position: fixed`, `z-index: 999`, red radial gradient
- **Popup:** `position: fixed`, `z-index: 2000`, white background with red header
- **Animation:** Pulsing effect on overlay, icon animations in popup

## 🔍 Server-Side Debugging

Check the server console for:
```
🎯 Risk Assessment: High (No ADR Probability: 0.150)
```

If you see "Low" or "Medium" instead of "High", the issue is in the risk calculation.

## 🚀 Quick Fix Test

If nothing else works, add this to the browser console:
```javascript
// Override the displayResults function to force high risk
const originalDisplayResults = displayResults;
displayResults = function(result) {
    console.log('🔧 OVERRIDE: Forcing high risk for testing');
    result.risk_level = 'High';
    result.no_adr_probability = 15;
    return originalDisplayResults(result);
};
```

Then submit any patient data and it should trigger the popup.

## 📞 Next Steps

1. **Run Step 1-5** in order
2. **Report which step fails** and what error messages you see
3. **Try the manual test commands** to isolate the issue
4. **Check browser console** for any red error messages
5. **Verify server is running** and accessible

The debugging output will help identify exactly where the system is failing.