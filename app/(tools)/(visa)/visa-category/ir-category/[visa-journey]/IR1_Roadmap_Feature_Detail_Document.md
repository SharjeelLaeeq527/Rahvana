# IR-1 Roadmap Redesign — Feature Detail Document
Version: Draft v1  
Prepared for: Product, Design, Frontend, Backend, Content, and Integrations teams  
Source of truth: Consolidated from the last four IR-1 roadmap redesign conversations in this thread  
Status: Implementation planning document

---

## 1. Product Overview

### 1.1 What this product is
The IR-1 Roadmap is Rahvana’s guided, chapter-based immigration journey experience for an IR-1 spousal immigrant visa case. It is not a static checklist. It is a structured, intelligent workflow that helps a user progress through the immigration journey with the right tools, tutorials, stored information, reminders, and progress visibility at the right moment.

The user should feel like they are moving through one connected journey, not bouncing between unrelated pages, PDFs, portals, and instructions.

### 1.2 Core product purpose
The roadmap must:
- break a complicated immigration process into manageable chapters and steps
- reduce overwhelm through progressive disclosure and decluttered UI
- provide contextual assistance exactly where the user needs it
- connect Rahvana tools directly into the journey
- store important case information centrally
- keep users moving even during waiting periods
- surface unresolved items until they are actually handled
- create a premium, calm, trustworthy, minimal experience

### 1.3 Dashboard purpose
The dashboard is the user’s command center for the IR-1 journey. It should:
- show where the user currently is
- show what is next
- show what is blocked, pending, or waiting
- surface important reminders and deadlines
- give fast access to tools and stored data
- avoid dumping too much text at once
- use click-to-expand behavior to keep the interface visually clean

### 1.4 Journey model
The experience is structured as:
- **Journey**
  - **Chapters**
    - **Steps**
      - **Sub-guides / mini flows / tools / uploads / tutorials**

The user should be able to move through the roadmap in a linear way, while some steps may remain pending and continue to appear as reminders until they are actually resolved.

### 1.5 UX tone and design intent
The roadmap must feel:
- calm
- premium
- modern SaaS
- trustworthy
- intelligently guided
- minimal rather than crowded
- helpful without being noisy
- specific without feeling bureaucratic

Rahvana styling should remain consistent with the live brand direction: restrained, premium, teal-led, clean, and not gimmicky.

---

## 2. Core Experience Principles

1. **Minimal cognitive load**  
   Show only what matters right now. Hide secondary detail behind click-to-expand interactions.

2. **One action at a time**  
   Each step should clearly answer:
   - what the user needs to do
   - what Rahvana provides
   - what happens next

3. **Progressive disclosure**  
   Tutorials, checklists, explanations, and supporting detail should be expandable rather than permanently open.

4. **Journey continuity**  
   The roadmap should feel like one connected system across dashboard, steps, tools, and storage.

5. **Contextual tooling**  
   Tools such as AutoFormFiller, Document Vault, Portal Wallet, calculator flows, and booking links should appear exactly when needed inside the step context.

6. **Persistent state**  
   Progress, uploads, appointments, portal links, account records, and unresolved tasks must persist.

7. **Waiting-state support**  
   Even when the user is waiting on government processing, appointments, police certificates, or payments, the roadmap should keep them informed and engaged.

8. **Conditional logic**  
   Certain steps and document requirements must change based on the user’s answers, filing method, sponsor structure, and case facts.

9. **Skippable but not forgotten**  
   Some steps can be postponed temporarily, but unresolved items must continue to surface through reminders and dashboard indicators.

10. **Implementation realism**  
   External government portals are not replaced by Rahvana. Rahvana should guide, prepare, store, remind, and link out where needed.

---

## 3. In-Scope Chapters and Journey Coverage

### 3.1 Confirmed scope from source discussions
The conversations explicitly covered these areas:

- **Dashboard / roadmap shell**
- **Chapter I: USCIS Petition Filing**
- **Chapter II: NVC / CEAC Processing**
- **Chapter III: Medical + Interview**
- **Online filing and paper filing divergence where relevant**
- **Tools, tutorials, uploads, reminders, storage, and dashboard dynamics**

### 3.2 Out of scope or not fully specified yet
The following were not fully defined in the source discussions and should be treated as future work unless product confirms otherwise:
- visa issuance post-interview module
- travel preparation after visa issuance
- U.S. entry onboarding
- green card delivery follow-up
- long-term post-arrival settlement flows

---

## 4. Dashboard Feature Breakdown

### 4.1 Dashboard modules overview

| Feature Name | Description | Purpose | Trigger / Visibility Logic | Data Inputs Required | User Actions | Dependencies / Integrations | UI Behavior Notes |
|---|---|---|---|---|---|---|---|
| Main Continue Journey Card | Primary hero card showing visa type, current chapter, current step, chapter progress %, and metro-style intra-chapter step line | Resume user exactly where they left off | Always visible on IR-1 dashboard | current chapter, current step, completed steps count, total steps in chapter | continue journey, open current step, inspect chapter progress | roadmap progress engine | Must be visually dominant but not oversized; minimal copy |
| Metro Step Progress Line | Visual station-style progress within the current chapter | Make chapter progress easy to understand at a glance | Embedded in main continue card | ordered list of chapter steps, completion state per step | hover or tap station, open step | roadmap progress engine | Compact, clean, not overly decorative |
| Chapter Overview Strip / Card | Summarizes all chapters and their status | Help user orient in the overall journey | Visible on dashboard, possibly collapsible | chapter order, status per chapter | expand, jump to chapter overview | roadmap structure | Should replace dense roadmap wall with cleaner summary |
| Pending Actions Card | Shows unresolved important tasks | Prevent important tasks from being forgotten | Visible when there are incomplete actionable items | unresolved tasks, reminders, due dates, statuses | open task, snooze if allowed, mark resolved through action | reminder engine, progress logic | Use priority ordering |
| Upcoming Appointment Card | Shows next medical / interview / other appointment date and time | Keep time-sensitive items visible | Only when appointment data exists | appointment date, time, location, type | view details, edit date/time, open guide | appointment storage | High salience but calm styling |
| Waiting On / Case Status Card | Shows items in waiting state such as USCIS receipt, NVC processing, fee posting, police certificate pending | Clarify that user is not blocked by inactivity | Visible when relevant statuses exist | receipt number, case status, pending docs, fee status | update status, open related guide | status tracking model | Good place for educational nudges later |
| Document Vault Summary Widget | Shows missing, uploaded, pending, stale, or action-needed documents | Connect document prep to roadmap | Visible when documents exist or are required | document checklist state, uploads, expiry / freshness flags | open vault, upload missing doc, review naming/compression | Document Vault | Should be concise by default, expandable for detail |
| Portal Wallet Widget | Shows stored access points for USCIS / CEAC / booking portals | Reduce account access friction | Visible once portal data exists, or as CTA where needed | portal records, usernames/links, created accounts | save portal info, open wallet | Portal Wallet | Must never imply password storage if product does not allow it |
| Quick Tools Rail / Stack | Fast access to relevant tools such as AutoFormFiller, calculator, guides, vault | Surface tools without overcrowding the main dashboard | Visible but restrained; may be side stack or quick actions row | tool availability by chapter/step | launch tool | tool routing | Use compact icon + label treatment |
| Case Stats / Case Strength Card | Shows overall case preparedness / strength indicator and suggestions | Encourage proactive improvements | Display if product keeps this feature in scope | case inputs, missing evidence, recommended docs | view suggestions, jump to improvement step | case strength engine (future or partial) | Treat as advisory, not definitive legal assessment |
| Notifications / Reminder Feed | Short list of actionable reminders | Encourage follow-through | Visible when reminders exist | reminder objects | open related action | reminder engine | Keep concise; no noisy feed |
| Chapter Detail Expanders | Expanders per chapter showing steps and statuses | Let user inspect roadmap without crowding dashboard | Collapsed by default | chapter and step state | expand, navigate | roadmap engine | Strong candidate for click-to-expand behavior |
| Support / Help Entry Point | Access to Rahvana assistance, booking, or content help | Reduce confusion and drop-off | Always available but subtle | support page links, assistance options | open help, book assistance | support flows | Should not dominate the dashboard |
| Resume Last Draft / Saved Progress CTA | Takes user back into partially completed guided step or tool | Reduce abandoned sessions | Appears when a tool session or step draft exists | saved session state | resume | tool session storage | Very useful for form and document-heavy steps |

### 4.2 Dashboard dynamic behaviors
The dashboard must update based on:
- current chapter
- current step
- completion percentage within current chapter
- total completed chapters
- unresolved tasks from earlier steps
- uploaded / missing documents
- appointment dates
- waiting states
- pending uploads or sponsor additions
- filing method branch (online vs paper if applicable)

### 4.3 Dashboard decluttering rules
The dashboard should not present long paragraphs by default. Use:
- short labels
- mini summaries
- expandable sections
- card-based prioritization
- a primary “continue” action
- limited visible reminders with “view all” expansion

---

## 5. Chapter-by-Chapter and Step-by-Step Requirements

# Chapter I — USCIS Petition Filing

## Chapter objective
Guide the petitioner and beneficiary through eligibility, document collection, filing method selection, petition preparation, account setup, filing mechanics, payment, submission, and receipt notice handling.

## Step I.1 — Determine Eligibility

**Purpose**  
Confirm that the case is eligible to proceed as an IR-1 spousal immigrant petition case.

**What the user does**
- answers guided questions in a one-question-per-screen style flow

**What Rahvana provides**
- minimal guided eligibility check
- hints/examples where necessary
- clean pass/fail / caution logic

**Key mini-quest topics**
- petitioner is a U.S. citizen
- marriage is legally valid
- all prior marriages were legally terminated
- relationship is bona fide
- additional possible ineligibility considerations consolidated into a final screening section

**Data captured**
- petitioner citizenship status
- marriage validity confirmation
- prior marriage termination confirmation
- bona fide marriage self-confirmation
- basic flags for cautionary issues

**Completion logic**
- step complete when all required questions are answered
- if caution flags exist, step may complete with warnings rather than hard stop

**Reminders / follow-up**
- if user exits midway, resume draft should be available

**Storage**
- eligibility answers stored in user profile / journey state

---

## Step I.2 — Gather Required USCIS Documents

**Purpose**  
Prepare the user with the exact documents needed before filing.

**What the user does**
- reviews required checklist
- accesses document guides where needed
- uploads or marks documents as available where product supports it

**What Rahvana provides**
- structured checklist
- categorization of required items
- document acquisition guides
- optional upload to Document Vault
- reminders for missing items

**Example document categories discussed**
- proof of petitioner U.S. citizenship
- beneficiary passport
- beneficiary birth certificate
- Nikah Nama / marriage certificate
- translations where required
- passport-style photos
- divorce decrees / death certificates for prior marriages if applicable
- relationship evidence

**Data captured**
- per-document status
- uploaded files
- missing file flags
- translation-needed flags

**Completion logic**
- complete when user confirms checklist is prepared or documents are uploaded / marked ready
- may allow user to move forward while unresolved items remain visible

**Storage**
- Document Vault
- dashboard summary widget

---

## Step I.3 — Decide Filing Method

**Purpose**  
Help user choose between online and paper filing path when applicable.

**What the user does**
- answers guided branching questions

**What Rahvana provides**
- recommendation engine / guided explainer
- decision lock-in for roadmap branching

**Outputs**
- filing method = online
- filing method = paper

**Completion logic**
- complete only when a filing method is selected

**Downstream impact**
- changes later USCIS filing steps
- determines which tutorials and submission mechanics are shown

---

## Step I.4 — Fill Form I-130

**Purpose**  
Enable user to prepare the I-130 using Rahvana’s tool-assisted flow.

**What the user does**
- opens and completes Rahvana AutoFormFiller
- reviews generated outputs
- resumes later if needed

**What Rahvana provides**
- integrated I-130 AutoFormFiller
- save/resume state
- link to wizard: `https://www.rahvana.com/visa-forms/i130/wizard`

**Data captured**
- form answers
- progress state
- output availability

**Completion logic**
- complete when AutoFormFiller reaches final completed state
- if abandoned midway, dashboard should show resume action

**Notes**
- for paper filing, this same output also supports later print instructions

---

## Step I.5 — Create USCIS Account

**Purpose**  
Help user create and preserve access to their USCIS online account.

**What the user does**
- opens USCIS account creation page
- creates account externally
- stores portal record in Rahvana

**What Rahvana provides**
- link-out to USCIS signup
- graphical tutorial guide
- “save to Portal Wallet” action for account reference

**Data captured**
- account created confirmation
- associated email / username or portal metadata per product rules
- saved wallet record

**Completion logic**
- complete when user confirms account creation and/or saves to wallet

**Storage**
- Portal Wallet

---

## Step I.6A — Upload Forms and Evidence (Online Filing Branch)

**Purpose**  
Guide user through uploading completed forms and evidence to USCIS online account.

**What the user does**
- follows upload tutorial
- attaches forms/evidence in USCIS portal
- confirms upload done

**What Rahvana provides**
- graphical tutorial
- evidence prep guidance
- potentially link back to stored generated files / Document Vault

**Completion logic**
- complete upon user confirmation of upload completion

---

## Step I.6B — Print Forms for Mailing (Paper Filing Branch)

**Purpose**  
Ensure the user prints the completed petition package correctly from Rahvana-generated outputs.

**What the user does**
- opens final completed forms
- prints hard copies

**What Rahvana provides**
- link to completed filled form output
- print instructions
- reminder that signatures / hard copy handling matter for paper path

**Completion logic**
- complete when user confirms printed packet ready

---

## Step I.7A — Pay Filing Fee (Online Filing Branch)

**Purpose**  
Guide the user through USCIS online fee payment.

**What the user does**
- pays fee in USCIS portal
- confirms payment

**What Rahvana provides**
- graphical tutorial
- payment prep guidance

**Completion logic**
- complete upon user confirmation of payment

---

## Step I.7B — Prepare Payment for USCIS Packet (Paper Filing Branch)

**Purpose**  
Guide correct payment instrument preparation for mailed filing.

**What the user does**
- prepares payment instrument according to filing instructions

**What Rahvana provides**
- graphical tutorial guide for payment preparation

**Completion logic**
- complete upon user confirmation

---

## Step I.8A — Review and Submit (Online Filing Branch)

**Purpose**  
Ensure user performs final review and submission in USCIS online account.

**What the user does**
- reviews petition in USCIS portal
- submits petition

**What Rahvana provides**
- graphical walkthrough
- final reminder checklist

**Completion logic**
- complete when user confirms submission

---

## Step I.8B — Assemble Packet (Paper Filing Branch)

**Purpose**  
Guide user to assemble a clean, correct filing packet.

**What the user does**
- follows assembly instructions
- orders packet correctly
- confirms ready to mail

**What Rahvana provides**
- graphical tutorial on packet assembly

**Completion logic**
- complete when user confirms packet assembled

---

## Step I.9B — Mail Packet and Track Delivery (Paper Filing Branch)

**Purpose**  
Guide the final mailing and delivery tracking of paper filing.

**What the user does**
- mails petition packet
- records tracking if supported

**What Rahvana provides**
- graphical tutorial on mailing
- delivery tracking guidance

**Data captured**
- optional mailing carrier
- optional tracking number
- mailed date

**Completion logic**
- complete when mailed date confirmed

---

## Step I.9 / I.10 — Receive Receipt Notice

**Purpose**  
Capture USCIS receipt notice and transition user into waiting-state management.

**What the user does**
- uploads receipt notice and/or enters receipt number
- stores priority date if available

**What Rahvana provides**
- upload slot
- receipt number capture
- dashboard reminders
- future status polling / notification hook
- educational and community engagement potential during waiting period

**Data captured**
- receipt number
- receipt date
- priority date where relevant
- receipt notice file

**Completion logic**
- complete when receipt number or receipt notice is entered

**Storage**
- Document Vault
- case status model
- dashboard waiting-state card

---

# Chapter II — NVC / CEAC Processing

## Chapter objective
Help the user move from NVC case creation through fee payment, DS-260 preparation, civil documents, Affidavit of Support, sponsor additions, and CEAC uploads.

## Step II.1 — NVC Welcome Letter

**Purpose**  
Orient the user once the NVC case is created and the welcome letter arrives.

**What the user does**
- reviews letter details
- logs into CEAC
- optionally stores account info in Portal Wallet

**What Rahvana provides**
- guided explanation of welcome letter
- CEAC onboarding help
- save-to-wallet action

**Data captured**
- NVC case number
- invoice ID / CEAC access data as supported
- letter upload
- portal wallet record

**Completion logic**
- complete when user confirms access is established or data stored

---

## Step II.2 — Pay NVC Fees

**Purpose**  
Guide payment of NVC fees in CEAC.

**What the user does**
- enters CEAC
- makes required payments
- waits for posted status

**What Rahvana provides**
- detailed graphical tutorial from CEAC landing to payment confirmation
- waiting-state reminder if payment has not yet posted

**Data captured**
- fee payment initiated / paid status
- payment confirmation date
- posted status if tracked manually

**Completion logic**
- complete after user confirms payment
- optionally hold sub-status “awaiting payment posting” until CEAC reflects it

---

## Step II.3 — DS-260

**Purpose**  
Prepare the immigrant visa application answers and help user submit in CEAC.

**What the user does**
- completes Rahvana preparation flow
- uses generated answer key / PDF support
- transfers answers into CEAC
- submits DS-260

**What Rahvana provides**
- DS-260 preparation flow
- answer key style output
- guided start-to-submit walkthrough
- reminder that DS-260 becomes available after payment posts

**Completion logic**
- complete when user confirms DS-260 submission

**Dependencies**
- NVC fees must be paid and posted before start is truly available

---

## Step II.4 — Prepare Civil Documents

**Purpose**  
Help user collect all beneficiary/petitioner civil documents required by NVC.

**What the user does**
- reviews categorized checklist
- uploads or tracks readiness
- follows document acquisition guides

**What Rahvana provides**
- categories:
  - Required
  - Required if applicable
  - Recommended to strengthen case
- upload support
- Document Vault linkage
- reminders for missing items

**Data captured**
- per-document status
- uploaded files
- missing / pending flags

**Completion logic**
- complete when required items are marked ready or uploaded
- recommended items should not hard-block step completion

---

## Step II.5 — Complete Affidavit of Support

**Purpose**  
Determine sponsor structure and launch the correct I-864 family flows.

**What the user does**
- completes sponsorship calculator flow
- follows dynamically generated next actions
- fills needed forms

**What Rahvana provides**
- Affidavit Support Calculator
- branching logic based on household size, income, joint sponsor need, household members, assets
- generated action list such as:
  - Fill I-864 for Petitioner
  - Fill I-864A for Household Member
  - Fill I-864 for Joint Sponsor

**Linked tool**
- `https://www.rahvana.com/affidavit-support-calculator`

**Completion logic**
- complete when sponsor structure is finalized and required generated form flows are completed

---

## Step II.6 — Gather Financial Support Documents

**Purpose**  
Collect all supporting financial evidence required by the determined sponsor structure.

**What the user does**
- reviews dynamic checklist
- uploads tax and income documents

**What Rahvana provides**
- dynamic checklist based on sponsor setup
- logic for number of years / types of evidence
- support for paystubs, W-2s, tax returns, transcripts, asset evidence, proof of employment, proof of relationship where household member is involved

**Completion logic**
- complete when required items are marked ready or uploaded

---

## Step II.7 — Request to Add Household Member / Joint Sponsor in CEAC

**Purpose**  
Guide CEAC workflow where an additional sponsor needs to be added.

**What the user does**
- performs sponsor-addition steps in CEAC

**What Rahvana provides**
- graphical tutorial
- dynamic proof-of-relationship checklist depending on relationship type

**Completion logic**
- complete when user confirms addition request / setup completed in CEAC

---

## Step II.8 — Upload to NVC Portal

**Purpose**  
Help user upload the right document to the right CEAC category correctly.

**What the user does**
- uploads prepared documents to CEAC
- confirms categories and placements

**What Rahvana provides**
- strong recommendation to use Document Vault first for renaming/compression
- graphical tutorial on:
  - whose document goes where
  - which document type bucket to use
  - adding comments if needed

**Linked tool**
- `https://www.rahvana.com/pdf-processing`

**Completion logic**
- complete when user confirms all required uploads are done

---

# Chapter III — Medical + Interview

## Chapter objective
Guide the user from interview scheduling stage through medical exam preparation, police certificate freshness handling, interview preparation, and appointment tracking.

## Step III.1 — Schedule Medical Interview / Medical Exam

**Purpose**  
Ensure the user books the medical exam with an embassy-approved physician and records the appointment in Rahvana.

**What the user does**
- books the medical appointment externally
- enters date and time into roadmap
- optionally uses Rahvana booking assistance link

**What Rahvana provides**
- clear instruction that appointment must be with an approved physician
- medical booking support link
- reminder system for upcoming appointment

**Linked page**
- `https://www.rahvana.com/book-appointment`

**Data captured**
- medical appointment date
- medical appointment time
- optional location / provider
- whether booked via Rahvana assistance path

**Completion logic**
- complete only when medical appointment date/time is recorded

**Dashboard behavior**
- show upcoming appointment card
- trigger approaching-appointment reminders

---

## Step III.2 — Police Certificate Freshness / Upload

**Purpose**  
Ensure the user obtains a fresh police certificate where needed and saves it to Document Vault.

**What the user does**
- requests / receives fresh police certificate
- uploads it to Document Vault
- tracks pending status if still waiting

**What Rahvana provides**
- upload slot
- persistent reminder logic
- instruction to keep following up with police department while waiting

**Important product rule**
- This step should **not** be considered fully complete until the fresh police certificate has actually been received.
- The user **may continue to later steps while waiting**, but the dashboard must continue surfacing this item until resolved.

**Data captured**
- police certificate status = not started / requested / waiting / received / uploaded
- upload file
- last follow-up note or date if implemented

**Completion logic**
- full completion only when received + uploaded
- interim sub-status while waiting

---

## Step III.3 — Interview Preparation

**Purpose**  
Prepare the user for the consular interview with document readiness and instruction support.

**What the user does**
- reviews interview prep materials
- confirms all required items are ready
- follows tutorial or checklist

**What Rahvana provides**
- likely graphical preparation guides
- readiness checklist
- dashboard reminders

**Implementation note**
This step was implied by the “Medical + Interview” chapter framing but not fully decomposed in source conversation. Treat this as an **implementation assumption** that requires PM confirmation.

---

## Step III.4 — Interview Appointment Tracking

**Purpose**  
Keep the interview appointment visible and actionable once scheduled.

**What the user does**
- records interview date/time when available
- accesses reminders and prep content

**What Rahvana provides**
- appointment reminder logic
- dashboard surfacing
- potentially linked portal wallet or scheduling portal reference

**Implementation note**
Appointment tracking behavior is clearly required. The exact scheduling mechanism was not fully specified in the source conversation and is an **open product decision**.

---

## 6. Integration Inventory Table

| Category | Feature / Integration Name | Description | Chapter | Step | Why it is needed | User Input Required | System Behavior | Dependency / Linked Tool / Linked Page | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Tool Integration | I-130 AutoFormFiller | Guided form completion for I-130 | I | Fill I-130 | Reduce manual form friction | form answers | save/resume, generate output | `https://www.rahvana.com/visa-forms/i130/wizard` | Must-have | Critical roadmap integration |
| Tool Integration | DS-260 Preparation Flow | Prepare DS-260 answers before CEAC entry | II | DS-260 | Reduce CEAC friction | DS-260 answers | save/resume, generate answer key | Rahvana DS-260 flow | Must-have | Exact product implementation still evolving |
| Tool Integration | Affidavit Support Calculator | Determine sponsor structure and required forms | II | Complete Affidavit of Support | Drive correct I-864 family logic | household/income/sponsor data | dynamic sponsor outputs | `https://www.rahvana.com/affidavit-support-calculator` | Must-have | High branching importance |
| Tool Integration | PDF Processing Tool | Rename/compress/output documents for NVC use | II | Upload to NVC Portal | Ensure CEAC-ready files | uploaded PDFs | compression/processing actions | `https://www.rahvana.com/pdf-processing` | Must-have | Strongly linked to vault workflow |
| Storage | Document Vault | Central document storage and readiness system | I / II / III | multiple | Keep docs organized and reusable | uploads, statuses | missing/stale/pending logic | Document Vault | Must-have | Needs naming/compression hooks |
| Storage | Portal Wallet | Save USCIS, CEAC, scheduling portal records | I / II / III | account-related steps | Reduce access friction | portal/account metadata | display quick access records | Portal Wallet | Must-have | Avoid password storage if unsupported |
| Tutorial System | USCIS Account Creation Tutorial | Visual guide for creating USCIS account | I | Create USCIS Account | Reduce setup confusion | none beyond portal interaction | tutorial launch | USCIS external signup + tutorial asset | Must-have | Graphical tutorial |
| Tutorial System | USCIS Online Upload Tutorial | Visual guide for online submission evidence upload | I | Upload Forms and Evidence | Reduce upload errors | none | tutorial launch | USCIS portal tutorial asset | Must-have | Online branch only |
| Tutorial System | USCIS Online Payment Tutorial | Visual guide for fee payment | I | Pay Filing Fee | Reduce payment confusion | none | tutorial launch | USCIS portal tutorial asset | Must-have | Online branch only |
| Tutorial System | USCIS Final Review / Submit Tutorial | Visual guide for submission flow | I | Review and Submit | Reduce submission mistakes | none | tutorial launch | USCIS portal tutorial asset | Must-have | Online branch only |
| Tutorial System | Paper Filing Print Guide | Guide for printing completed forms | I | Print Forms for Mailing | Support paper branch | none | tutorial launch | Rahvana completed form output | Must-have | Paper branch only |
| Tutorial System | Paper Filing Payment Prep Guide | Guide for preparing payment for packet | I | Prepare Payment | Support paper branch | none | tutorial launch | content asset | Must-have | Paper branch only |
| Tutorial System | Packet Assembly Guide | Guide for packet order and assembly | I | Assemble Packet | Reduce mailing errors | none | tutorial launch | content asset | Must-have | Paper branch only |
| Tutorial System | Mailing + Tracking Guide | Guide for mailing USCIS packet and tracking | I | Mail Packet and Track Delivery | Support paper path completion | mailed date, optional tracking | tutorial + save tracking | content asset | Must-have | Paper branch only |
| Tutorial System | CEAC Welcome / Login Guide | Guide for using welcome letter and entering CEAC | II | NVC Welcome Letter | Reduce portal confusion | NVC data | tutorial launch | CEAC + guide asset | Must-have | Should include save to wallet path |
| Tutorial System | CEAC Fee Payment Guide | Guide from CEAC landing to payment confirmation | II | Pay NVC Fees | Reduce payment confusion | none | tutorial launch | CEAC tutorial asset | Must-have | Explicitly requested |
| Tutorial System | DS-260 Start-to-Submit Guide | Guide for actual CEAC DS-260 completion | II | DS-260 | Bridge answer prep to CEAC submission | none | tutorial launch | CEAC tutorial asset | Must-have | Explicitly requested |
| Tutorial System | CEAC Sponsor Addition Guide | Guide for adding household member/joint sponsor | II | Request to Add Sponsor | Reduce sponsor setup errors | relationship data | tutorial launch | CEAC tutorial asset | Must-have | Dynamic relationship checklist linked |
| Tutorial System | CEAC Upload Placement Guide | Guide for right document in right slot | II | Upload to NVC Portal | Prevent CEAC upload mistakes | none | tutorial launch | CEAC tutorial asset | Must-have | Explicitly requested |
| Appointment / Service | Medical Booking Support | Booking support / assistance flow | III | Schedule Medical Interview | Help user secure appointment | booking intent, appointment date/time | link out + reminders | `https://www.rahvana.com/book-appointment` | Must-have | Link explicitly provided |
| Reminder Engine | Reminder System | Recurring reminders for unresolved or upcoming actions | I / II / III | multiple | Prevent abandonment and missed deadlines | reminder preferences if configurable | schedules, surfaces, re-surfaces | reminder service | Must-have | Core system behavior |
| Status Tracking | Receipt Tracking | Capture USCIS receipt notice and case reference | I | Receive Receipt Notice | Enable waiting-state guidance | receipt number / upload | store + display | case data model | Must-have | Future polling possible |
| Status Tracking | Fee Posting Status | Track NVC payment posted state | II | Pay NVC Fees | Clarify when DS-260 becomes available | manual status confirmation | waiting-state display | CEAC status model | Should-have | May start manual |
| Document Logic | Dynamic Civil Doc Checklist | Requirement list based on case facts | II | Prepare Civil Documents | Avoid under/over collection | document applicability answers | dynamic checklist | rules engine | Must-have | Includes recommended items |
| Document Logic | Dynamic Financial Checklist | Requirement list based on sponsor structure | II | Gather Financial Support Docs | Ensure correct evidence set | sponsor structure inputs | dynamic checklist | sponsorship logic | Must-have | High implementation value |
| Upload Flow | Police Certificate Upload + Status | Track fresh police certificate acquisition and upload | III | Police Certificate Freshness | Keep unresolved item visible | status + file upload | persistent pending state | Document Vault + reminder engine | Must-have | Explicit special logic |
| Dashboard Logic | Progress Engine | Computes chapter/step status and progress % | all | all | Drive dashboard state | completion states | update UI | roadmap engine | Must-have | Core architecture |
| Dashboard Logic | Quick Resume Engine | Resume incomplete tool sessions / steps | all | multi | Reduce drop-off | partial state | surface resume CTA | session storage | Should-have | Strong usability win |
| Support | Graphical Tutorial Delivery System | Launches walkthrough assets contextually | all | multi | Keep guidance contextual | none | render tutorial by step | content/tutorial system | Must-have | Could be modal or full-page |
| Content / Guide System | Document Wizard Guides | Guides on how to obtain documents | I / II / III | document-heavy steps | Help users acquire docs | doc selection | step-based guide | `https://www.rahvana.com/guides` | Should-have | Mentioned in concept discussions |

---

## 7. Graphical Tutorials Master Table

| Tutorial Name | Chapter | Step | User Goal | What the Tutorial Must Teach | Tutorial Type | Trigger Point in UI | Supporting Links / Tools | Notes |
|---|---|---|---|---|---|---|---|---|
| USCIS Account Creation Tutorial | I | Create USCIS Account | Create USCIS online account correctly | how to sign up, where to click, what to expect, where to return in Rahvana | screenshot guide or animated walkthrough | “View Tutorial” button in step | USCIS signup + Portal Wallet save action | Explicitly requested |
| USCIS Online Upload Tutorial | I | Upload Forms and Evidence | Upload petition and evidence correctly | where to upload, how to organize supporting files | screenshot guide / animated walkthrough | in online filing step | USCIS portal + Document Vault | Online branch only |
| USCIS Online Payment Tutorial | I | Pay Filing Fee | Pay fee correctly | payment flow sequence and confirmation expectations | screenshot guide | in payment step | USCIS portal | Online branch only |
| USCIS Review and Submit Tutorial | I | Review and Submit | Finalize online submission | final review points, submit sequence | screenshot guide | in final submission step | USCIS portal | Online branch only |
| Paper Filing Print Guide | I | Print Forms for Mailing | Print completed forms correctly | how to access generated forms and print them | static visual guide | in paper branch print step | Rahvana completed form output | Paper branch |
| USCIS Packet Payment Prep Guide | I | Prepare Payment | Prepare correct mailed filing payment | what to prepare and how | static visual guide | in paper branch payment step | content asset | Paper branch |
| USCIS Packet Assembly Guide | I | Assemble Packet | Assemble paper packet correctly | packet order, inclusion logic, assembly best practices | static / step-by-step guide | in assembly step | content asset | Paper branch |
| USCIS Mailing and Tracking Guide | I | Mail Packet and Track Delivery | Mail packet and track it | carrier/mailing/tracking flow | static / step-by-step guide | in mailing step | content asset | Paper branch |
| NVC Welcome Letter / CEAC Access Guide | II | NVC Welcome Letter | Understand welcome letter and enter CEAC | what the letter contains, how to log in, where to save account info | screenshot guide | in welcome step | CEAC + Portal Wallet | Should stay visually light |
| CEAC Fee Payment Guide | II | Pay NVC Fees | Pay affidavit/visa fees in CEAC | click path from landing to payment confirmation | screenshot guide / animated walkthrough | in fee step | CEAC | Explicitly required |
| DS-260 CEAC Completion Guide | II | DS-260 | Submit DS-260 in CEAC | how to use Rahvana output, navigate CEAC, review and submit | screenshot guide / animated walkthrough | in DS-260 step | DS-260 prep flow + CEAC | High priority |
| Civil Document Guide Launcher | II | Prepare Civil Documents | Learn how to obtain needed civil docs | per-document acquisition and prep instructions | linked guide / step-by-step | from each document row or help link | Document guides | Content-intensive |
| Sponsor Addition in CEAC Guide | II | Request to Add Sponsor | Add household member/joint sponsor | where to click, what proof may be needed | screenshot guide | in sponsor addition step | CEAC + dynamic proof checklist | Explicitly required |
| CEAC Upload Placement Guide | II | Upload to NVC Portal | Upload docs into correct CEAC slots | which person/document goes where, how to use comments, where to avoid mistakes | screenshot guide / animated walkthrough | in upload step | CEAC + Document Vault + PDF Processing | Explicitly required |
| Medical Appointment Booking Guide | III | Schedule Medical Interview | Book approved physician appointment | where to go, what to prepare, how to record date/time in Rahvana | linked guide / booking help | in medical scheduling step | `https://www.rahvana.com/book-appointment` | Could be simpler than full walkthrough |
| Police Certificate Tracking Guide | III | Police Certificate Freshness | Understand need for fresh police certificate and what to do while waiting | when fresh certificate is needed, how to follow up, when step counts as done | static step guide | in police certificate step | Document Vault | Explicitly required by logic even if not asked as tutorial |
| Interview Preparation Guide | III | Interview Preparation | Get ready for consular interview | what to bring, what to review, how to stay organized | static step-by-step guide | in interview prep step | future content asset | Implementation assumption |

---

## 8. Dynamic Dashboard Logic

### 8.1 Current chapter logic
- The dashboard should prominently show the user’s active chapter.
- Active chapter is the chapter containing the next highest-priority incomplete step.
- If earlier steps remain partially unresolved but user has moved forward, the active chapter should remain based on the user’s primary progress path, while unresolved items surface in pending actions.

### 8.2 Current step logic
- Current step = the recommended next action for the user.
- If the user abandoned a step midway, current step may become “Resume [Step Name]”.
- If a later step is blocked by a prerequisite, the current step should point to the blocking prerequisite or the most actionable pending item.

### 8.3 Progress percentage logic
Recommended logic for current chapter progress:
- progress % = completed required steps in current chapter / total required steps in current chapter
- optional / recommended items should not reduce mandatory completion %, but may surface separately as enhancement items

### 8.4 Chapter status states
Suggested chapter states:
- not started
- in progress
- waiting
- action needed
- complete

### 8.5 Step status states
Suggested step states:
- not started
- in progress
- completed
- waiting on external action
- completed with follow-up pending
- blocked

### 8.6 Partially completed step logic
A step can be partially complete when:
- user has started but not finished a tool flow
- user has recorded an external action but not uploaded proof
- user is waiting on a third-party output (for example, fresh police certificate)
- a sub-action is finished but the step’s final confirmation is missing

### 8.7 Skippable vs blocked logic
- Some steps can be postponed temporarily and should allow navigation forward.
- These must remain visible in pending actions until resolved.
- Example: fresh police certificate can remain pending while the user moves to later steps.
- Other steps should hard-block downstream action when they are true prerequisites.
- Example: filing method selection must occur before branch-specific USCIS filing steps.

### 8.8 Waiting-state surfacing
Waiting-state cards should appear for:
- USCIS receipt / case waiting period
- NVC fee payment posted state
- police certificate requested but not received
- appointment scheduled and approaching
- any external dependency not yet completed

### 8.9 Reminder reappearance logic
Reminders should reappear when:
- due date is approaching
- user has not recorded completion
- user is waiting on an unresolved external action
- critical missing documents remain unresolved
- appointment date exists and is approaching

### 8.10 Upload-based completion triggers
Some steps should become complete only after upload or evidence capture. Examples:
- receipt notice step can complete once receipt number or upload is recorded
- police certificate step only fully completes after actual receipt and upload
- document checklist steps may complete once required documents are uploaded or explicitly marked ready

### 8.11 Dashboard card update triggers
| Event | Dashboard Change |
|---|---|
| User selects filing method | Online vs paper step sequence changes |
| User finishes I-130 flow | Resume CTA disappears; next filing step promoted |
| USCIS account saved | Portal Wallet widget gains USCIS entry |
| Receipt number entered | Waiting-state / case status card appears |
| NVC welcome letter uploaded | CEAC-related next steps activate |
| NVC fees paid | Fee reminder clears; DS-260 becomes prominent |
| Sponsor structure changes | financial checklist and sponsor-addition tasks update |
| Medical appointment recorded | Upcoming appointment card appears |
| Police certificate set to waiting | Pending action stays visible even if user moves ahead |
| Fresh police certificate uploaded | Pending action clears and step can fully complete |

---

## 9. Data Capture and Storage Requirements

| Data Item | Where Collected | Why It Is Needed | Where Stored / Displayed | Affects Progress Logic | Triggers Reminders / Dashboard Changes |
|---|---|---|---|---|---|
| Filing method | Chapter I – Decide Filing Method | determine branch | journey state, dashboard | Yes | Yes |
| Eligibility answers | Chapter I – Determine Eligibility | screening + personalization | journey state | Yes | Possibly |
| I-130 form progress | Chapter I – Fill I-130 | resume form completion | tool session storage, dashboard resume | Yes | Yes |
| USCIS account record | Chapter I – Create USCIS Account | portal access continuity | Portal Wallet, dashboard widget | Yes | Maybe |
| USCIS upload confirmation | Chapter I online branch | mark online filing progress | journey step state | Yes | Clears pending action |
| Print confirmation | Chapter I paper branch | mark print step done | journey step state | Yes | Clears pending action |
| Packet mailing date | Chapter I paper branch | paper filing tracking | journey state, dashboard | Yes | Maybe |
| Mailing tracking number | Chapter I paper branch | delivery monitoring | journey state | No / partial | Potentially |
| Receipt number | Chapter I – Receipt Notice | case reference and waiting-state logic | case model, dashboard | Yes | Yes |
| Receipt notice file | Chapter I – Receipt Notice | evidence and reference | Document Vault | Yes | Yes |
| Priority date | Chapter I – Receipt Notice | case tracking | case model | Possible | Possible |
| NVC welcome letter file | Chapter II – Welcome Letter | case setup reference | Document Vault | Yes | Yes |
| NVC case number / invoice info | Chapter II – Welcome Letter | CEAC access and continuity | case model, Portal Wallet if applicable | Yes | Yes |
| NVC fee payment status | Chapter II – Pay Fees | unlock DS-260 flow | step state, dashboard waiting-state | Yes | Yes |
| DS-260 preparation data | Chapter II – DS-260 | generate answer key and resume | tool session storage | Yes | Yes |
| Civil doc statuses | Chapter II – Prepare Civil Docs | readiness tracking | Document Vault + dashboard | Yes | Yes |
| Sponsor structure data | Chapter II – Affidavit Support | drive checklist and form logic | sponsorship data model | Yes | Yes |
| Financial evidence statuses | Chapter II – Gather Financial Docs | readiness tracking | Document Vault + dashboard | Yes | Yes |
| Sponsor addition confirmation | Chapter II – Add Sponsor | progress tracking | step state | Yes | Clears pending action |
| CEAC upload completion status | Chapter II – Upload to NVC Portal | mark upload step done | step state | Yes | Clears pending action |
| Medical appointment date/time | Chapter III – Schedule Medical | appointment reminders | appointment model, dashboard card | Yes | Yes |
| Medical booking assistance usage | Chapter III – Schedule Medical | service analytics / support continuity | service metadata | No | Possibly |
| Police certificate status | Chapter III – Police Certificate | unresolved task tracking | document status model, dashboard | Yes | Yes |
| Police certificate file | Chapter III – Police Certificate | completion proof | Document Vault | Yes | Yes |
| Interview appointment date/time | Chapter III – Interview Tracking | reminders and visibility | appointment model | Yes | Yes |
| Reminder objects | system generated | prompt next action | dashboard reminder feed | N/A | N/A |

---

## 10. Completion, Dependency, and Reminder Logic

### 10.1 Completion rules by pattern

| Pattern | Rule |
|---|---|
| Question flow step | Complete when all required questions answered |
| Tool completion step | Complete when tool reaches final completion state |
| External portal action step | Complete when user confirms action done |
| Upload-based step | Complete when required file or status is captured |
| Waiting-state step | Can enter waiting sub-status without full completion |
| Appointment step | Complete when date/time is recorded |
| Conditional checklist step | Complete when all required items are ready/uploaded; recommended items remain optional |

### 10.2 Critical dependency examples
- Filing method must be chosen before online vs paper-specific USCIS steps.
- NVC fee payment must be completed and posted before DS-260 becomes available.
- Sponsor structure must be determined before financial checklist is finalized.
- Police certificate step should remain pending until actual receipt/upload even if later steps continue.

### 10.3 Repeated reminder conditions
Reminders should continue for:
- missing required documents
- unrecorded appointment dates
- police certificate pending receipt
- unfinished account setup where needed
- incomplete upload to CEAC
- receipt notice not yet captured after filing
- external waiting-state follow-up items

### 10.4 Non-blocking but persistent tasks
The following specifically require persistent surfacing even if user moves on:
- fresh police certificate not yet obtained
- optional but strongly recommended evidence items if product wants stronger nudging
- external account info not yet saved where recovery would be helpful

---

## 11. UX and UI Behavior Notes for Developers

### 11.1 What should be collapsed by default
- full chapter detail lists
- long instructional text
- secondary explanatory copy
- tutorial details until user asks
- deeper document requirement notes
- recommended-but-not-required items

### 11.2 What should stay visible at all times
- Continue Journey card
- current chapter
- current step
- top pending action if any
- next appointment if imminent
- quick access to help/support
- quick access to key tools / vault / wallet in a restrained format

### 11.3 Recommended presentation patterns
| Content Type | Recommended Presentation |
|---|---|
| primary next action | main card CTA |
| chapter drilldown | expandable card or accordion |
| tutorial launch | button opening modal, drawer, or dedicated page |
| document checklist | list with expandable detail rows |
| pending reminders | compact card list |
| account save actions | inline card action |
| upload confirmations | inline status chips + action button |
| calendar / appointment info | compact appointment card |
| quick tools | side stack, top utility row, or compact cards |

### 11.4 New tab behavior
Open in new tab where appropriate for:
- USCIS external account/signup pages
- CEAC portal
- Rahvana tool pages if product chooses not to embed them inline
- booking assistance pages when leaving current roadmap context would be disruptive

### 11.5 Mood and visual restraint notes
- avoid clutter
- avoid dense dashboard walls
- avoid over-gamification
- keep metro progress line useful, not gimmicky
- use colors to separate cards and chapters, but keep them Rahvana-appropriate
- use calm spacing and premium hierarchy
- match Rahvana theme rather than dark gaming aesthetics

---

## 12. Missing Assets, Content, and Build Dependencies

### 12.1 Content assets needed
- USCIS account creation tutorial assets
- USCIS online upload tutorial assets
- USCIS online payment tutorial assets
- USCIS review/submit tutorial assets
- paper filing print guide assets
- packet payment preparation guide assets
- packet assembly guide assets
- packet mailing/tracking guide assets
- NVC welcome letter / CEAC access guide assets
- CEAC fee payment guide assets
- DS-260 CEAC submission guide assets
- CEAC sponsor addition guide assets
- CEAC upload placement guide assets
- medical booking guide content
- police certificate tracking guide content
- interview preparation guide content

### 12.2 Product / backend dependencies
- roadmap progress engine
- journey state persistence
- reminder / notification service
- appointment storage model
- document status model
- Document Vault integration
- Portal Wallet integration
- AutoFormFiller integration
- Affidavit Support Calculator integration
- PDF Processing integration
- file upload handling
- conditional checklist rules engine
- session resume handling for incomplete steps/tools

### 12.3 Design dependencies
- final dashboard layout spec
- chapter/step card designs
- metro-style progress component
- card color system per chapter or feature type
- expandable interaction pattern library
- tutorial presentation pattern library
- icon / illustration set consistent with Rahvana tone

### 12.4 Open product decisions
| Topic | Current State |
|---|---|
| Exact chapter count beyond Chapter III | Not specified in source conversations |
| Interview scheduling mechanism | Not fully specified |
| Case strength card scoring logic | Conceptually desired, exact logic not finalized |
| Whether tools are embedded vs new-tab | Needs implementation decision per tool |
| Reminder delivery channels | In-app clearly needed; email/SMS/push not specified |
| Password handling in Portal Wallet | Must be clarified; current expectation is no password storage |
| Exact DS-260 product implementation | Preparation flow discussed, exact final build still evolving |
| How much of CEAC status is automated | Future-ready; may begin manual |

### 12.5 Implementation assumptions
- Interview preparation is included as part of Chapter III even though it was not fully decomposed in source thread.
- NVC fee “paid” and “posted” may need separate sub-statuses.
- Optional recommended evidence can be shown separately from required progress.
- The dashboard may contain a case strength / suggestions card, but this should remain advisory and non-authoritative.

---

## 13. Final Master Feature Checklist

### 13.1 Dashboard features
- [ ] Main Continue Journey card
- [ ] Current chapter + current step display
- [ ] Chapter progress percentage
- [ ] Metro-style intra-chapter step line
- [ ] Chapter overview with expandable detail
- [ ] Pending actions card
- [ ] Upcoming appointment card
- [ ] Waiting-state / case status card
- [ ] Document Vault summary widget
- [ ] Portal Wallet widget
- [ ] Quick tools rail / stack
- [ ] Reminder feed
- [ ] Resume incomplete step/tool CTA
- [ ] Optional case stats / case strength card

### 13.2 Chapter I features
- [ ] Eligibility guided flow
- [ ] USCIS document checklist
- [ ] Filing method selector
- [ ] I-130 AutoFormFiller integration
- [ ] USCIS account creation step
- [ ] Online branch upload step
- [ ] Online branch payment step
- [ ] Online branch review/submit step
- [ ] Paper branch print step
- [ ] Paper branch payment preparation step
- [ ] Paper branch packet assembly step
- [ ] Paper branch mailing/tracking step
- [ ] Receipt notice capture and tracking

### 13.3 Chapter II features
- [ ] NVC welcome letter onboarding
- [ ] CEAC portal save-to-wallet flow
- [ ] NVC fee payment guidance
- [ ] DS-260 preparation + answer key workflow
- [ ] Civil document categorized checklist
- [ ] Affidavit Support Calculator integration
- [ ] Dynamic sponsor-generated form actions
- [ ] Dynamic financial support checklist
- [ ] CEAC sponsor addition guide
- [ ] CEAC upload placement guide
- [ ] Document Vault + PDF processing tie-in

### 13.4 Chapter III features
- [ ] Medical appointment scheduling support
- [ ] Medical appointment date/time capture
- [ ] Appointment reminder logic
- [ ] Fresh police certificate tracking
- [ ] Police certificate upload to Document Vault
- [ ] Persistent pending reminder while waiting
- [ ] Interview preparation step
- [ ] Interview appointment tracking

### 13.5 Tutorial system features
- [ ] Graphical tutorial launcher pattern
- [ ] USCIS tutorials set
- [ ] Paper filing tutorials set
- [ ] CEAC tutorials set
- [ ] Medical booking guide
- [ ] Police certificate guide
- [ ] Interview prep guide
- [ ] Tutorial asset management model

### 13.6 Storage and state features
- [ ] Step state persistence
- [ ] Chapter state persistence
- [ ] Tool session persistence
- [ ] Document statuses
- [ ] Portal records
- [ ] Receipt details
- [ ] NVC case data
- [ ] Appointment records
- [ ] Sponsor structure data
- [ ] Reminder objects

### 13.7 Reminder / logic features
- [ ] Recurring reminder engine
- [ ] Waiting-state handling
- [ ] Skippable-but-persistent task logic
- [ ] Upload-based completion logic
- [ ] Prerequisite blocking logic
- [ ] Dashboard update triggers
- [ ] Appointment approaching reminders

### 13.8 Future-ready enhancements
- [ ] automated status syncing where legally/technically appropriate
- [ ] richer waiting-period education and community modules
- [ ] stronger case-readiness recommendations
- [ ] analytics on step abandonment and tutorial usage
- [ ] advanced reminder channels
- [ ] deeper document validation rules

---

## 14. Recommended Build Order

### Phase 1 — Foundation
- roadmap data model
- dashboard shell
- chapter/step engine
- progress logic
- reminder object model
- Document Vault and Portal Wallet hooks

### Phase 2 — Chapter I
- eligibility flow
- document checklist
- filing method branch
- I-130 integration
- USCIS account step
- branch-specific online/paper steps
- receipt capture

### Phase 3 — Chapter II
- NVC welcome step
- fee step
- DS-260 prep
- civil docs
- Affidavit Support integration
- financial docs
- sponsor addition guidance
- upload guidance

### Phase 4 — Chapter III
- medical booking step
- appointment storage
- police certificate pending logic
- interview prep and appointment tracking

### Phase 5 — Content + polish
- tutorial assets
- dashboard visual tuning
- pending action prioritization
- optional case stats card
- wait-state messaging refinement

---

## 15. Summary for Developers

This roadmap should be built as a stateful journey system, not a page of static instructions. The most important implementation qualities are:
- correct journey logic
- contextual tool linking
- persistent progress state
- persistent unresolved-task surfacing
- light but precise dashboard presentation
- branch-aware step logic
- storage and reminder connectivity

The main UX risk is overloading the dashboard with too much text and too many visible modules at once. The main product risk is treating steps as complete too early when unresolved external actions still matter. The roadmap must stay clean while remaining operationally honest about what the user still needs to do.
