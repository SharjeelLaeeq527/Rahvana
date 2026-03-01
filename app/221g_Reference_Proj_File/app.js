// ============================================
// RAHVANA 221(G) ACTION PLANNER - APP LOGIC
// ============================================

// ============================================
// STATE MANAGEMENT
// ============================================

const APP_VERSION = '1.0.0';
const STORAGE_KEY = 'rahvana_221g_wizard';
const WELCOME_DISMISSED_KEY = 'rahvana_221g_welcome_dismissed';

let appState = {
    currentStep: 0,
    caseBasics: {
        visaType: '',
        visaCategory: '',
        interviewDate: '',
        consularPost: '',
        ceacStatus: '',
        caseNumber: '',
        beneficiaryName: '',
        passportNumber: ''
    },
    checklist: {
        adminProcessing: false,
        passport: false,
        medical: false,
        nadraFRC: false,
        nadraBirthCert: false,
        nadraBirthCertFor: '',
        nadraMarriageCert: false,
        nikahNama: false,
        nadraDivorceCert: false,
        nadraDivorceCertFor: '',
        usDivorceCert: false,
        deathCert: false,
        deathCertFor: '',
        policeCert: false,
        policeCertCountry: '',
        translation: false,
        translationOf: '',
        i864: false,
        i864Details: {
            sponsorStructure: '', // petitioner-only, petitioner-hm, joint-sponsor, joint-sponsor-hm
            petitionerName: '',
            jointSponsorName: '',
            householdMemberName: '',
            formsRequested: [], // i-864, i-864a, i-134
            evidenceRequested: [], // i-864w, w-2, 1040, irs-transcript
            statusDocsRequested: [], // citizenship, lpr, domicile
            taxYears: []
        },
        dnaTest: false,
        dnaTestFor: '',
        customItems: [] // {id, label, notes, who}
    },
    generatedOutputs: {
        actionPlan: '',
        packetChecklist: '',
        coverLetter: ''
    }
};

let attachments = []; // For feedback modal

// ============================================
// UTILITY FUNCTIONS
// ============================================

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            appState = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }
}

function resetState() {
    if (confirm('Are you sure you want to reset the wizard? All progress will be lost.')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function sanitizeForReport(obj, redact = false) {
    if (!redact) return obj;
    
    const sanitized = JSON.parse(JSON.stringify(obj));
    
    // Redact PII
    if (sanitized.caseBasics) {
        sanitized.caseBasics.beneficiaryName = '[REDACTED]';
        sanitized.caseBasics.passportNumber = '[REDACTED]';
        sanitized.caseBasics.caseNumber = '[REDACTED]';
    }
    
    if (sanitized.checklist && sanitized.checklist.i864Details) {
        sanitized.checklist.i864Details.petitionerName = '[REDACTED]';
        sanitized.checklist.i864Details.jointSponsorName = '[REDACTED]';
        sanitized.checklist.i864Details.householdMemberName = '[REDACTED]';
    }
    
    return sanitized;
}

// ============================================
// WELCOME MODAL
// ============================================

function showWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    modal.classList.add('active');
}

function hideWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    modal.classList.remove('active');
}

function initWelcomeModal() {
    const dismissed = localStorage.getItem(WELCOME_DISMISSED_KEY);
    
    if (!dismissed) {
        showWelcomeModal();
    }
    
    document.getElementById('startWizard').addEventListener('click', () => {
        const dontShow = document.getElementById('dontShowAgain').checked;
        if (dontShow) {
            localStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
        }
        hideWelcomeModal();
        renderStep(1);
    });
    
    document.getElementById('whatIsThisBtn').addEventListener('click', () => {
        showWelcomeModal();
    });
}

// ============================================
// FEEDBACK MODAL
// ============================================

function initFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    const btn = document.getElementById('feedbackBtn');
    const closeBtn = document.getElementById('closeFeedback');
    const form = document.getElementById('feedbackForm');
    const attachmentInput = document.getElementById('attachments');
    const descriptionInput = document.getElementById('feedbackDescription');
    const charCount = document.getElementById('charCount');
    
    btn.addEventListener('click', () => {
        modal.classList.add('active');
        // Auto-populate affected screen
        const screenSelect = document.getElementById('affectedScreen');
        const stepMap = ['welcome', 'case-basics', 'replicate-checklist', 'review-generate', 'export-packet'];
        if (appState.currentStep > 0 && appState.currentStep <= stepMap.length) {
            screenSelect.value = stepMap[appState.currentStep - 1];
        }
    });
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Character counter
    descriptionInput.addEventListener('input', () => {
        charCount.textContent = descriptionInput.value.length;
    });
    
    // Attachment handling
    attachmentInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (totalSize > maxSize) {
            alert('Total attachment size exceeds 5MB. Please reduce file sizes.');
            e.target.value = '';
            return;
        }
        
        attachments = [];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                attachments.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    data: event.target.result
                });
                renderAttachments();
            };
            reader.readAsDataURL(file);
        });
    });
    
    // Copy summary button
    document.getElementById('copySummaryBtn').addEventListener('click', () => {
        const category = document.getElementById('issueCategory').value;
        const screen = document.getElementById('affectedScreen').value;
        const severity = document.getElementById('severity').value;
        const description = document.getElementById('feedbackDescription').value;
        
        const summary = `
221(g) Action Planner - Feedback Report

Category: ${category || '[Not selected]'}
Affected Screen: ${screen || '[Not selected]'}
Severity: ${severity || '[Not selected]'}

Description:
${description || '[No description provided]'}

---
App Version: ${APP_VERSION}
Browser: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
        `.trim();
        
        navigator.clipboard.writeText(summary).then(() => {
            showToast('Summary copied to clipboard!');
        }).catch(() => {
            alert('Failed to copy. Please select and copy manually.');
        });
    });
    
    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        generateFeedbackReport();
    });
}

function renderAttachments() {
    const list = document.getElementById('attachmentList');
    list.innerHTML = '';
    
    attachments.forEach((att, index) => {
        const item = document.createElement('div');
        item.className = 'attachment-item';
        
        const sizeKB = (att.size / 1024).toFixed(1);
        
        item.innerHTML = `
            <span class="attachment-name">${att.name}</span>
            <span class="attachment-size">${sizeKB} KB</span>
            <button type="button" class="attachment-remove" data-index="${index}">&times;</button>
        `;
        
        list.appendChild(item);
    });
    
    // Remove button handlers
    list.querySelectorAll('.attachment-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            attachments.splice(index, 1);
            renderAttachments();
        });
    });
}

function generateFeedbackReport() {
    const category = document.getElementById('issueCategory').value;
    const screen = document.getElementById('affectedScreen').value;
    const severity = document.getElementById('severity').value;
    const description = document.getElementById('feedbackDescription').value;
    const includeCaseDetails = document.getElementById('includeCaseDetails').checked;
    
    if (!category || !severity) {
        alert('Please select both Category and Severity.');
        return;
    }
    
    const report = {
        metadata: {
            appVersion: APP_VERSION,
            timestamp: new Date().toISOString(),
            browser: navigator.userAgent,
            currentStep: appState.currentStep
        },
        feedback: {
            category,
            affectedScreen: screen,
            severity,
            description
        },
        wizardState: sanitizeForReport(appState, !includeCaseDetails),
        attachments: attachments.map(att => ({
            name: att.name,
            size: att.size,
            type: att.type,
            data: att.data
        }))
    };
    
    // Create downloadable JSON
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `221g-wizard-feedback-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Report generated! Please send it to Rahvana support.');
    
    // Close modal and reset form
    document.getElementById('feedbackModal').classList.remove('active');
    document.getElementById('feedbackForm').reset();
    attachments = [];
    renderAttachments();
    document.getElementById('charCount').textContent = '0';
}

// ============================================
// PROGRESS INDICATOR
// ============================================

function updateProgress(step) {
    const indicator = document.getElementById('progressIndicator');
    if (step === 0) {
        indicator.style.display = 'none';
        return;
    }
    
    indicator.style.display = 'flex';
    
    const steps = indicator.querySelectorAll('.progress-step');
    steps.forEach((stepEl, index) => {
        stepEl.classList.remove('active', 'completed');
        if (index + 1 < step) {
            stepEl.classList.add('completed');
        } else if (index + 1 === step) {
            stepEl.classList.add('active');
        }
    });
}

// ============================================
// STEP RENDERING
// ============================================

function renderStep(step) {
    appState.currentStep = step;
    updateProgress(step);
    saveState();
    
    const mainContent = document.getElementById('mainContent');
    
    switch (step) {
        case 1:
            renderCaseBasics(mainContent);
            break;
        case 2:
            renderChecklistReplication(mainContent);
            break;
        case 3:
            renderReviewGenerate(mainContent);
            break;
        case 4:
            renderExportPacket(mainContent);
            break;
        default:
            mainContent.innerHTML = '';
    }
    
    window.scrollTo(0, 0);
}

// ============================================
// STEP 1: CASE BASICS
// ============================================

function renderCaseBasics(container) {
    container.innerHTML = `
        <div class="step-container">
            <div class="step-header">
                <h2 class="step-title">Case Basics</h2>
                <p class="step-description">Provide your basic case information to personalize your action plan.</p>
            </div>
            
            <form id="caseBasicsForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="visaType">Visa Type *</label>
                        <select id="visaType" required>
                            <option value="">Select...</option>
                            <option value="immigrant">Immigrant</option>
                            <option value="nonimmigrant">Nonimmigrant</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="visaCategory">Visa Category *</label>
                        <select id="visaCategory" required>
                            <option value="">Select...</option>
                            <option value="IR-1">IR-1 (Immediate Relative - Spouse)</option>
                            <option value="IR-2">IR-2 (Immediate Relative - Child)</option>
                            <option value="IR-5">IR-5 (Immediate Relative - Parent)</option>
                            <option value="CR-1">CR-1 (Conditional Resident - Spouse)</option>
                            <option value="F-1">F-1 (Family 1st Preference)</option>
                            <option value="F-2A">F-2A (Family 2nd Preference)</option>
                            <option value="F-3">F-3 (Family 3rd Preference)</option>
                            <option value="F-4">F-4 (Family 4th Preference)</option>
                            <option value="K-1">K-1 (Fiancé(e))</option>
                            <option value="K-3">K-3 (Spouse of U.S. Citizen)</option>
                            <option value="B-1/B-2">B-1/B-2 (Tourist/Business)</option>
                            <option value="F-1-student">F-1 (Student)</option>
                            <option value="other">Other (specify below)</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group" id="otherCategoryGroup" style="display: none;">
                    <label for="otherCategory">Specify Other Category</label>
                    <input type="text" id="otherCategory" placeholder="e.g., H-1B, L-1">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="interviewDate">Interview Date *</label>
                        <input type="date" id="interviewDate" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="ceacStatus">Current CEAC Status</label>
                        <select id="ceacStatus">
                            <option value="">Select...</option>
                            <option value="refused">Refused</option>
                            <option value="administrative-processing">Administrative Processing</option>
                            <option value="issued">Issued</option>
                            <option value="ready">Ready</option>
                            <option value="other">Other</option>
                        </select>
                        <p class="help-text">Check at <a href="https://ceac.state.gov/CEACStatTracker/Status.aspx" target="_blank">CEAC Status Tracker</a></p>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="consularPost">Consular Post / Embassy Location *</label>
                    <input type="text" id="consularPost" placeholder="e.g., U.S. Embassy Islamabad" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="caseNumber">Case Number (optional but recommended)</label>
                        <input type="text" id="caseNumber" placeholder="e.g., ISL2024123456">
                    </div>
                    
                    <div class="form-group">
                        <label for="beneficiaryName">Beneficiary Name (optional)</label>
                        <input type="text" id="beneficiaryName" placeholder="For cover letter personalization">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="passportNumber">Passport Number (optional)</label>
                    <input type="text" id="passportNumber" placeholder="For cover letter reference">
                </div>
                
                <div class="step-actions">
                    <button type="button" class="btn-secondary" onclick="resetState()">Reset Wizard</button>
                    <button type="submit" class="btn-primary">Continue to Checklist</button>
                </div>
            </form>
        </div>
    `;
    
    // Populate form with existing data
    const form = document.getElementById('caseBasicsForm');
    Object.keys(appState.caseBasics).forEach(key => {
        const input = form.querySelector(`#${key}`);
        if (input && appState.caseBasics[key]) {
            input.value = appState.caseBasics[key];
        }
    });
    
    // Show/hide other category field
    const categorySelect = document.getElementById('visaCategory');
    const otherGroup = document.getElementById('otherCategoryGroup');
    const otherInput = document.getElementById('otherCategory');
    
    categorySelect.addEventListener('change', () => {
        if (categorySelect.value === 'other') {
            otherGroup.style.display = 'block';
            otherInput.required = true;
        } else {
            otherGroup.style.display = 'none';
            otherInput.required = false;
        }
    });
    
    if (appState.caseBasics.visaCategory === 'other') {
        otherGroup.style.display = 'block';
        otherInput.required = true;
    }
    
    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Save form data
        appState.caseBasics = {
            visaType: document.getElementById('visaType').value,
            visaCategory: document.getElementById('visaCategory').value === 'other' 
                ? document.getElementById('otherCategory').value 
                : document.getElementById('visaCategory').value,
            interviewDate: document.getElementById('interviewDate').value,
            consularPost: document.getElementById('consularPost').value,
            ceacStatus: document.getElementById('ceacStatus').value,
            caseNumber: document.getElementById('caseNumber').value,
            beneficiaryName: document.getElementById('beneficiaryName').value,
            passportNumber: document.getElementById('passportNumber').value
        };
        
        saveState();
        renderStep(2);
    });
}

// ============================================
// STEP 2: CHECKLIST REPLICATION
// ============================================

function renderChecklistReplication(container) {
    container.innerHTML = `
        <div class="split-layout">
            <div class="split-panel">
                <h2 class="panel-title">Replicate Your 221(g) Letter</h2>
                <p style="font-size: 0.875rem; color: var(--color-gray-600); margin-bottom: 1.5rem;">
                    Check only the items that appear on YOUR 221(g) letter. This form mirrors typical checklist structure.
                </p>
                
                <form id="checklistForm">
                    <!-- Administrative Processing -->
                    <div class="checklist-section">
                        <h3 class="checklist-section-title">General Items</h3>
                        
                        <div class="checklist-item" data-item="adminProcessing">
                            <div class="checklist-item-header">
                                <input type="checkbox" id="adminProcessing">
                                <div class="checklist-item-content">
                                    <label for="adminProcessing" class="checklist-item-title">
                                        Administrative Processing (information only)
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div class="checklist-item" data-item="passport">
                            <div class="checklist-item-header">
                                <input type="checkbox" id="passport">
                                <div class="checklist-item-content">
                                    <label for="passport" class="checklist-item-title">
                                        Passport (submit via courier)
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div class="checklist-item" data-item="medical">
                            <div class="checklist-item-header">
                                <input type="checkbox" id="medical">
                                <div class="checklist-item-content">
                                    <label for="medical" class="checklist-item-title">
                                        Medical examination (through panel physician)
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- NADRA Documents (Pakistan-specific) -->
                    <div class="checklist-section">
                        <h3 class="checklist-section-title">Civil Documents (NADRA - Pakistan)</h3>
                        
                        ${renderChecklistItem('nadraFRC', 'Original NADRA Family Registration Certificate (courier)')}
                        ${renderChecklistItem('nadraBirthCert', 'Original NADRA Birth Certificate (courier)', true, 'nadraBirthCertFor', 'For (Petitioner/Beneficiary):')}
                        ${renderChecklistItem('nadraMarriageCert', 'Original NADRA Marriage Certificate (courier)')}
                        ${renderChecklistItem('nikahNama', 'Original Nikah Nama (courier)')}
                        ${renderChecklistItem('nadraDivorceCert', 'Original NADRA Divorce Certificate (courier)', true, 'nadraDivorceCertFor', 'For (Petitioner/Beneficiary):')}
                    </div>
                    
                    <!-- Other Civil Documents -->
                    <div class="checklist-section">
                        <h3 class="checklist-section-title">Other Documents</h3>
                        
                        ${renderChecklistItem('usDivorceCert', 'Original U.S. Divorce Decree or certified copy (courier)')}
                        ${renderChecklistItem('deathCert', 'Original Death Certificate (courier)', true, 'deathCertFor', 'For:')}
                        ${renderChecklistItem('policeCert', 'Original Police Certificate (courier)', true, 'policeCertCountry', 'For country:')}
                        ${renderChecklistItem('translation', 'English translation (courier)', true, 'translationOf', 'Of document:')}
                    </div>
                    
                    <!-- I-864 Section -->
                    <div class="checklist-section">
                        <h3 class="checklist-section-title">Financial Documents</h3>
                        
                        <div class="checklist-item" data-item="i864">
                            <div class="checklist-item-header">
                                <input type="checkbox" id="i864">
                                <div class="checklist-item-content">
                                    <label for="i864" class="checklist-item-title">
                                        I-864 Affidavit of Support (submit via courier)
                                    </label>
                                </div>
                            </div>
                            <div class="checklist-item-details" id="i864Details">
                                <div id="i864DetailsContent"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- DNA Test -->
                    <div class="checklist-section">
                        <h3 class="checklist-section-title">Additional Tests</h3>
                        
                        ${renderChecklistItem('dnaTest', 'DNA test recommended', true, 'dnaTestFor', 'For:')}
                    </div>
                    
                    <!-- Custom Items -->
                    <div class="checklist-section">
                        <h3 class="checklist-section-title">Other Items</h3>
                        <div id="customItemsContainer"></div>
                        <button type="button" id="addCustomItem" class="btn-outline">+ Add Custom Item</button>
                    </div>
                    
                    <div class="step-actions">
                        <button type="button" class="btn-secondary" onclick="renderStep(1)">Back</button>
                        <button type="button" class="btn-secondary" onclick="saveState(); showToast('Draft saved!')">Save Draft</button>
                        <button type="submit" class="btn-primary">Continue to Review</button>
                    </div>
                </form>
            </div>
            
            <div class="split-panel">
                <h2 class="panel-title">Live Preview</h2>
                <div id="livePreview" class="preview-content">
                    <div class="preview-empty">Select items from your 221(g) letter to see a preview</div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize checklist items
    initChecklistItems();
    
    // Initialize custom items
    renderCustomItems();
    
    // Add custom item button
    document.getElementById('addCustomItem').addEventListener('click', () => {
        const id = Date.now().toString();
        const label = prompt('Enter item name:');
        if (label) {
            appState.checklist.customItems.push({ id, label, notes: '', who: 'Beneficiary' });
            saveState();
            renderCustomItems();
            updateLivePreview();
        }
    });
    
    // Form submission
    document.getElementById('checklistForm').addEventListener('submit', (e) => {
        e.preventDefault();
        renderStep(3);
    });
    
    // Initial preview
    updateLivePreview();
}

function renderChecklistItem(id, label, hasDetail = false, detailId = '', detailLabel = '') {
    return `
        <div class="checklist-item" data-item="${id}">
            <div class="checklist-item-header">
                <input type="checkbox" id="${id}">
                <div class="checklist-item-content">
                    <label for="${id}" class="checklist-item-title">${label}</label>
                </div>
            </div>
            ${hasDetail ? `
                <div class="checklist-item-details">
                    <div class="detail-group">
                        <label class="detail-label">${detailLabel}</label>
                        <input type="text" id="${detailId}" class="form-group">
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function initChecklistItems() {
    // Set checkbox states
    Object.keys(appState.checklist).forEach(key => {
        if (typeof appState.checklist[key] === 'boolean') {
            const checkbox = document.getElementById(key);
            if (checkbox) {
                checkbox.checked = appState.checklist[key];
                const item = checkbox.closest('.checklist-item');
                if (item) {
                    item.classList.toggle('checked', checkbox.checked);
                }
            }
        }
    });
    
    // Set text field values
    ['nadraBirthCertFor', 'nadraDivorceCertFor', 'deathCertFor', 'policeCertCountry', 'translationOf', 'dnaTestFor'].forEach(field => {
        const input = document.getElementById(field);
        if (input && appState.checklist[field]) {
            input.value = appState.checklist[field];
        }
    });
    
    // Add change listeners to checkboxes
    document.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const item = e.target.closest('.checklist-item');
            item.classList.toggle('checked', e.target.checked);
            
            const key = e.target.id;
            appState.checklist[key] = e.target.checked;
            
            // Special handling for I-864
            if (key === 'i864') {
                if (e.target.checked) {
                    renderI864Details();
                } else {
                    document.getElementById('i864DetailsContent').innerHTML = '';
                }
            }
            
            saveState();
            updateLivePreview();
        });
    });
    
    // Add change listeners to text fields
    ['nadraBirthCertFor', 'nadraDivorceCertFor', 'deathCertFor', 'policeCertCountry', 'translationOf', 'dnaTestFor'].forEach(field => {
        const input = document.getElementById(field);
        if (input) {
            input.addEventListener('input', (e) => {
                appState.checklist[field] = e.target.value;
                saveState();
                updateLivePreview();
            });
        }
    });
    
    // Initialize I-864 if checked
    if (appState.checklist.i864) {
        document.getElementById('i864').checked = true;
        document.getElementById('i864').closest('.checklist-item').classList.add('checked');
        renderI864Details();
    }
}

function renderI864Details() {
    const container = document.getElementById('i864DetailsContent');
    
    container.innerHTML = `
        <div class="detail-group">
            <label class="detail-label">Sponsor Structure *</label>
            <div>
                <label class="radio-label">
                    <input type="radio" name="sponsorStructure" value="petitioner-only">
                    <span>Petitioner only</span>
                </label>
                <label class="radio-label">
                    <input type="radio" name="sponsorStructure" value="petitioner-hm">
                    <span>Petitioner + Household Member (I-864A)</span>
                </label>
                <label class="radio-label">
                    <input type="radio" name="sponsorStructure" value="joint-sponsor">
                    <span>Joint Sponsor (separate I-864)</span>
                </label>
                <label class="radio-label">
                    <input type="radio" name="sponsorStructure" value="joint-sponsor-hm">
                    <span>Joint Sponsor + Household Member (I-864A)</span>
                </label>
            </div>
        </div>
        
        <div class="detail-group">
            <label class="detail-label">Petitioner Name (optional but recommended)</label>
            <input type="text" id="petitionerName" placeholder="Petitioner's full name">
        </div>
        
        <div class="detail-group" id="jointSponsorNameGroup" style="display: none;">
            <label class="detail-label">Joint Sponsor Name</label>
            <input type="text" id="jointSponsorName" placeholder="Joint sponsor's full name">
        </div>
        
        <div class="detail-group" id="householdMemberNameGroup" style="display: none;">
            <label class="detail-label">Household Member Name</label>
            <input type="text" id="householdMemberName" placeholder="Household member's full name">
        </div>
        
        <div class="detail-group">
            <label class="detail-label">Forms Requested (check all that apply)</label>
            <label class="checkbox-label">
                <input type="checkbox" id="form-i864" value="i-864">
                <span>I-864 (Affidavit of Support)</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" id="form-i864a" value="i-864a">
                <span>I-864A (Contract Between Sponsor and Household Member)</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" id="form-i134" value="i-134">
                <span>I-134 (Affidavit of Support for nonimmigrant)</span>
            </label>
        </div>
        
        <div class="detail-group">
            <label class="detail-label">Evidence Requested (check all that apply)</label>
            <label class="checkbox-label">
                <input type="checkbox" id="ev-w2" value="w-2">
                <span>W-2 (Wage and Tax Statement)</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" id="ev-1040" value="1040">
                <span>Form 1040 (U.S. Individual Income Tax Return)</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" id="ev-irs" value="irs-transcript">
                <span>IRS Tax Return Transcript (preferred evidence per I-864 instructions)</span>
            </label>
            <p class="help-text">Get IRS transcripts at <a href="https://www.irs.gov/individuals/get-transcript" target="_blank">IRS.gov</a></p>
        </div>
        
        <div class="detail-group">
            <label class="detail-label">Status Documentation Requested</label>
            <label class="checkbox-label">
                <input type="checkbox" id="status-citizenship" value="citizenship">
                <span>Proof of U.S. Citizenship</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" id="status-lpr" value="lpr">
                <span>Proof of Lawful Permanent Resident Status</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" id="status-domicile" value="domicile">
                <span>Proof of U.S. Domicile</span>
            </label>
        </div>
        
        <div class="detail-group">
            <label class="detail-label">Tax Year(s) Requested</label>
            <input type="text" id="taxYears" placeholder="e.g., 2024, 2023, 2022">
            <p class="help-text">Enter the most recent tax year(s) requested on your letter</p>
        </div>
    `;
    
    // Restore saved values
    const details = appState.checklist.i864Details;
    
    if (details.sponsorStructure) {
        const radio = container.querySelector(`input[value="${details.sponsorStructure}"]`);
        if (radio) radio.checked = true;
        toggleSponsorFields(details.sponsorStructure);
    }
    
    ['petitionerName', 'jointSponsorName', 'householdMemberName', 'taxYears'].forEach(field => {
        const input = document.getElementById(field);
        if (input && details[field]) {
            input.value = details[field];
        }
    });
    
    details.formsRequested.forEach(form => {
        const checkbox = document.getElementById(`form-${form}`);
        if (checkbox) checkbox.checked = true;
    });
    
    details.evidenceRequested.forEach(ev => {
        const checkbox = document.getElementById(`ev-${ev}`);
        if (checkbox) checkbox.checked = true;
    });
    
    details.statusDocsRequested.forEach(status => {
        const checkbox = document.getElementById(`status-${status}`);
        if (checkbox) checkbox.checked = true;
    });
    
    // Add event listeners
    container.querySelectorAll('input[name="sponsorStructure"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            appState.checklist.i864Details.sponsorStructure = e.target.value;
            toggleSponsorFields(e.target.value);
            saveState();
            updateLivePreview();
        });
    });
    
    ['petitionerName', 'jointSponsorName', 'householdMemberName', 'taxYears'].forEach(field => {
        const input = document.getElementById(field);
        if (input) {
            input.addEventListener('input', (e) => {
                appState.checklist.i864Details[field] = e.target.value;
                saveState();
                updateLivePreview();
            });
        }
    });
    
    // Forms checkboxes
    ['i-864', 'i-864a', 'i-134'].forEach(form => {
        const checkbox = document.getElementById(`form-${form}`);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                appState.checklist.i864Details.formsRequested = Array.from(
                    container.querySelectorAll('input[id^="form-"]:checked')
                ).map(cb => cb.value);
                saveState();
                updateLivePreview();
            });
        }
    });
    
    // Evidence checkboxes
    ['w-2', '1040', 'irs-transcript'].forEach(ev => {
        const checkbox = document.getElementById(`ev-${ev}`);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                appState.checklist.i864Details.evidenceRequested = Array.from(
                    container.querySelectorAll('input[id^="ev-"]:checked')
                ).map(cb => cb.value);
                saveState();
                updateLivePreview();
            });
        }
    });
    
    // Status checkboxes
    ['citizenship', 'lpr', 'domicile'].forEach(status => {
        const checkbox = document.getElementById(`status-${status}`);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                appState.checklist.i864Details.statusDocsRequested = Array.from(
                    container.querySelectorAll('input[id^="status-"]:checked')
                ).map(cb => cb.value);
                saveState();
                updateLivePreview();
            });
        }
    });
}

function toggleSponsorFields(structure) {
    const jointGroup = document.getElementById('jointSponsorNameGroup');
    const hmGroup = document.getElementById('householdMemberNameGroup');
    
    jointGroup.style.display = (structure === 'joint-sponsor' || structure === 'joint-sponsor-hm') ? 'block' : 'none';
    hmGroup.style.display = (structure === 'petitioner-hm' || structure === 'joint-sponsor-hm') ? 'block' : 'none';
}

function renderCustomItems() {
    const container = document.getElementById('customItemsContainer');
    if (!container) return;
    
    container.innerHTML = appState.checklist.customItems.map(item => `
        <div class="checklist-item checked" data-custom-id="${item.id}">
            <div class="checklist-item-header">
                <div class="checklist-item-content" style="flex: 1;">
                    <div class="checklist-item-title">${item.label}</div>
                </div>
                <button type="button" class="attachment-remove" onclick="removeCustomItem('${item.id}')">&times;</button>
            </div>
            <div class="checklist-item-details" style="display: block;">
                <div class="detail-group">
                    <label class="detail-label">Who provides this?</label>
                    <select id="custom-who-${item.id}">
                        <option value="Beneficiary" ${item.who === 'Beneficiary' ? 'selected' : ''}>Beneficiary</option>
                        <option value="Petitioner" ${item.who === 'Petitioner' ? 'selected' : ''}>Petitioner</option>
                        <option value="Joint Sponsor" ${item.who === 'Joint Sponsor' ? 'selected' : ''}>Joint Sponsor</option>
                        <option value="Other" ${item.who === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="detail-group">
                    <label class="detail-label">Notes from officer (optional)</label>
                    <textarea id="custom-notes-${item.id}" rows="2">${item.notes || ''}</textarea>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add listeners
    appState.checklist.customItems.forEach(item => {
        const whoSelect = document.getElementById(`custom-who-${item.id}`);
        const notesInput = document.getElementById(`custom-notes-${item.id}`);
        
        if (whoSelect) {
            whoSelect.addEventListener('change', (e) => {
                const customItem = appState.checklist.customItems.find(i => i.id === item.id);
                if (customItem) {
                    customItem.who = e.target.value;
                    saveState();
                    updateLivePreview();
                }
            });
        }
        
        if (notesInput) {
            notesInput.addEventListener('input', (e) => {
                const customItem = appState.checklist.customItems.find(i => i.id === item.id);
                if (customItem) {
                    customItem.notes = e.target.value;
                    saveState();
                    updateLivePreview();
                }
            });
        }
    });
}

function removeCustomItem(id) {
    appState.checklist.customItems = appState.checklist.customItems.filter(item => item.id !== id);
    saveState();
    renderCustomItems();
    updateLivePreview();
}

function updateLivePreview() {
    const preview = document.getElementById('livePreview');
    if (!preview) return;
    
    const checkedItems = [];
    
    if (appState.checklist.adminProcessing) checkedItems.push('Administrative Processing');
    if (appState.checklist.passport) checkedItems.push('Passport');
    if (appState.checklist.medical) checkedItems.push('Medical Examination');
    if (appState.checklist.nadraFRC) checkedItems.push('NADRA Family Registration Certificate');
    if (appState.checklist.nadraBirthCert) {
        checkedItems.push(`NADRA Birth Certificate${appState.checklist.nadraBirthCertFor ? ' (' + appState.checklist.nadraBirthCertFor + ')' : ''}`);
    }
    if (appState.checklist.nadraMarriageCert) checkedItems.push('NADRA Marriage Certificate');
    if (appState.checklist.nikahNama) checkedItems.push('Nikah Nama');
    if (appState.checklist.nadraDivorceCert) {
        checkedItems.push(`NADRA Divorce Certificate${appState.checklist.nadraDivorceCertFor ? ' (' + appState.checklist.nadraDivorceCertFor + ')' : ''}`);
    }
    if (appState.checklist.usDivorceCert) checkedItems.push('U.S. Divorce Decree');
    if (appState.checklist.deathCert) {
        checkedItems.push(`Death Certificate${appState.checklist.deathCertFor ? ' (for ' + appState.checklist.deathCertFor + ')' : ''}`);
    }
    if (appState.checklist.policeCert) {
        checkedItems.push(`Police Certificate${appState.checklist.policeCertCountry ? ' (' + appState.checklist.policeCertCountry + ')' : ''}`);
    }
    if (appState.checklist.translation) {
        checkedItems.push(`English Translation${appState.checklist.translationOf ? ' (of ' + appState.checklist.translationOf + ')' : ''}`);
    }
    if (appState.checklist.i864) {
        const structure = appState.checklist.i864Details.sponsorStructure;
        if (structure) {
            checkedItems.push(`I-864 Affidavit of Support (${structure.replace(/-/g, ' ')})`);
        } else {
            checkedItems.push('I-864 Affidavit of Support (structure not selected)');
        }
    }
    if (appState.checklist.dnaTest) {
        checkedItems.push(`DNA Test${appState.checklist.dnaTestFor ? ' (for ' + appState.checklist.dnaTestFor + ')' : ''}`);
    }
    
    appState.checklist.customItems.forEach(item => {
        checkedItems.push(`${item.label} (${item.who})`);
    });
    
    if (checkedItems.length === 0) {
        preview.innerHTML = '<div class="preview-empty">Select items from your 221(g) letter to see a preview</div>';
    } else {
        preview.innerHTML = `
            <h4 style="margin-bottom: 1rem; color: var(--color-teal-primary);">Items You've Selected:</h4>
            <ul style="margin-left: 1.5rem; line-height: 2;">
                ${checkedItems.map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;
    }
}

// ============================================
// STEP 3: REVIEW & GENERATE
// ============================================

function renderReviewGenerate(container) {
    const validationErrors = validateInputs();
    
    container.innerHTML = `
        <div class="step-container">
            <div class="step-header">
                <h2 class="step-title">Review & Generate</h2>
                <p class="step-description">Review your case details and generate your personalized action plan.</p>
            </div>
            
            ${validationErrors.length > 0 ? `
                <div class="validation-alert">
                    <h3>⚠️ Please Complete Required Information</h3>
                    <ul>
                        ${validationErrors.map(err => `<li>${err}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <h3 style="margin-bottom: 1rem; font-size: 1.125rem;">Case Basics</h3>
            <table class="summary-table">
                <tr>
                    <th>Visa Type</th>
                    <td>${appState.caseBasics.visaType}</td>
                </tr>
                <tr>
                    <th>Visa Category</th>
                    <td>${appState.caseBasics.visaCategory}</td>
                </tr>
                <tr>
                    <th>Interview Date</th>
                    <td>${formatDate(appState.caseBasics.interviewDate)}</td>
                </tr>
                <tr>
                    <th>Consular Post</th>
                    <td>${appState.caseBasics.consularPost}</td>
                </tr>
                ${appState.caseBasics.caseNumber ? `
                <tr>
                    <th>Case Number</th>
                    <td>${appState.caseBasics.caseNumber}</td>
                </tr>
                ` : ''}
            </table>
            
            <h3 style="margin: 2rem 0 1rem; font-size: 1.125rem;">Requested Documents</h3>
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Document</th>
                        <th>Who Provides</th>
                        <th>How to Submit</th>
                    </tr>
                </thead>
                <tbody id="documentSummary">
                </tbody>
            </table>
            
            <div class="step-actions">
                <button type="button" class="btn-secondary" onclick="renderStep(2)">Back to Checklist</button>
                <button type="button" class="btn-primary" id="generateBtn" ${validationErrors.length > 0 ? 'disabled' : ''}>
                    Generate Action Plan & Documents
                </button>
            </div>
        </div>
    `;
    
    // Populate document summary
    populateDocumentSummary();
    
    // Generate button
    document.getElementById('generateBtn').addEventListener('click', () => {
        generateOutputs();
        renderStep(4);
    });
}

function validateInputs() {
    const errors = [];
    
    if (!appState.caseBasics.visaType) errors.push('Visa type is required');
    if (!appState.caseBasics.visaCategory) errors.push('Visa category is required');
    if (!appState.caseBasics.interviewDate) errors.push('Interview date is required');
    if (!appState.caseBasics.consularPost) errors.push('Consular post is required');
    
    if (appState.checklist.i864 && !appState.checklist.i864Details.sponsorStructure) {
        errors.push('I-864 sponsor structure must be selected');
    }
    
    return errors;
}

function populateDocumentSummary() {
    const tbody = document.getElementById('documentSummary');
    const rows = [];
    
    if (appState.checklist.passport) {
        rows.push(['Passport', 'Beneficiary', 'Courier (per letter)']);
    }
    
    if (appState.checklist.medical) {
        rows.push(['Medical Examination', 'Beneficiary', 'Panel Physician']);
    }
    
    if (appState.checklist.nadraFRC) {
        rows.push(['NADRA Family Registration Certificate', 'Varies', 'Courier']);
    }
    
    if (appState.checklist.nadraBirthCert) {
        rows.push([
            'NADRA Birth Certificate',
            appState.checklist.nadraBirthCertFor || 'As indicated',
            'Courier'
        ]);
    }
    
    if (appState.checklist.nadraMarriageCert) {
        rows.push(['NADRA Marriage Certificate', 'Beneficiary/Petitioner', 'Courier']);
    }
    
    if (appState.checklist.nikahNama) {
        rows.push(['Nikah Nama', 'Beneficiary/Petitioner', 'Courier']);
    }
    
    if (appState.checklist.nadraDivorceCert) {
        rows.push([
            'NADRA Divorce Certificate',
            appState.checklist.nadraDivorceCertFor || 'As indicated',
            'Courier'
        ]);
    }
    
    if (appState.checklist.usDivorceCert) {
        rows.push(['U.S. Divorce Decree', 'Petitioner (if applicable)', 'Courier']);
    }
    
    if (appState.checklist.deathCert) {
        rows.push([
            'Death Certificate',
            appState.checklist.deathCertFor || 'As indicated',
            'Courier'
        ]);
    }
    
    if (appState.checklist.policeCert) {
        rows.push([
            `Police Certificate (${appState.checklist.policeCertCountry || 'specified country'})`,
            'Beneficiary',
            'Courier'
        ]);
    }
    
    if (appState.checklist.translation) {
        rows.push([
            `English Translation (${appState.checklist.translationOf || 'specified document'})`,
            'As needed',
            'Courier'
        ]);
    }
    
    if (appState.checklist.i864) {
        const structure = appState.checklist.i864Details.sponsorStructure;
        if (structure === 'petitioner-only') {
            rows.push(['I-864 Affidavit of Support', 'Petitioner', 'Courier']);
            rows.push(['Tax & Financial Evidence', 'Petitioner', 'Courier']);
        } else if (structure === 'petitioner-hm') {
            rows.push(['I-864 Affidavit of Support', 'Petitioner', 'Courier']);
            rows.push(['I-864A Contract', 'Household Member', 'Courier']);
            rows.push(['Tax & Financial Evidence', 'Petitioner + HM', 'Courier']);
        } else if (structure === 'joint-sponsor') {
            rows.push(['I-864 Affidavit of Support', 'Petitioner', 'Courier']);
            rows.push(['I-864 Affidavit of Support', 'Joint Sponsor', 'Courier']);
            rows.push(['Tax & Financial Evidence', 'Both Sponsors', 'Courier']);
        } else if (structure === 'joint-sponsor-hm') {
            rows.push(['I-864 Affidavit of Support', 'Joint Sponsor', 'Courier']);
            rows.push(['I-864A Contract', 'Household Member', 'Courier']);
            rows.push(['Tax & Financial Evidence', 'JS + HM', 'Courier']);
        }
    }
    
    if (appState.checklist.dnaTest) {
        rows.push([
            `DNA Test (${appState.checklist.dnaTestFor || 'specified persons'})`,
            'Beneficiary + Petitioner',
            'Designated Lab'
        ]);
    }
    
    appState.checklist.customItems.forEach(item => {
        rows.push([item.label, item.who, 'Per Letter']);
    });
    
    tbody.innerHTML = rows.map(row => `
        <tr>
            <td>${row[0]}</td>
            <td>${row[1]}</td>
            <td>${row[2]}</td>
        </tr>
    `).join('');
}

// ============================================
// OUTPUT GENERATION
// ============================================

function generateOutputs() {
    appState.generatedOutputs.actionPlan = generateActionPlan();
    appState.generatedOutputs.packetChecklist = generatePacketChecklist();
    appState.generatedOutputs.coverLetter = generateCoverLetter();
    saveState();
}

function generateActionPlan() {
    const cb = appState.caseBasics;
    const cl = appState.checklist;
    
    let plan = `# 221(g) ACTION PLAN\n\n`;
    plan += `Generated: ${new Date().toLocaleDateString()}\n`;
    plan += `For: ${cb.beneficiaryName || 'Beneficiary'}\n`;
    plan += `Case: ${cb.caseNumber || 'Not provided'}\n\n`;
    
    plan += `## IMPORTANT DISCLAIMER\n\n`;
    plan += `This action plan is based on the information you provided and is for general guidance only. It is NOT legal advice. Always follow your embassy's 221(g) letter instructions if anything differs from this plan. For complex cases, consult an immigration attorney. Processing times vary and we cannot guarantee visa issuance or specific timelines.\n\n`;
    
    plan += `## SUMMARY\n\n`;
    plan += `Your visa interview on ${formatDate(cb.interviewDate)} at ${cb.consularPost} resulted in a temporary refusal under INA Section 221(g). This means the consular officer needs additional documents or administrative processing before making a final decision.\n\n`;
    
    plan += `Based on your checklist, you must submit the following:\n`;
    const itemCount = Object.keys(cl).filter(k => typeof cl[k] === 'boolean' && cl[k]).length + cl.customItems.length;
    plan += `- ${itemCount} total items requested\n`;
    if (cl.i864) plan += `- Financial sponsorship documents (I-864 package)\n`;
    if (cl.passport) plan += `- Your passport for visa placement\n`;
    if (cl.adminProcessing) plan += `- Additional administrative processing (timing varies)\n\n`;
    
    plan += `## IMMEDIATE NEXT STEPS\n\n`;
    plan += `1. **Gather Documents by Provider**\n\n`;
    
    // Beneficiary docs
    const benDocs = [];
    if (cl.passport) benDocs.push('Passport');
    if (cl.medical) benDocs.push('Medical examination results');
    if (cl.policeCert) benDocs.push(`Police certificate (${cl.policeCertCountry || 'specified country'})`);
    if (cl.nadraBirthCert && cl.nadraBirthCertFor === 'Beneficiary') benDocs.push('NADRA Birth Certificate');
    if (cl.nadraDivorceCert && cl.nadraDivorceCertFor === 'Beneficiary') benDocs.push('NADRA Divorce Certificate');
    
    if (benDocs.length > 0) {
        plan += `   **Beneficiary to provide:**\n`;
        benDocs.forEach(doc => plan += `   - ${doc}\n`);
        plan += `\n`;
    }
    
    // Petitioner docs
    const petDocs = [];
    if (cl.i864 && (cl.i864Details.sponsorStructure === 'petitioner-only' || cl.i864Details.sponsorStructure === 'petitioner-hm')) {
        petDocs.push('I-864 Affidavit of Support');
        petDocs.push('Tax returns and financial evidence');
    }
    if (cl.usDivorceCert) petDocs.push('U.S. Divorce Decree');
    if (cl.nadraBirthCert && cl.nadraBirthCertFor === 'Petitioner') petDocs.push('NADRA Birth Certificate');
    if (cl.nadraDivorceCert && cl.nadraDivorceCertFor === 'Petitioner') petDocs.push('NADRA Divorce Certificate');
    
    if (petDocs.length > 0) {
        plan += `   **Petitioner to provide:**\n`;
        petDocs.forEach(doc => plan += `   - ${doc}\n`);
        plan += `\n`;
    }
    
    // Joint sponsor
    if (cl.i864 && (cl.i864Details.sponsorStructure === 'joint-sponsor' || cl.i864Details.sponsorStructure === 'joint-sponsor-hm')) {
        plan += `   **Joint Sponsor to provide:**\n`;
        plan += `   - I-864 Affidavit of Support\n`;
        plan += `   - Tax returns and financial evidence\n`;
        plan += `   - Proof of U.S. status and domicile\n\n`;
    }
    
    // Household member
    if (cl.i864 && (cl.i864Details.sponsorStructure === 'petitioner-hm' || cl.i864Details.sponsorStructure === 'joint-sponsor-hm')) {
        plan += `   **Household Member to provide:**\n`;
        plan += `   - I-864A Contract Between Sponsor and Household Member\n`;
        plan += `   - Tax returns and financial evidence\n\n`;
    }
    
    plan += `2. **Prepare Translations**\n`;
    if (cl.translation) {
        plan += `   You indicated that English translations are required for: ${cl.translationOf || 'specified documents'}. All translations must be certified and include a statement of translator competency.\n\n`;
    } else {
        plan += `   If any documents are not in English, they must be accompanied by certified English translations.\n\n`;
    }
    
    plan += `3. **Assemble Your Packet**\n`;
    plan += `   Organize documents in the order shown in the Packet Assembly Checklist. Place the cover letter first, followed by a copy of your 221(g) letter.\n\n`;
    
    plan += `4. **Submit Per Embassy Instructions**\n`;
    plan += `   Follow the submission method specified on your 221(g) letter. Most embassies use designated courier services. Do NOT mail documents directly to the embassy unless instructed.\n\n`;
    
    plan += `5. **Track and Wait**\n`;
    plan += `   After submission, check your CEAC status regularly at https://ceac.state.gov/CEACStatTracker/Status.aspx. Administrative processing duration varies by case and cannot be predicted. If your case enters administrative processing, additional security checks may be required, and timing is outside embassy control.\n\n`;
    plan += `   Source: U.S. Department of State - https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/administrative-processing-information.html\n\n`;
    
    plan += `## DOCUMENT-BY-DOCUMENT INSTRUCTIONS\n\n`;
    
    if (cl.passport) {
        plan += `### Passport\n`;
        plan += `**What to submit:** Original passport with at least 6 months validity beyond intended U.S. entry date.\n`;
        plan += `**Who provides:** Beneficiary\n`;
        plan += `**How to prepare:** Submit via courier service as instructed on your 221(g) letter. Keep photocopies for your records.\n`;
        plan += `**Common mistakes to avoid:**\n`;
        plan += `- Submitting an expired or nearly-expired passport\n`;
        plan += `- Sending passport via regular mail instead of designated courier\n\n`;
    }
    
    if (cl.medical) {
        plan += `### Medical Examination\n`;
        plan += `**What to submit:** Completed DS-2054 form (sealed) from a panel physician.\n`;
        plan += `**Who provides:** Beneficiary\n`;
        plan += `**How to prepare:** Schedule with a U.S. embassy-approved panel physician. They will provide sealed results.\n`;
        plan += `**Common mistakes to avoid:**\n`;
        plan += `- Using a non-panel physician\n`;
        plan += `- Opening the sealed envelope\n\n`;
    }
    
    if (cl.i864) {
        plan += `### I-864 Affidavit of Support Package\n\n`;
        
        const details = cl.i864Details;
        const structure = details.sponsorStructure;
        
        if (structure === 'petitioner-only') {
            plan += `**Sponsor Structure:** Petitioner only\n\n`;
            plan += `**Petitioner must submit:**\n\n`;
        } else if (structure === 'petitioner-hm') {
            plan += `**Sponsor Structure:** Petitioner with Household Member\n\n`;
            plan += `**Petitioner must submit:**\n`;
        } else if (structure === 'joint-sponsor') {
            plan += `**Sponsor Structure:** Joint Sponsor (separate from petitioner)\n\n`;
            plan += `**Both petitioner and joint sponsor must each submit:**\n`;
        } else if (structure === 'joint-sponsor-hm') {
            plan += `**Sponsor Structure:** Joint Sponsor with Household Member\n\n`;
            plan += `**Joint Sponsor must submit:**\n`;
        }
        
        plan += `1. Form I-864 Affidavit of Support (signed and dated)\n`;
        plan += `   - Complete all sections\n`;
        plan += `   - Sign in blue ink\n`;
        plan += `   - Date within 6 months of submission\n`;
        plan += `   - Source: https://www.uscis.gov/i-864\n\n`;
        
        if (structure === 'petitioner-hm' || structure === 'joint-sponsor-hm') {
            plan += `2. Form I-864A Contract Between Sponsor and Household Member\n`;
            plan += `   - Signed by both sponsor and household member\n`;
            plan += `   - Source: https://www.uscis.gov/i-864a\n\n`;
        }
        
        plan += `${structure.includes('hm') ? '3' : '2'}. Tax Evidence (for each sponsor):\n`;
        if (details.evidenceRequested.includes('irs-transcript')) {
            plan += `   - **IRS Tax Return Transcript (PREFERRED):** Order at https://www.irs.gov/individuals/get-transcript\n`;
            plan += `     This is the IRS-generated transcript of your tax return, not the return itself.\n`;
        }
        if (details.evidenceRequested.includes('1040')) {
            plan += `   - Form 1040 (if transcript unavailable): Photocopy of complete return\n`;
        }
        if (details.evidenceRequested.includes('w-2')) {
            plan += `   - W-2 forms: For all employment income\n`;
        }
        plan += `   - Tax years: ${details.taxYears || 'Most recent year as indicated on letter'}\n\n`;
        
        plan += `${structure.includes('hm') ? '4' : '3'}. Proof of Status:\n`;
        if (details.statusDocsRequested.includes('citizenship')) {
            plan += `   - U.S. Birth Certificate, U.S. Passport, or Naturalization Certificate\n`;
        }
        if (details.statusDocsRequested.includes('lpr')) {
            plan += `   - Green Card (front and back photocopy)\n`;
        }
        if (details.statusDocsRequested.includes('domicile')) {
            plan += `   - Proof of U.S. domicile: Lease, mortgage, utility bills, employment letter\n`;
        }
        plan += `\n`;
        
        plan += `**Common mistakes to avoid:**\n`;
        plan += `- Using an outdated I-864 form version\n`;
        plan += `- Submitting tax returns instead of IRS transcripts when transcripts are requested\n`;
        plan += `- Missing signatures or dates\n`;
        plan += `- Not including household member income when needed to meet requirements\n\n`;
    }
    
    if (cl.nadraFRC || cl.nadraBirthCert || cl.nadraMarriageCert || cl.nikahNama || cl.nadraDivorceCert) {
        plan += `### NADRA Civil Documents\n`;
        plan += `**What to submit:** Original certificates issued by Pakistan's National Database and Registration Authority (NADRA).\n`;
        plan += `**Who provides:** As indicated on your letter (beneficiary or petitioner)\n`;
        plan += `**How to prepare:** Obtain originals from NADRA. Ensure names and dates match other documents.\n`;
        plan += `**Common mistakes to avoid:**\n`;
        plan += `- Submitting photocopies instead of originals when originals are required\n`;
        plan += `- Name spelling discrepancies across documents\n\n`;
    }
    
    if (cl.translation) {
        plan += `### English Translations\n`;
        plan += `**What to submit:** Certified English translation of: ${cl.translationOf || 'specified documents'}\n`;
        plan += `**Who provides:** Professional translator\n`;
        plan += `**How to prepare:** Translation must include:\n`;
        plan += `- Full translation of all text\n`;
        plan += `- Translator's certification of accuracy and competency\n`;
        plan += `- Translator's signature and contact information\n`;
        plan += `**Common mistakes to avoid:**\n`;
        plan += `- Using uncertified translations\n`;
        plan += `- Partial translations\n\n`;
    }
    
    if (cl.dnaTest) {
        plan += `### DNA Test\n`;
        plan += `**What to submit:** DNA test results from a AABB-accredited laboratory.\n`;
        plan += `**Who provides:** ${cl.dnaTestFor || 'Specified parties'}\n`;
        plan += `**How to prepare:** Contact the embassy for approved laboratory list. Both parties must test at approved facilities.\n`;
        plan += `**Common mistakes to avoid:**\n`;
        plan += `- Using a non-approved laboratory\n`;
        plan += `- Incomplete chain of custody documentation\n\n`;
    }
    
    cl.customItems.forEach(item => {
        plan += `### ${item.label}\n`;
        plan += `**Who provides:** ${item.who}\n`;
        if (item.notes) {
            plan += `**Officer notes:** ${item.notes}\n`;
        }
        plan += `**How to prepare:** Follow the specific instructions on your 221(g) letter for this item.\n\n`;
    });
    
    plan += `## EXPECTED TIMING & FOLLOW-UP\n\n`;
    plan += `**After Submission:**\n`;
    plan += `- Confirm courier delivery (keep tracking number)\n`;
    plan += `- Keep copies of all submitted documents\n`;
    plan += `- Monitor CEAC status weekly\n\n`;
    
    plan += `**Status Monitoring:**\n`;
    plan += `Check https://ceac.state.gov/CEACStatTracker/Status.aspx regularly. Status meanings:\n`;
    plan += `- **Refused:** Documents under review or administrative processing ongoing\n`;
    plan += `- **Administrative Processing:** Security checks or additional review in progress\n`;
    plan += `- **Issued:** Visa approved\n`;
    plan += `- **Ready:** Passport ready for pickup\n\n`;
    
    plan += `**Important Notes on Timing:**\n`;
    plan += `- Document review typically takes several weeks, but timing varies widely\n`;
    plan += `- Administrative processing duration cannot be predicted and may take additional time\n`;
    plan += `- Embassies cannot expedite administrative processing\n`;
    plan += `- Per U.S. Department of State guidance, processing times vary by individual case circumstances\n\n`;
    
    plan += `**If No Update After Several Weeks:**\n`;
    plan += `- Verify documents were received via courier tracking\n`;
    plan += `- Check CEAC status remains current\n`;
    plan += `- Consider polite inquiry per embassy's contact procedures\n`;
    plan += `- Do NOT repeatedly contact the embassy as this does not expedite processing\n\n`;
    
    plan += `## FINAL REMINDERS\n\n`;
    plan += `✓ Follow your embassy's 221(g) letter instructions above all else\n`;
    plan += `✓ Submit ONLY what was requested - do not add unrequested documents\n`;
    plan += `✓ Keep copies of everything you submit\n`;
    plan += `✓ Use the designated courier service specified by your embassy\n`;
    plan += `✓ Be patient - processing times vary and cannot be guaranteed\n`;
    plan += `✓ For complex cases, consult an immigration attorney\n\n`;
    
    plan += `This action plan is based on your inputs and general guidance. It is not legal advice.\n`;
    
    return plan;
}

function generatePacketChecklist() {
    const cb = appState.caseBasics;
    const cl = appState.checklist;
    
    let checklist = `# PACKET ASSEMBLY CHECKLIST\n\n`;
    checklist += `Assemble your documents in this order:\n\n`;
    
    let num = 1;
    
    checklist += `${num}. Cover Letter (see Cover Letter tab)\n`;
    num++;
    
    checklist += `${num}. Copy of 221(g) Letter (recommended)\n`;
    num++;
    
    // Beneficiary documents
    checklist += `\n**BENEFICIARY DOCUMENTS**\n\n`;
    if (cl.passport) {
        checklist += `${num}. Passport (original)\n`;
        num++;
    }
    if (cl.medical) {
        checklist += `${num}. Medical Examination Results (sealed envelope)\n`;
        num++;
    }
    if (cl.nadraBirthCert && cl.nadraBirthCertFor === 'Beneficiary') {
        checklist += `${num}. NADRA Birth Certificate (original)\n`;
        num++;
    }
    if (cl.policeCert) {
        checklist += `${num}. Police Certificate - ${cl.policeCertCountry || 'Specified Country'} (original)\n`;
        num++;
    }
    
    // Petitioner/Sponsor documents
    if (cl.i864 || cl.usDivorceCert || (cl.nadraBirthCert && cl.nadraBirthCertFor === 'Petitioner')) {
        checklist += `\n**PETITIONER/SPONSOR DOCUMENTS**\n\n`;
        
        if (cl.i864) {
            const structure = cl.i864Details.sponsorStructure;
            if (structure === 'petitioner-only' || structure === 'petitioner-hm') {
                checklist += `${num}. I-864 Affidavit of Support (signed, dated)\n`;
                num++;
                
                if (cl.i864Details.evidenceRequested.includes('irs-transcript')) {
                    checklist += `${num}. IRS Tax Return Transcript(s)\n`;
                    num++;
                }
                if (cl.i864Details.evidenceRequested.includes('1040')) {
                    checklist += `${num}. Form 1040 Tax Return(s)\n`;
                    num++;
                }
                if (cl.i864Details.evidenceRequested.includes('w-2')) {
                    checklist += `${num}. W-2 Form(s)\n`;
                    num++;
                }
                if (cl.i864Details.statusDocsRequested.length > 0) {
                    checklist += `${num}. Proof of U.S. Status (citizenship/LPR)\n`;
                    num++;
                }
                if (cl.i864Details.statusDocsRequested.includes('domicile')) {
                    checklist += `${num}. Proof of U.S. Domicile\n`;
                    num++;
                }
            }
        }
        
        if (cl.usDivorceCert) {
            checklist += `${num}. U.S. Divorce Decree (original or certified copy)\n`;
            num++;
        }
        
        if (cl.nadraBirthCert && cl.nadraBirthCertFor === 'Petitioner') {
            checklist += `${num}. NADRA Birth Certificate (original)\n`;
            num++;
        }
    }
    
    // Joint Sponsor documents
    if (cl.i864 && (cl.i864Details.sponsorStructure === 'joint-sponsor' || cl.i864Details.sponsorStructure === 'joint-sponsor-hm')) {
        checklist += `\n**JOINT SPONSOR DOCUMENTS**\n\n`;
        checklist += `${num}. I-864 Affidavit of Support (signed, dated)\n`;
        num++;
        checklist += `${num}. Tax and Financial Evidence (same as above)\n`;
        num++;
        checklist += `${num}. Proof of U.S. Status and Domicile\n`;
        num++;
    }
    
    // Household Member documents
    if (cl.i864 && (cl.i864Details.sponsorStructure === 'petitioner-hm' || cl.i864Details.sponsorStructure === 'joint-sponsor-hm')) {
        checklist += `\n**HOUSEHOLD MEMBER DOCUMENTS**\n\n`;
        checklist += `${num}. I-864A Contract (signed by both parties)\n`;
        num++;
        checklist += `${num}. Tax and Financial Evidence\n`;
        num++;
    }
    
    // Civil documents
    const civilDocs = [];
    if (cl.nadraFRC) civilDocs.push('NADRA Family Registration Certificate');
    if (cl.nadraMarriageCert) civilDocs.push('NADRA Marriage Certificate');
    if (cl.nikahNama) civilDocs.push('Nikah Nama');
    if (cl.nadraDivorceCert) civilDocs.push(`NADRA Divorce Certificate (${cl.nadraDivorceCertFor || 'as indicated'})`);
    if (cl.deathCert) civilDocs.push(`Death Certificate (${cl.deathCertFor || 'as indicated'})`);
    
    if (civilDocs.length > 0) {
        checklist += `\n**CIVIL DOCUMENTS**\n\n`;
        civilDocs.forEach(doc => {
            checklist += `${num}. ${doc} (original)\n`;
            num++;
        });
    }
    
    // Translations
    if (cl.translation) {
        checklist += `\n**TRANSLATIONS**\n\n`;
        checklist += `${num}. Certified English Translation of: ${cl.translationOf || 'Specified Documents'}\n`;
        num++;
    }
    
    // DNA
    if (cl.dnaTest) {
        checklist += `\n**DNA TEST**\n\n`;
        checklist += `${num}. DNA Test Results (${cl.dnaTestFor || 'specified parties'})\n`;
        num++;
    }
    
    // Custom items
    if (cl.customItems.length > 0) {
        checklist += `\n**OTHER REQUESTED ITEMS**\n\n`;
        cl.customItems.forEach(item => {
            checklist += `${num}. ${item.label} (${item.who})\n`;
            num++;
        });
    }
    
    checklist += `\n\n## BEFORE YOU SUBMIT - FINAL CHECKS\n\n`;
    checklist += `☐ Cover letter is signed and dated\n`;
    checklist += `☐ All documents are in the correct order\n`;
    checklist += `☐ Originals are included where required (not photocopies)\n`;
    checklist += `☐ All signatures are in blue ink where required\n`;
    checklist += `☐ All forms are dated within 6 months\n`;
    checklist += `☐ Translations are certified and complete\n`;
    checklist += `☐ Names and dates are consistent across all documents\n`;
    checklist += `☐ You have kept photocopies of everything\n`;
    checklist += `☐ Courier tracking number is recorded\n`;
    checklist += `☐ You know how to check CEAC status\n\n`;
    
    checklist += `**REMEMBER:** Follow your embassy's 221(g) letter instructions if anything differs from this checklist.\n`;
    
    return checklist;
}

function generateCoverLetter() {
    const cb = appState.caseBasics;
    const cl = appState.checklist;
    
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    let letter = `${today}\n\n`;
    letter += `${cb.consularPost}\n`;
    letter += `Immigrant Visa Unit\n\n`;
    letter += `**Subject: Response to INA 221(g) Refusal`;
    if (cb.caseNumber) letter += ` – Case Number: ${cb.caseNumber}`;
    if (cb.beneficiaryName) letter += ` – ${cb.beneficiaryName}`;
    letter += `**\n\n`;
    
    letter += `Dear Consular Officer,\n\n`;
    
    letter += `I am writing in response to the Section 221(g) refusal issued following my immigrant visa interview on ${formatDate(cb.interviewDate)}. `;
    letter += `I am submitting the requested documents as instructed.\n\n`;
    
    letter += `**Applicant Information:**\n`;
    if (cb.beneficiaryName) letter += `- Full Name: ${cb.beneficiaryName}\n`;
    if (cb.passportNumber) letter += `- Passport Number: ${cb.passportNumber}\n`;
    letter += `- Interview Date: ${formatDate(cb.interviewDate)}\n`;
    if (cb.caseNumber) letter += `- Case Number: ${cb.caseNumber}\n`;
    letter += `- Visa Category: ${cb.visaCategory}\n\n`;

    letter += `**Enclosed Documents:**\n\n`;

// Build document list
const docList = [];
if (cl.passport) docList.push('Passport (original)');
if (cl.medical) docList.push('Medical examination results (sealed)');

if (cl.i864) {
    const structure = cl.i864Details.sponsorStructure;
    if (structure === 'petitioner-only') {
        docList.push('I-864 Affidavit of Support from petitioner');
        docList.push('Tax and financial evidence for petitioner');
    } else if (structure === 'petitioner-hm') {
        docList.push('I-864 Affidavit of Support from petitioner');
        docList.push('I-864A Contract with household member');
        docList.push('Tax and financial evidence for petitioner and household member');
    } else if (structure === 'joint-sponsor') {
        docList.push('I-864 Affidavit of Support from petitioner');
        docList.push('I-864 Affidavit of Support from joint sponsor');
        docList.push('Tax and financial evidence for both sponsors');
    } else if (structure === 'joint-sponsor-hm') {
        docList.push('I-864 Affidavit of Support from joint sponsor');
        docList.push('I-864A Contract with household member');
        docList.push('Tax and financial evidence for joint sponsor and household member');
    }
}

if (cl.nadraFRC) docList.push('NADRA Family Registration Certificate (original)');
if (cl.nadraBirthCert) docList.push(`NADRA Birth Certificate for ${cl.nadraBirthCertFor || 'indicated party'} (original)`);
if (cl.nadraMarriageCert) docList.push('NADRA Marriage Certificate (original)');
if (cl.nikahNama) docList.push('Nikah Nama (original)');
if (cl.nadraDivorceCert) docList.push(`NADRA Divorce Certificate for ${cl.nadraDivorceCertFor || 'indicated party'} (original)`);
if (cl.usDivorceCert) docList.push('U.S. Divorce Decree (original or certified copy)');
if (cl.deathCert) docList.push(`Death Certificate for ${cl.deathCertFor || 'indicated party'} (original)`);
if (cl.policeCert) docList.push(`Police Certificate from ${cl.policeCertCountry || 'specified country'} (original)`);
if (cl.translation) docList.push(`Certified English translation of ${cl.translationOf || 'specified documents'}`);
if (cl.dnaTest) docList.push(`DNA test results for ${cl.dnaTestFor || 'specified parties'}`);

cl.customItems.forEach(item => {
    docList.push(item.label);
});

// Format as table
letter += `| # | Document |\n`;
letter += `|---|----------|\n`;
docList.forEach((doc, index) => {
    letter += `| ${index + 1} | ${doc} |\n`;
});

letter += `\n`;
letter += `All documents are submitted in accordance with the instructions provided in the 221(g) letter. `;
letter += `I have included originals where required and have retained photocopies for my records.\n\n`;

letter += `I respectfully request that you review these documents at your earliest convenience. `;
letter += `Please do not hesitate to contact me if additional information is needed.\n\n`;

letter += `Thank you for your time and consideration.\n\n`;
letter += `Sincerely,\n\n`;
letter += `${cb.beneficiaryName || '[Your Full Name]'}\n`;
if (cb.passportNumber) letter += `Passport: ${cb.passportNumber}\n`;
letter += `[Your Email Address]\n`;
letter += `[Your Phone Number]\n`;

return letter;
}
// ============================================
// STEP 4: EXPORT PACKET
// ============================================
function renderExportPacket(container) {
container.innerHTML = `
<div class="step-container">
<div class="step-header">
<h2 class="step-title">Your 221(g) Response Package</h2>
<p class="step-description">Your personalized documents are ready. Review, print, or copy as needed.</p>
</div>
        <div class="disclaimer" style="margin-bottom: 2rem;">
            <strong>Important:</strong> These documents are based on the information you provided. Always follow your embassy's 221(g) letter instructions if anything differs. This is not legal advice.
        </div>
        
        <div class="output-tabs">
            <button class="tab-btn active" data-tab="actionPlan">Action Plan</button>
            <button class="tab-btn" data-tab="checklist">Packet Checklist</button>
            <button class="tab-btn" data-tab="coverLetter">Cover Letter</button>
        </div>
        
        <div class="tab-content active" data-tab="actionPlan">
            <div class="output-content" id="actionPlanContent"></div>
            <div class="output-actions">
                <button class="btn-secondary" onclick="copyToClipboard('actionPlan')">
                    📋 Copy to Clipboard
                </button>
                <button class="btn-primary" onclick="printContent('actionPlan')">
                    🖨️ Print Action Plan
                </button>
            </div>
        </div>
        
        <div class="tab-content" data-tab="checklist">
            <div class="output-content" id="checklistContent"></div>
            <div class="output-actions">
                <button class="btn-secondary" onclick="copyToClipboard('checklist')">
                    📋 Copy to Clipboard
                </button>
                <button class="btn-primary" onclick="printContent('checklist')">
                    🖨️ Print Checklist
                </button>
            </div>
        </div>
        
        <div class="tab-content" data-tab="coverLetter">
            <div class="output-content" id="coverLetterContent"></div>
            <div class="output-actions">
                <button class="btn-secondary" onclick="copyToClipboard('coverLetter')">
                    📋 Copy to Clipboard
                </button>
                <button class="btn-primary" onclick="printContent('coverLetter')">
                    🖨️ Print Cover Letter
                </button>
            </div>
        </div>
        
        <div class="step-actions" style="margin-top: 2rem;">
            <button type="button" class="btn-secondary" onclick="renderStep(3)">Back to Review</button>
            <button type="button" class="btn-outline" onclick="resetState()">Start Over</button>
        </div>
    </div>
`;

// Populate content
document.getElementById('actionPlanContent').innerHTML = formatOutput(appState.generatedOutputs.actionPlan);
document.getElementById('checklistContent').innerHTML = formatOutput(appState.generatedOutputs.packetChecklist);
document.getElementById('coverLetterContent').innerHTML = formatOutput(appState.generatedOutputs.coverLetter);

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetTab = e.target.dataset.tab;
        
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`.tab-content[data-tab="${targetTab}"]`).classList.add('active');
    });
});
}
function formatOutput(text) {
    // Very small markdown-ish -> HTML formatter (safe enough for this prototype)
    if (!text) return '';

    // Escape HTML first to avoid injection when we later insert into innerHTML
    const esc = (s) => s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    let src = esc(text);

    // Headings
    src = src
        .replace(/^###\s+(.*)$/gim, '<h4>$1</h4>')
        .replace(/^##\s+(.*)$/gim, '<h3>$1</h3>')
        .replace(/^#\s+(.*)$/gim, '<h2>$1</h2>');

    // Bold
    src = src.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Lists (very basic): convert leading "- " and "1. " lines into <li>
    src = src
        .replace(/^\s*-\s+(.*)$/gim, '<li>$1</li>')
        .replace(/^\s*\d+\.\s+(.*)$/gim, '<li>$1</li>');

    // Wrap consecutive <li> blocks into <ul>
    src = src.replace(/(?:<li>.*<\/li>\s*)+/gis, (m) => `<ul>${m}</ul>`);

    // Paragraphs / line breaks
    src = src
        .split(/\n\n+/)
        .map((block) => {
            const trimmed = block.trim();
            if (!trimmed) return '';
            // Don't wrap headings or full UL blocks in <p>
            if (/^<h[2-4]>/.test(trimmed) || /^<ul>/.test(trimmed)) return trimmed;
            return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
        })
        .filter(Boolean)
        .join('\n');

    return src;
}
function copyToClipboard(type) {
const content = {
'actionPlan': appState.generatedOutputs.actionPlan,
'checklist': appState.generatedOutputs.packetChecklist,
'coverLetter': appState.generatedOutputs.coverLetter
}[type];
navigator.clipboard.writeText(content).then(() => {
    showToast('Copied to clipboard!');
}).catch(() => {
    alert('Failed to copy. Please select and copy manually.');
});
}
function printContent(type) {
const content = {
'actionPlan': appState.generatedOutputs.actionPlan,
'checklist': appState.generatedOutputs.packetChecklist,
'coverLetter': appState.generatedOutputs.coverLetter
}[type];
const printWindow = window.open('', '', 'width=800,height=600');
printWindow.document.write(`
    <html>
    <head>
        <title>Print - 221(g) ${type}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.6;
                max-width: 8.5in;
                margin: 0.5in auto;
                color: #000;
            }
            h2 { font-size: 18pt; margin-top: 24pt; }
            h3 { font-size: 14pt; margin-top: 18pt; }
            h4 { font-size: 12pt; margin-top: 12pt; }
            p { margin-bottom: 12pt; }
            ul { margin-left: 24pt; }
            li { margin-bottom: 6pt; }
        </style>
    </head>
    <body>
        ${formatOutput(content)}
    </body>
    </html>
`);
printWindow.document.close();
printWindow.print();
}
// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
loadState();
initWelcomeModal();
initFeedbackModal();
// If user has progress, restore it
if (appState.currentStep > 0) {
    renderStep(appState.currentStep);
}
});