// ADR Warning Functions
console.log('🚨 ADR Warning JavaScript loaded successfully');

// Test function to verify loading
window.testADRWarning = function() {
    console.log('✅ ADR Warning functions are available');
    return {
        generateHighRiskADRWarning: typeof generateHighRiskADRWarning,
        showHighRiskWarningOverlay: typeof showHighRiskWarningOverlay,
        showHighRiskMedicalSuggestionsPopup: typeof showHighRiskMedicalSuggestionsPopup,
        playWarningNotification: typeof playWarningNotification
    };
};

// Global test function for immediate popup testing
window.forceHighRiskPopup = function() {
    console.log('🧪 FORCE HIGH RISK POPUP TEST');
    
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
    
    console.log('🚨 Forcing high-risk warning overlay...');
    showHighRiskWarningOverlay();
    
    console.log('🏥 Forcing medical suggestions popup...');
    showHighRiskMedicalSuggestionsPopup(mockResult);
    
    console.log('🔊 Playing warning notification...');
    playWarningNotification();
    
    return 'High-risk popup test executed!';
};

// Generate High Risk ADR Warning
function generateHighRiskADRWarning(result) {
    console.log('🎯 generateHighRiskADRWarning called with result:', result);
    
    const riskLevel = result.risk_level.toLowerCase();
    const predictedADR = result.predicted_adr_type;
    const noAdrProb = result.no_adr_probability;
    
    console.log('🎯 Risk level in generateHighRiskADRWarning:', riskLevel);
    
    // Show warning for high and medium risk cases
    if (riskLevel === 'low') {
        console.log('🟢 Low risk - no warning needed');
        return '';
    }
    
    // Automatically trigger red warning overlay for high risk
    if (riskLevel === 'high') {
        console.log('🚨 HIGH RISK detected in generateHighRiskADRWarning - triggering popup');
        setTimeout(() => {
            console.log('🚨 Executing high-risk warning functions from generateHighRiskADRWarning');
            showHighRiskWarningOverlay();
            showHighRiskMedicalSuggestionsPopup(result);
            playWarningNotification();
        }, 500);
    } else {
        console.log('🟡 Medium risk detected - showing warning without popup');
    }
    
    // Get the highest specific ADR risk
    const topSpecificRisks = result.top_specific_adr_risks || {};
    const topADRs = Object.entries(topSpecificRisks)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
    
    const warningColor = getWarningColor(riskLevel);
    const urgencyLevel = getUrgencyLevel(noAdrProb);
    const clinicalRecommendations = getClinicalRecommendations(predictedADR, riskLevel);
    const alertTitle = riskLevel === 'high' ? '⚠️ HIGH RISK ADR ALERT' : '⚠️ MODERATE RISK ADR ALERT';
    const alertIcon = riskLevel === 'high' ? 'fas fa-exclamation-triangle' : 'fas fa-exclamation-circle';
    
    return `
        <div class="high-risk-adr-warning ${warningColor}" data-risk-level="${riskLevel}">
            <div class="warning-header">
                <div class="warning-icon">
                    <i class="${alertIcon}"></i>
                </div>
                <div class="warning-title">
                    <h3>${alertTitle}</h3>
                    <p class="urgency-badge ${urgencyLevel.class}">${urgencyLevel.text}</p>
                </div>
                <div class="warning-actions">
                    <button class="btn-acknowledge" onclick="acknowledgeWarning(this)" title="Acknowledge Warning">
                        <i class="fas fa-check"></i> Acknowledge
                    </button>
                    <button class="btn-print-warning" onclick="printWarning(this)" title="Print Warning">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button class="btn-share-warning" onclick="shareWarning(this)" title="Share Warning">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                </div>
            </div>
            
            <div class="warning-content">
                <div class="risk-summary-alert">
                    <div class="alert-item">
                        <span class="alert-label">Risk Level:</span>
                        <span class="alert-value high-risk">${result.risk_level}</span>
                    </div>
                    <div class="alert-item">
                        <span class="alert-label">Primary ADR Risk:</span>
                        <span class="alert-value">${predictedADR}</span>
                    </div>
                    <div class="alert-item">
                        <span class="alert-label">Safety Probability:</span>
                        <span class="alert-value">${noAdrProb}%</span>
                    </div>
                </div>
                
                ${topADRs.length > 0 ? `
                <div class="specific-adr-alerts">
                    <h4><i class="fas fa-medical-kit"></i> Specific ADR Risks to Monitor</h4>
                    <div class="adr-risk-grid">
                        ${topADRs.map(([adrType, probability]) => `
                            <div class="adr-risk-item ${getRiskClass(probability)}">
                                <div class="adr-name">${adrType}</div>
                                <div class="adr-probability">${probability}%</div>
                                <div class="adr-severity">${getSeverityText(probability)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="clinical-recommendations">
                    <h4><i class="fas fa-stethoscope"></i> Immediate Clinical Actions Required</h4>
                    <div class="recommendations-grid">
                        ${clinicalRecommendations.map(rec => `
                            <div class="recommendation-item ${rec.priority}">
                                <div class="rec-icon">
                                    <i class="${rec.icon}"></i>
                                </div>
                                <div class="rec-content">
                                    <div class="rec-title">${rec.title}</div>
                                    <div class="rec-description">${rec.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="emergency-contacts">
                    <h4><i class="fas fa-phone-alt"></i> Emergency Response</h4>
                    <div class="emergency-grid">
                        <div class="emergency-item critical">
                            <i class="fas fa-ambulance"></i>
                            <div>
                                <strong>Severe ADR Emergency</strong>
                                <p>Call 911 immediately</p>
                            </div>
                        </div>
                        <div class="emergency-item urgent">
                            <i class="fas fa-user-md"></i>
                            <div>
                                <strong>Physician Consultation</strong>
                                <p>Contact prescribing physician within 2 hours</p>
                            </div>
                        </div>
                        <div class="emergency-item moderate">
                            <i class="fas fa-pills"></i>
                            <div>
                                <strong>Pharmacy Consultation</strong>
                                <p>Consult clinical pharmacist for medication review</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="monitoring-schedule">
                    <h4><i class="fas fa-calendar-check"></i> Enhanced Monitoring Protocol</h4>
                    <div class="monitoring-timeline">
                        <div class="timeline-item immediate">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <strong>Immediate (0-2 hours)</strong>
                                <p>Assess vital signs, review symptoms, consider dose reduction</p>
                            </div>
                        </div>
                        <div class="timeline-item short-term">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <strong>Short-term (2-24 hours)</strong>
                                <p>Monitor for early ADR signs, laboratory follow-up if indicated</p>
                            </div>
                        </div>
                        <div class="timeline-item ongoing">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <strong>Ongoing (Daily)</strong>
                                <p>Daily symptom assessment, weekly lab monitoring, medication adherence review</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="warning-footer">
                <div class="disclaimer">
                    <i class="fas fa-info-circle"></i>
                    <span>This is a predictive assessment. Clinical judgment should always take precedence. Document all interventions and patient responses.</span>
                </div>
            </div>
        </div>
    `;
}

// Helper functions for ADR warning
function getWarningColor(riskLevel) {
    switch(riskLevel) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'info';
        default: return 'info';
    }
}

function getUrgencyLevel(noAdrProb) {
    if (noAdrProb < 30) {
        return { class: 'critical', text: 'CRITICAL - Immediate Action Required' };
    } else if (noAdrProb < 50) {
        return { class: 'urgent', text: 'URGENT - Enhanced Monitoring' };
    } else if (noAdrProb < 70) {
        return { class: 'moderate', text: 'MODERATE - Increased Vigilance' };
    } else {
        return { class: 'low', text: 'LOW - Standard Monitoring' };
    }
}

function getRiskClass(probability) {
    if (probability > 15) return 'high-risk';
    if (probability > 5) return 'medium-risk';
    return 'low-risk';
}

function getSeverityText(probability) {
    if (probability > 15) return 'High Risk';
    if (probability > 5) return 'Moderate Risk';
    return 'Low Risk';
}

function getClinicalRecommendations(predictedADR, riskLevel) {
    const baseRecommendations = [
        {
            priority: 'critical',
            icon: 'fas fa-heartbeat',
            title: 'Vital Signs Monitoring',
            description: 'Monitor blood pressure, heart rate, temperature every 2-4 hours'
        },
        {
            priority: 'urgent',
            icon: 'fas fa-vial',
            title: 'Laboratory Monitoring',
            description: 'Order CBC, CMP, liver function tests within 24 hours'
        },
        {
            priority: 'urgent',
            icon: 'fas fa-pills',
            title: 'Medication Review',
            description: 'Consider dose reduction or alternative therapy options'
        },
        {
            priority: 'moderate',
            icon: 'fas fa-clipboard-list',
            title: 'Symptom Assessment',
            description: 'Document any new symptoms or changes in patient condition'
        }
    ];
    
    // Add patient-specific recommendations based on current data
    const patientSpecificRecs = getPatientSpecificRecommendations();
    
    // Add specific recommendations based on predicted ADR type
    const specificRecommendations = getSpecificRecommendations(predictedADR);
    
    return [...baseRecommendations, ...patientSpecificRecs, ...specificRecommendations];
}

// Get patient-specific recommendations based on current patient data
function getPatientSpecificRecommendations() {
    const recommendations = [];
    
    if (!window.currentPatientData) return recommendations;
    
    // Age-based recommendations
    if (window.currentPatientData.age >= 65) {
        recommendations.push({
            priority: 'urgent',
            icon: 'fas fa-user-clock',
            title: 'Geriatric Considerations',
            description: 'Enhanced monitoring for elderly patient - consider reduced dosing and increased fall risk'
        });
    }
    
    // Kidney function recommendations
    if (window.currentPatientData.egfr && window.currentPatientData.egfr < 60) {
        recommendations.push({
            priority: 'critical',
            icon: 'fas fa-kidneys',
            title: 'Renal Impairment Alert',
            description: `eGFR ${window.currentPatientData.egfr} - Dose adjustment required, monitor creatinine daily`
        });
    }
    
    // Liver function recommendations
    if (window.currentPatientData.ast_alt && window.currentPatientData.ast_alt > 40) {
        recommendations.push({
            priority: 'critical',
            icon: 'fas fa-liver',
            title: 'Hepatic Function Alert',
            description: `Elevated AST/ALT (${window.currentPatientData.ast_alt}) - Monitor liver function closely`
        });
    }
    
    // Polypharmacy recommendations
    if (window.currentPatientData.concomitant_drugs_count > 5) {
        recommendations.push({
            priority: 'urgent',
            icon: 'fas fa-pills',
            title: 'Polypharmacy Alert',
            description: `${window.currentPatientData.concomitant_drugs_count} concurrent medications - Review for interactions and deprescribing opportunities`
        });
    }
    
    // Comorbidity-based recommendations
    if (window.currentPatientData.diabetes === 1) {
        recommendations.push({
            priority: 'moderate',
            icon: 'fas fa-tint',
            title: 'Diabetes Management',
            description: 'Monitor blood glucose levels - ADR may affect glycemic control'
        });
    }
    
    if (window.currentPatientData.cardiac_disease === 1) {
        recommendations.push({
            priority: 'urgent',
            icon: 'fas fa-heart',
            title: 'Cardiac Monitoring',
            description: 'Existing cardiac disease - Monitor for cardiovascular ADRs, consider ECG'
        });
    }
    
    return recommendations;
}

function getSpecificRecommendations(adrType) {
    const recommendations = {
        'Hepatotoxicity': [
            {
                priority: 'critical',
                icon: 'fas fa-liver',
                title: 'Liver Function Monitoring',
                description: 'Immediate ALT, AST, bilirubin, INR assessment'
            }
        ],
        'Nephrotoxicity': [
            {
                priority: 'critical',
                icon: 'fas fa-kidneys',
                title: 'Renal Function Monitoring',
                description: 'Check creatinine, BUN, urine output every 6 hours'
            }
        ],
        'Cardiotoxicity': [
            {
                priority: 'critical',
                icon: 'fas fa-heart',
                title: 'Cardiac Monitoring',
                description: 'ECG monitoring, troponin levels, echocardiogram if indicated'
            }
        ],
        'Hematologic': [
            {
                priority: 'critical',
                icon: 'fas fa-tint',
                title: 'Blood Count Monitoring',
                description: 'Daily CBC with differential, platelet count, coagulation studies'
            }
        ],
        'Dermatologic': [
            {
                priority: 'urgent',
                icon: 'fas fa-hand-paper',
                title: 'Skin Assessment',
                description: 'Daily skin examination for rash, blistering, or severe reactions'
            }
        ]
    };
    
    return recommendations[adrType] || [];
}

// Acknowledge warning function
function acknowledgeWarning(button) {
    const warningContainer = button.closest('.high-risk-adr-warning');
    const riskLevel = warningContainer.dataset.riskLevel;
    
    // Add acknowledged state
    warningContainer.classList.add('acknowledged');
    
    // Update button
    button.innerHTML = '<i class="fas fa-check-circle"></i> Acknowledged';
    button.disabled = true;
    button.classList.add('acknowledged');
    
    // Show confirmation
    if (window.showSuccess) {
        window.showSuccess(`${riskLevel.toUpperCase()} risk ADR warning acknowledged. Please ensure all recommended actions are implemented.`);
    }
    
    // Log acknowledgment (in real system, this would be sent to server)
    console.log(`ADR Warning Acknowledged: ${riskLevel} risk at ${new Date().toISOString()}`);
    
    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'acknowledgment-timestamp';
    timestamp.innerHTML = `<i class="fas fa-clock"></i> Acknowledged at ${new Date().toLocaleString()}`;
    warningContainer.querySelector('.warning-footer').appendChild(timestamp);
}

// Play warning notification sound
function playWarningNotification() {
    try {
        // Create audio context for notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create a simple warning tone
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configure warning tone (urgent beeping pattern)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        // Repeat the warning tone 3 times
        setTimeout(() => {
            if (audioContext.state !== 'closed') {
                const osc2 = audioContext.createOscillator();
                const gain2 = audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(audioContext.destination);
                osc2.frequency.setValueAtTime(800, audioContext.currentTime);
                gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                osc2.start();
                osc2.stop(audioContext.currentTime + 0.2);
            }
        }, 500);
        
        setTimeout(() => {
            if (audioContext.state !== 'closed') {
                const osc3 = audioContext.createOscillator();
                const gain3 = audioContext.createGain();
                osc3.connect(gain3);
                gain3.connect(audioContext.destination);
                osc3.frequency.setValueAtTime(800, audioContext.currentTime);
                gain3.gain.setValueAtTime(0.3, audioContext.currentTime);
                gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                osc3.start();
                osc3.stop(audioContext.currentTime + 0.2);
            }
        }, 1000);
        
        console.log('🔊 High-risk ADR warning notification played');
        
    } catch (error) {
        console.warn('Could not play warning notification sound:', error);
        // Fallback: show visual notification
        showVisualWarningNotification();
    }
}

// Visual warning notification fallback
function showVisualWarningNotification() {
    const notification = document.createElement('div');
    notification.className = 'visual-warning-notification';
    notification.innerHTML = `
        <div class="visual-warning-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>HIGH RISK ADR DETECTED - Review Clinical Management Plan</span>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#visual-warning-styles')) {
        const style = document.createElement('style');
        style.id = 'visual-warning-styles';
        style.textContent = `
            .visual-warning-notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                color: white;
                padding: 20px 30px;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(220, 38, 38, 0.4);
                z-index: 2000;
                animation: warningFlash 0.5s ease-in-out 6 alternate;
                font-weight: 600;
                text-align: center;
                border: 3px solid #fca5a5;
            }
            
            .visual-warning-content {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 1.1rem;
            }
            
            .visual-warning-content i {
                font-size: 1.5rem;
                animation: warningBounce 0.5s ease-in-out infinite alternate;
            }
            
            @keyframes warningFlash {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.05); }
            }
            
            @keyframes warningBounce {
                0% { transform: scale(1); }
                100% { transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Print warning function
function printWarning(button) {
    const warningContainer = button.closest('.high-risk-adr-warning');
    const patientName = (window.patientInfo && window.patientInfo.name) || 'Patient';
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    // Create printable version
    const printContent = `
        <html>
        <head>
            <title>ADR Risk Warning - ${patientName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .print-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .warning-box { border: 3px solid #dc2626; padding: 15px; margin: 20px 0; background: #fef2f2; }
                .urgent { color: #dc2626; font-weight: bold; text-transform: uppercase; }
                .section { margin: 15px 0; }
                .section h3 { color: #1f2937; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
                .item { padding: 8px; border: 1px solid #ddd; background: #f9f9f9; }
                .footer { margin-top: 30px; font-size: 0.9em; color: #666; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>ADVERSE DRUG REACTION RISK WARNING</h1>
                <p><strong>Patient:</strong> ${patientName} | <strong>Date:</strong> ${currentDate} | <strong>Time:</strong> ${currentTime}</p>
                <p class="urgent">⚠️ This document contains critical patient safety information ⚠️</p>
            </div>
            
            ${warningContainer.innerHTML.replace(/onclick="[^"]*"/g, '').replace(/class="btn-[^"]*"/g, 'style="display:none"')}
            
            <div class="footer">
                <p><strong>Important:</strong> This warning was generated by an AI-powered ADR risk prediction system. Clinical judgment should always take precedence. All recommendations should be reviewed by qualified healthcare professionals.</p>
                <p><strong>Generated:</strong> ${currentDate} at ${currentTime} | <strong>System:</strong> ADR Risk Predictor v2.0</p>
            </div>
        </body>
        </html>
    `;
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    if (window.showSuccess) {
        window.showSuccess('ADR warning prepared for printing');
    }
}

// Share warning function
function shareWarning(button) {
    const warningContainer = button.closest('.high-risk-adr-warning');
    const riskLevel = warningContainer.dataset.riskLevel;
    const patientName = (window.patientInfo && window.patientInfo.name) || 'Patient';
    
    // Create shareable summary
    const shareText = `🚨 ADR RISK ALERT 🚨
    
Patient: ${patientName}
Risk Level: ${riskLevel.toUpperCase()}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

⚠️ HIGH PRIORITY: Enhanced monitoring and immediate clinical review required.

Generated by ADR Risk Predictor System
    `;
    
    // Try to use Web Share API if available
    if (navigator.share) {
        navigator.share({
            title: `ADR Risk Alert - ${patientName}`,
            text: shareText,
            url: window.location.href
        }).then(() => {
            if (window.showSuccess) {
                window.showSuccess('ADR warning shared successfully');
            }
        }).catch((error) => {
            console.log('Error sharing:', error);
            fallbackShare(shareText);
        });
    } else {
        fallbackShare(shareText);
    }
}

// Fallback share function
function fallbackShare(text) {
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
        if (window.showSuccess) {
            window.showSuccess('ADR warning copied to clipboard - you can now paste it in your preferred communication app');
        }
    }).catch(() => {
        // Final fallback - show text in modal
        alert('ADR Warning Details:\n\n' + text);
    });
}

// Show High Risk Warning Overlay with Red Faded Light
function showHighRiskWarningOverlay() {
    console.log('🚨 showHighRiskWarningOverlay() called');
    
    // Remove any existing overlay
    const existingOverlay = document.getElementById('high-risk-warning-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create the red faded light overlay
    const overlay = document.createElement('div');
    overlay.id = 'high-risk-warning-overlay';
    overlay.className = 'high-risk-blinking-overlay';
    
    // Add click handler to dismiss overlay
    overlay.addEventListener('click', () => {
        overlay.remove();
        console.log('🚨 High-risk warning overlay dismissed by user');
    });
    
    document.body.appendChild(overlay);
    
    // Auto-remove overlay after 30 seconds
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
            console.log('🚨 High-risk warning overlay auto-dismissed after 30 seconds');
        }
    }, 30000);
    
    console.log('🚨 HIGH RISK ADR DETECTED - Red warning overlay activated');
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 HIGH RISK ADR ALERT', {
            body: 'Critical ADR risk detected. Immediate medical attention required.',
            icon: '/static/favicon.ico',
            tag: 'high-risk-adr',
            requireInteraction: true
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('🚨 HIGH RISK ADR ALERT', {
                    body: 'Critical ADR risk detected. Immediate medical attention required.',
                    icon: '/static/favicon.ico',
                    tag: 'high-risk-adr',
                    requireInteraction: true
                });
            }
        });
    }
    
    // Vibrate device if supported (mobile)
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    return overlay;
}

// Enhanced warning notification with medical suggestions popup
function showHighRiskMedicalSuggestionsPopup(result) {
    console.log('🏥 showHighRiskMedicalSuggestionsPopup() called with result:', result);
    
    const popup = document.createElement('div');
    popup.className = 'high-risk-medical-popup';
    popup.innerHTML = `
        <div class="medical-popup-content">
            <div class="popup-header">
                <div class="warning-icon-large">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>🚨 HIGH RISK ADR DETECTED</h2>
                <p class="risk-subtitle">Immediate Medical Intervention Required</p>
            </div>
            
            <div class="popup-body">
                <div class="risk-details">
                    <div class="risk-item">
                        <span class="risk-label">Risk Level:</span>
                        <span class="risk-value critical">${result.risk_level}</span>
                    </div>
                    <div class="risk-item">
                        <span class="risk-label">Primary ADR Risk:</span>
                        <span class="risk-value">${result.predicted_adr_type}</span>
                    </div>
                    <div class="risk-item">
                        <span class="risk-label">Safety Probability:</span>
                        <span class="risk-value">${result.no_adr_probability}%</span>
                    </div>
                </div>
                
                <div class="medical-suggestions">
                    <h3><i class="fas fa-user-md"></i> Immediate Medical Actions</h3>
                    <div class="suggestion-list">
                        <div class="suggestion critical">
                            <i class="fas fa-phone-alt"></i>
                            <div>
                                <strong>Contact Physician Immediately</strong>
                                <p>Call prescribing physician within 1 hour</p>
                            </div>
                        </div>
                        <div class="suggestion critical">
                            <i class="fas fa-heartbeat"></i>
                            <div>
                                <strong>Monitor Vital Signs</strong>
                                <p>Check BP, HR, temperature every 15 minutes</p>
                            </div>
                        </div>
                        <div class="suggestion urgent">
                            <i class="fas fa-pills"></i>
                            <div>
                                <strong>Medication Review</strong>
                                <p>Consider dose reduction or discontinuation</p>
                            </div>
                        </div>
                        <div class="suggestion urgent">
                            <i class="fas fa-vial"></i>
                            <div>
                                <strong>Laboratory Monitoring</strong>
                                <p>Order stat labs: CBC, CMP, LFTs</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="emergency-warning">
                    <i class="fas fa-ambulance"></i>
                    <div>
                        <strong>Emergency Signs - Call 911 if patient experiences:</strong>
                        <ul>
                            <li>Difficulty breathing or chest pain</li>
                            <li>Severe allergic reaction or rash</li>
                            <li>Loss of consciousness or confusion</li>
                            <li>Severe nausea, vomiting, or abdominal pain</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="popup-actions">
                <button class="btn-acknowledge-popup" onclick="acknowledgeHighRiskPopup(this)">
                    <i class="fas fa-check"></i> Acknowledge & Close
                </button>
                <button class="btn-print-popup" onclick="printHighRiskPopup()">
                    <i class="fas fa-print"></i> Print Instructions
                </button>
            </div>
        </div>
    `;
    
    // Add popup styles if not already added
    if (!document.querySelector('#high-risk-popup-styles')) {
        const style = document.createElement('style');
        style.id = 'high-risk-popup-styles';
        style.textContent = `
            .high-risk-medical-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                padding: 20px;
                animation: popupFadeIn 0.3s ease;
            }
            
            .medical-popup-content {
                background: white;
                border-radius: 16px;
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                border: 3px solid #dc2626;
            }
            
            .popup-header {
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                color: white;
                padding: 25px;
                text-align: center;
                border-radius: 13px 13px 0 0;
            }
            
            .warning-icon-large {
                font-size: 4rem;
                margin-bottom: 15px;
                animation: warningIconPulse 1.5s ease-in-out infinite;
            }
            
            .popup-header h2 {
                font-size: 1.8rem;
                font-weight: 800;
                margin: 0 0 10px 0;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            .risk-subtitle {
                font-size: 1.1rem;
                opacity: 0.9;
                margin: 0;
                font-weight: 500;
            }
            
            .popup-body {
                padding: 25px;
            }
            
            .risk-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 15px;
                margin-bottom: 25px;
                padding: 20px;
                background: #fef2f2;
                border-radius: 12px;
                border: 1px solid #fecaca;
            }
            
            .risk-item {
                text-align: center;
            }
            
            .risk-label {
                display: block;
                font-size: 0.9rem;
                color: #6b7280;
                font-weight: 500;
                margin-bottom: 5px;
            }
            
            .risk-value {
                display: block;
                font-size: 1.3rem;
                font-weight: 700;
                color: #1f2937;
            }
            
            .risk-value.critical {
                color: #dc2626;
            }
            
            .medical-suggestions h3 {
                color: #dc2626;
                font-size: 1.3rem;
                font-weight: 700;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .suggestion-list {
                display: grid;
                gap: 12px;
                margin-bottom: 25px;
            }
            
            .suggestion {
                display: flex;
                gap: 15px;
                padding: 15px;
                border-radius: 10px;
                border-left: 4px solid;
                background: #f9fafb;
            }
            
            .suggestion.critical {
                border-left-color: #dc2626;
                background: #fef2f2;
            }
            
            .suggestion.urgent {
                border-left-color: #f59e0b;
                background: #fffbeb;
            }
            
            .suggestion i {
                font-size: 1.5rem;
                width: 30px;
                flex-shrink: 0;
                margin-top: 2px;
            }
            
            .suggestion.critical i {
                color: #dc2626;
            }
            
            .suggestion.urgent i {
                color: #f59e0b;
            }
            
            .suggestion strong {
                display: block;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 5px;
            }
            
            .suggestion p {
                font-size: 0.9rem;
                color: #4b5563;
                margin: 0;
            }
            
            .emergency-warning {
                display: flex;
                gap: 15px;
                padding: 20px;
                background: #fef2f2;
                border: 2px solid #dc2626;
                border-radius: 12px;
                margin-bottom: 25px;
            }
            
            .emergency-warning i {
                font-size: 2rem;
                color: #dc2626;
                flex-shrink: 0;
                margin-top: 5px;
            }
            
            .emergency-warning strong {
                display: block;
                color: #dc2626;
                font-weight: 700;
                margin-bottom: 10px;
            }
            
            .emergency-warning ul {
                margin: 0;
                padding-left: 20px;
                color: #1f2937;
            }
            
            .emergency-warning li {
                margin-bottom: 5px;
                font-weight: 500;
            }
            
            .popup-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                padding: 20px 25px;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
                border-radius: 0 0 13px 13px;
            }
            
            .btn-acknowledge-popup,
            .btn-print-popup {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .btn-acknowledge-popup {
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                color: white;
                box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
            }
            
            .btn-acknowledge-popup:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
            }
            
            .btn-print-popup {
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
            }
            
            .btn-print-popup:hover {
                background: #e5e7eb;
                transform: translateY(-1px);
            }
            
            @keyframes popupFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @media (max-width: 768px) {
                .high-risk-medical-popup {
                    padding: 10px;
                }
                
                .medical-popup-content {
                    max-height: 95vh;
                }
                
                .popup-header {
                    padding: 20px 15px;
                }
                
                .warning-icon-large {
                    font-size: 3rem;
                }
                
                .popup-header h2 {
                    font-size: 1.5rem;
                }
                
                .popup-body {
                    padding: 20px 15px;
                }
                
                .risk-details {
                    grid-template-columns: 1fr;
                    gap: 10px;
                    padding: 15px;
                }
                
                .suggestion-list {
                    gap: 10px;
                }
                
                .suggestion {
                    padding: 12px;
                }
                
                .popup-actions {
                    flex-direction: column;
                    padding: 15px;
                }
                
                .btn-acknowledge-popup,
                .btn-print-popup {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(popup);
    
    // Auto-remove popup after 2 minutes if not acknowledged
    setTimeout(() => {
        if (popup.parentElement) {
            popup.remove();
            console.log('🚨 High-risk medical suggestions popup auto-dismissed after 2 minutes');
        }
    }, 120000);
    
    console.log('🚨 High-risk medical suggestions popup displayed');
    return popup;
}

// Acknowledge high risk popup
function acknowledgeHighRiskPopup(button) {
    const popup = button.closest('.high-risk-medical-popup');
    if (popup) {
        popup.remove();
        if (window.showSuccess) {
            window.showSuccess('High-risk ADR warning acknowledged. Please ensure all medical recommendations are followed.');
        }
        console.log('🚨 High-risk medical popup acknowledged by user');
    }
}

// Print high risk popup
function printHighRiskPopup() {
    const patientName = (window.patientInfo && window.patientInfo.name) || 'Patient';
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    const printContent = `
        <html>
        <head>
            <title>HIGH RISK ADR ALERT - ${patientName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .alert-header { text-align: center; color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 15px; margin-bottom: 25px; }
                .alert-header h1 { font-size: 2rem; margin: 0; }
                .critical-box { border: 3px solid #dc2626; padding: 20px; margin: 20px 0; background: #fef2f2; }
                .urgent { color: #dc2626; font-weight: bold; text-transform: uppercase; }
                .section { margin: 20px 0; }
                .section h2 { color: #1f2937; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
                .suggestion { margin: 10px 0; padding: 10px; border-left: 4px solid #dc2626; background: #f9f9f9; }
                .emergency { background: #fef2f2; border: 2px solid #dc2626; padding: 15px; margin: 15px 0; }
                ul { padding-left: 25px; }
                li { margin-bottom: 8px; }
                .footer { margin-top: 30px; font-size: 0.9em; color: #666; border-top: 1px solid #ccc; padding-top: 15px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="alert-header">
                <h1>🚨 HIGH RISK ADR ALERT 🚨</h1>
                <p><strong>Patient:</strong> ${patientName} | <strong>Date:</strong> ${currentDate} | <strong>Time:</strong> ${currentTime}</p>
                <p class="urgent">⚠️ IMMEDIATE MEDICAL INTERVENTION REQUIRED ⚠️</p>
            </div>
            
            <div class="critical-box">
                <h2>IMMEDIATE ACTIONS REQUIRED</h2>
                <div class="suggestion">
                    <strong>📞 Contact Physician Immediately</strong><br>
                    Call prescribing physician within 1 hour
                </div>
                <div class="suggestion">
                    <strong>💓 Monitor Vital Signs</strong><br>
                    Check BP, HR, temperature every 15 minutes
                </div>
                <div class="suggestion">
                    <strong>💊 Medication Review</strong><br>
                    Consider dose reduction or discontinuation
                </div>
                <div class="suggestion">
                    <strong>🧪 Laboratory Monitoring</strong><br>
                    Order stat labs: CBC, CMP, LFTs
                </div>
            </div>
            
            <div class="emergency">
                <h2>🚑 EMERGENCY SIGNS - CALL 911 IF PATIENT EXPERIENCES:</h2>
                <ul>
                    <li>Difficulty breathing or chest pain</li>
                    <li>Severe allergic reaction or rash</li>
                    <li>Loss of consciousness or confusion</li>
                    <li>Severe nausea, vomiting, or abdominal pain</li>
                </ul>
            </div>
            
            <div class="footer">
                <p><strong>Important:</strong> This is a critical patient safety alert generated by the ADR Risk Prediction System. All recommendations must be reviewed and implemented by qualified healthcare professionals.</p>
                <p><strong>Generated:</strong> ${currentDate} at ${currentTime} | <strong>System:</strong> ADR Risk Predictor v2.0</p>
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    console.log('🚨 High-risk medical instructions prepared for printing');
}