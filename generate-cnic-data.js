const fs = require('fs');
const path = require('path');

const locations = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'locations.json'), 'utf8'));

const data = {
  wizard: {
    title: "Pakistani CNIC Guide",
    subtitle: "NADRA • Identity & Official Purpose",
    last_verified: "February 24, 2026",
    whats_this: {
      heading: "Welcome to CNIC Guide",
      sub: "NADRA • Identity & Official Purpose",
      description: "The Computerized National Identity Card (CNIC) is an official identity document for Pakistani citizens. It is required for voting, opening bank accounts, getting a passport, obtaining a driving license, and more.",
      quick_instructions: [
        "Answer a few questions about your application type",
        "Provide location details to find your nearest NADRA office",
        "Receive a custom roadmap and document checklist",
        "Validate your application against pre-submission requirements"
      ],
      disclaimer: "This wizard provides general guidance based on publicly available information and should not be considered legal advice. Requirements may vary and can change over time. Always verify current procedures with your local NADRA office."
    },
    steps: [
      { id: "document_need", label: "Application Type", icon: "clipboard" },
      { id: "location", label: "Location", icon: "map-pin" },
      { id: "roadmap", label: "Roadmap", icon: "map" },
      { id: "office_finder", label: "Office Finder", icon: "search" },
      { id: "validation", label: "Validation", icon: "star" }
    ],
    document_need: {
      title: "Application Setup",
      description: "Help us customize the process by telling us a bit about your situation.",
      questions: [
        {
          id: "personType",
          title: "Who is applying?",
          options: [
            { id: "adult", title: "Standard Adult", description: "Has parents or siblings already registered with NADRA.", icon: "adult", color: "green" },
            { id: "special", title: "Special Case / Orphan", description: "No blood relative with a NADRA record available.", icon: "special", color: "orange" }
          ],
          note: "<strong>Note:</strong> Women, men, and transgender individuals fall under the standard category as long as they have verifiable blood relatives."
        },
        {
          id: "applicationType",
          title: "What is the purpose?",
          options: [
            { id: "new", title: "New CNIC", description: "Applying for the very first time (age 18+)", icon: "new", color: "blue" },
            { id: "correction", title: "Correction / Update", description: "Fixing details (name, DOB, marital status, address)", icon: "correction", color: "green" },
            { id: "replacement", title: "Replacement / Renewal", description: "CNIC is expired, lost, stolen, or damaged", icon: "replacement", color: "orange" }
          ]
        }
      ]
    },
    location: {
      title: "Location Information",
      description: "Your current residential address helps determine the nearest NADRA centers.",
      country: "Pakistan",
      country_note: "This wizard is specifically for Pakistan CNIC applications.",
      location_note: "Why location matters: For a CNIC application, your residential address dictates the specific NADRA center you must visit. Ensuring this matches your supporting documents is crucial to avoid application rejection.",
      provinces: locations.provinces
    },
    offices: locations.offices || [],
    roadmaps: {
      special_new: {
        title: "Your Personalized Roadmap",
        estimated_timeline: "10-15 Days (Normal)",
        onlinePhases: [
          { id: 1, title: "Download App", duration: "5 mins", description: "Download the PakID app on your smartphone and register an account using your mobile number and email address." },
          { id: 2, title: "Details & Documents", duration: "20 mins", description: "On Home page, go to ID Documents and select ID Card. Choose application category. Select the purpose(new, update card, etc). Enter applicant’s personal details. Upload supporting documents including Birth Certificate or B-Form, School Leaving Certificate, Guardian Certificate (if any), Affidavit, and Union/Police Verification. Review carefully." },
          { id: 3, title: "Submit & Verification", duration: "5 mins", description: "Submit application for NADRA verification. Pay fees online (Executive Rs 2500, Urgent Rs 1500, Normal Rs 750). Applicant will be notified via SMS/app for biometric visit and final processing." }
        ],
        onsitePhases: [
          { id: 1, title: "Token & Registration", duration: "Varies", description: "Visit nearest NADRA Registration Center. Inform staff that you are applying WITHOUT BLOOD RELATIVE (Special Case). Get a special case token and wait for your turn. Visit early morning to avoid delays." },
          { id: 2, title: "Verification & Biometrics", duration: "25–40 mins", description: "Biometric capture. Document verification including Birth Certificate/B-Form, School Leaving Certificate, Guardian Certificate (if any), Affidavit, and Police verification. No family biometric required. Attestation by Gazetted Officer. Interview by NADRA OIC. Fee submission." },
          { id: 3, title: "Review & Receipt", duration: "5 mins", description: "Review printed application form. Sign it and collect your tracking receipt. CNIC will be printed and handed over after completion of NADRA verification." }
        ],
        documents_checklist: [
          { id: "birth_cert", label: "Birth Certificate", description: "Original birth certificate from Union Council.", required: true },
          { id: "school_cert", label: "School Certificate", description: "If applicable, from your last attended educational institute.", required: true },
          { id: "affidavit", label: "Affidavit", description: "Explaining your family status and why parents' CNICs are unavailable.", required: true },
          { id: "court_ver", label: "Court Verification", description: "Legal proof of guardianship from a court or recognized institution.", required: true },
          { id: "police_ver", label: "Police Verification", description: "Local clearance to verify your identity.", required: true }
        ]
      },
      standard_new: {
        title: "Your Personalized Roadmap",
        estimated_timeline: "7-10 Days (Executive)",
        onlinePhases: [
          { id: 1, title: "Download App", duration: "5 mins", description: "Download the PakID app on your smartphone and register an account using your mobile number and email address." },
          { id: 2, title: "Details & Biometrics", duration: "15 mins", description: "On Home page, go to ID Documents and select ID Card. Choose application category. Capture applicant's Photograph & Fingerprints. Enter the personal details. Upload documents, if required. Review and verify information." },
          { id: 3, title: "Payment & Submit", duration: "5 mins", description: "Submit application. Fee submission (Executive Rs 2500, Urgent Rs 1500, Normal Rs 750) excluding delivery fee. CNIC will be printed and handed over upon completion." }
        ],
        onsitePhases: [
          { id: 1, title: "Token & Waiting", duration: "Varies", description: "Visit your nearest NADRA Registration Center, get a queue token, and wait for your turn. Visit early morning to avoid rush." },
          { id: 2, title: "Data Entry & Biometrics", duration: "15 mins", description: "Biometric Verification (anyone of parents or sibling). Photographs and fingerprints are mandatory. Your data will be entered and reviewed. Attestation by anyone of the parents or siblings or by Gazetted officer. Interview by OIC. Fee submission." },
          { id: 3, title: "Review & Receipt", duration: "5 mins", description: "Review the printed application form carefully. Sign it and collect your tracking receipt." }
        ],
        documents_checklist: [
          { id: "original_bform", label: "Original B-Form (CRC)", description: "Or original Birth Certificate. Without originals, application may be rejected.", required: true },
          { id: "parents_cnic", label: "Parents' CNIC Copies", description: "Clear copies of at least one parent's CNIC (both is better).", required: true },
          { id: "proof_residence", label: "Proof of Residence", description: "Utility bill or domicile in your parent's/your name.", required: false },
          { id: "active_mobile", label: "Active Mobile Number", description: "For OTP verification and SMS tracking.", required: true }
        ]
      },
      standard_correction: {
        title: "Your Personalized Roadmap",
        estimated_timeline: "10-15 Days",
        onlinePhases: [
          { id: 1, title: "Download App", duration: "5 mins", description: "Download the PakID app on your smartphone and register an account using your mobile number and email address." },
          { id: 2, title: "Details & Biometrics", duration: "15 mins", description: "On Home page, go to ID Documents and select ID Card. Choose Update Card. Capture applicant's Photograph & Fingerprints. Enter the new personal details. Upload supporting proof of modification. Review and verify information." },
          { id: 3, title: "Payment & Submit", duration: "5 mins", description: "Submit application. Fee submission (Executive Rs 2500, Urgent Rs 1500, Normal Rs 750) excluding delivery fee. Modified CNIC will be printed and handed over upon completion." }
        ],
        onsitePhases: [
          { id: 1, title: "Token & Waiting", duration: "Varies", description: "Visit your nearest NADRA Registration Center, get a queue token, and wait for your turn. Visit early morning to avoid rush." },
          { id: 2, title: "Data Entry & Modification", duration: "15 mins", description: "Provide your original CNIC and proof of modification. Your data will be updated and reviewed. Biometric Verification may be required. Attestation by Gazetted officer. Interview by OIC. Fee submission." },
          { id: 3, title: "Review & Receipt", duration: "5 mins", description: "Review the printed application form carefully to ensure modifications are correct. Sign it and collect your tracking receipt." }
        ],
        documents_checklist: [
          { id: "original_existing", label: "Original Existing CNIC", description: "Your current CNIC card that needs correction.", required: true },
          { id: "proof_mod", label: "Proof of Modification", description: "E.g., Nikkah Nama for marital status, Matriculation transcript for DOB, Utility Bill for address change.", required: true },
          { id: "relative_cnic", label: "Relative CNIC Copies", description: "Parents' or Spouse's CNIC copies if modifying family linkages.", required: false }
        ]
      },
      standard_replacement: {
        title: "Your Personalized Roadmap",
        estimated_timeline: "10-15 Days",
        onlinePhases: [
          { id: 1, title: "Download App", duration: "5 mins", description: "Download the PakID app on your smartphone and register an account using your mobile number and email address." },
          { id: 2, title: "Details & Biometrics", duration: "15 mins", description: "On Home page, go to ID Documents and select ID Card. Choose Replacement/Renewal. Capture applicant's Photograph & Fingerprints. Verify the existing personal details. Review and verify information." },
          { id: 3, title: "Payment & Submit", duration: "5 mins", description: "Submit application. Fee submission (Executive Rs 2500, Urgent Rs 1500, Normal Rs 750) excluding delivery fee. New CNIC will be printed and handed over upon completion." }
        ],
        onsitePhases: [
          { id: 1, title: "Token & Waiting", duration: "Varies", description: "Visit your nearest NADRA Registration Center, get a queue token, and wait for your turn. Visit early morning to avoid rush." },
          { id: 2, title: "Verification & Renewal", duration: "15 mins", description: "Provide FIR or copy of old CNIC. Your existing data will be verified. Biometric Verification may be required. Fee submission." },
          { id: 3, title: "Review & Receipt", duration: "5 mins", description: "Review the printed application form carefully. Sign it and collect your tracking receipt." }
        ],
        documents_checklist: [
          { id: "copy_old", label: "Copy of Lost/Old CNIC", description: "If available, otherwise ensure you know your 13-digit CNIC number.", required: false },
          { id: "loss_report", label: "Loss Report / FIR", description: "A non-cognizable (NC) report or FIR from local police station.", required: false },
          { id: "secondary_id", label: "Original Secondary ID", description: "Passport or Domicile as secondary photo ID proof, if requested.", required: false }
        ]
      }
    },
    validation: {
      title: "Application Validation Vault",
      description: "Verify critical prerequisites and ensure your documents meet standard requirements before processing.",
      upload_section: {
        title: "Upload Application Scans",
        description: "Securely upload your form or document scans for tracking.",
        formats: "PDF, JPG, PNG (Max 5MB)"
      },
      checklist_title: "Pre-Submission Checklist",
      categories: [
        {
          name: "Document Readiness",
          items: [
            { label: "Original B-Form / CRC or old CNIC is ready", critical: true },
            { label: "Biometric verification documents present", critical: true }
          ]
        },
        {
          name: "Form Validation",
          items: [
            { label: "Applicant's name & details spell-checked", critical: true },
            { label: "Attestation by a Grade-16+ officer included (if required)", critical: true }
          ]
        },
        {
          name: "Payment Preparation",
          items: [
            { label: "Processing fee available based on selection (Normal/Urgent/Executive)", critical: false }
          ]
        }
      ]
    },
    info_panel: {
      document_need: {
        tips: [
          "Double check if you are a Special Case before selecting it.",
          "Corrections require solid proof, such as academic records or Nikkah Nama."
        ],
        pitfalls: [
          "Don't select New CNIC if you've already had one and lost it. Select Replacement.",
          "Ensure you apply for the correct CNIC modification category."
        ],
        links: [
          { label: "NADRA Official Website", url: "https://www.nadra.gov.pk" },
          { label: "Pak Identity App", url: "https://id.nadra.gov.pk/" }
        ]
      },
      location: {
        tips: [
          "Your nearest NADRA center is based on your current residential address.",
          "Urban areas generally have NADRA Mega Centers for faster processing."
        ],
        pitfalls: [
          "Don't assume any NADRA center can process your request — check availability.",
          "Avoid visiting on Fridays after 12 PM as most centers close early."
        ],
        links: [
          { label: "Find NADRA Offices", url: "https://www.nadra.gov.pk/nadraOffices" }
        ]
      },
      roadmap: {
        tips: [
          "Gather all required documents before visiting the NADRA center.",
          "Visit during weekday mornings for shorter wait times."
        ],
        pitfalls: [
          "Don't visit without original B-form — photocopies alone are not accepted.",
          "Missing family member documents will delay your application."
        ],
        links: [
          { label: "NADRA Document Requirements", url: "https://www.nadra.gov.pk" }
        ]
      },
      office_finder: {
        tips: [
          "Confirm office hours before visiting; some close early on Fridays.",
          "Bring photocopies of all documents in addition to originals."
        ],
        pitfalls: [
          "Don't rely on unofficial centers — only visit authorized NADRA Registration Centers."
        ],
        links: [
          { label: "NADRA Office Locator", url: "https://www.nadra.gov.pk/nadraOffices" }
        ]
      },
      validation: {
        tips: [
          "Verify all spellings match your passport and other official documents exactly.",
          "Check that attestation is from a valid Grade 16+ officer."
        ],
        pitfalls: [
          "Don't submit with spelling mismatches — it will cause lifelong issues.",
          "Don't assume your old CNIC info will auto-correct."
        ],
        links: [
          { label: "NADRA Certificate Verification", url: "https://id.nadra.gov.pk" }
        ]
      }
    }
  }
};

fs.writeFileSync(path.join(__dirname, 'data', 'cnic-guide-data.json'), JSON.stringify(data, null, 2));
console.log("Successfully wrote cnic-guide-data.json!");
