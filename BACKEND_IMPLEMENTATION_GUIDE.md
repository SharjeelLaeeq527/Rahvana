 # IR-1 Roadmap: Backend Implementation Guide

**Prepared for:** Backend Development Team  
**Version:** 1.0  
**Status:** Planning Phase - Ready for Development  
**Team:** 2 Backend Developers (14-16h/day sprint)  
**Target Timeline:** 10-14 days to production

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Database Architecture](#phase-1-database-architecture)
3. [Phase 2: API Layer](#phase-2-api-layer)
4. [Phase 3: Core Engines & Services](#phase-3-core-engines--services)
5. [Phase 4: Tool Integration Services](#phase-4-tool-integration-services)
6. [Phase 5: Production & DevOps](#phase-5-production--devops)
7. [Existing Systems Changes](#existing-systems-changes)
8. [New Modules to Build](#new-modules-to-build)
9. [Dependencies & Integration Points](#dependencies--integration-points)
10. [Daily Standup Template](#daily-standup-template)

---

## Overview

### What Backend Is Responsible For

The backend builds the **engine and data layer** that powers the roadmap. Frontend will consume your APIs; tools will communicate with your webhooks and API endpoints; database will store everything.

### Key Responsibilities

✅ **Database:** Design, migration, and data integrity  
✅ **APIs:** All endpoints that frontend, tools, and external systems use  
✅ **Business Logic:** Progress tracking, conditional logic, reminders, step completion  
✅ **Tool Integration:** Router, session storage, completion handlers  
✅ **Notifications:** Reminders, alerts, email/push notifications  
✅ **Performance:** Query optimization, caching, rate limiting  
✅ **Security:** Auth, validation, sanitization, encryption  

---

# PHASE 1: DATABASE ARCHITECTURE

## Phase 1 Overview
**Duration:** Days 1-3  
**Outcome:** Production-ready schema with migrations, indexes, and relationships  
**Blocker Status:** YES - Everything else depends on this

> **Why First:** Frontend needs to know API contracts; APIs need database schema; all business logic depends on data structure.

---

## ✅ PHASE 1 CHECKLIST

### 1.1 Database Design & Planning

- [ ] **Review existing database structure**
  - What tables already exist in Rahvana system?
  - What naming conventions do we use?
  - What auth/user schema exists?
  - Check: Do we use UUID or auto-increment IDs?
  - Check: Database (PostgreSQL, MySQL, MongoDB)?

- [ ] **Map out new tables to existing systems**
  - How do cases link to users? (FK relationship)
  - Do we have existing case/journey tables we extend?
  - Do we have existing document storage tables?
  - Do we have existing reminder/notification tables?
  - Do we have existing appointment tables?

- [ ] **Design table relationships diagram**
  - Draw relationships between all 9 tables
  - Identify FK constraints and cascade rules
  - Plan for soft deletes vs hard deletes
  - Define timestamp fields (createdAt, updatedAt)

### 1.2 Create Core Tables (In This Order)

#### Table 1: `journeys`
- [ ] Create migration file
- [ ] Add columns:
  - `id` (PK, UUID)
  - `userId` (FK to users table)
  - `caseId` (FK to cases table) — if cases table exists
  - `visaType` (VARCHAR, default 'IR-1')
  - `currentChapterId` (VARCHAR, points to chapter key)
  - `currentStepId` (VARCHAR, points to step key)
  - `filingMethod` (ENUM: 'online', 'paper', null)
  - `status` (ENUM: 'not_started', 'in_progress', 'waiting', 'complete')
  - `createdAt` (TIMESTAMP DEFAULT NOW())
  - `updatedAt` (TIMESTAMP DEFAULT NOW())
  - `deletedAt` (TIMESTAMP NULL) — soft delete support
- [ ] Add indexes:
  - `(userId, visaType)` — fast user journey lookup
  - `(caseId)` — fast case lookup
- [ ] Add constraints:
  - Unique: One active journey per user per caseId maybe? (depends on business rules)
  - Check: filingMethod only valid after certain step
- [ ] Add comments explaining each column
- [ ] Test migration up & down

**Why:** Central table tracking user's progression through entire roadmap. Everything links here.

---

#### Table 2: `chapters`
- [ ] Create migration file
- [ ] Add columns:
  - `id` (PK, UUID)
  - `journeyId` (FK to journeys)
  - `chapterKey` (VARCHAR UNIQUE) — 'chapter_1', 'chapter_2', 'chapter_3'
  - `chapterNumber` (INT) — 1, 2, 3
  - `chapterName` (VARCHAR) — 'USCIS Petition Filing', 'NVC Processing', etc.
  - `status` (ENUM: 'not_started', 'in_progress', 'complete', 'waiting')
  - `completedStepsCount` (INT DEFAULT 0)
  - `totalStepsCount` (INT)
  - `completionPercentage` (DECIMAL 5,2 DEFAULT 0.0)
  - `createdAt` (TIMESTAMP DEFAULT NOW())
  - `updatedAt` (TIMESTAMP DEFAULT NOW())
- [ ] Add indexes:
  - `(journeyId, chapterKey)` — get chapter by journey
  - `(journeyId, status)` — find active chapter
- [ ] Add constraints:
  - FK: journeyId REFERENCES journeys(id) ON DELETE CASCADE
  - Check: completionPercentage BETWEEN 0 AND 100
  - Check: completedStepsCount <= totalStepsCount
- [ ] Test migration

**Why:** Groups steps into chapters. Tracks progress within each chapter. Enables "current chapter" calculation.

---

#### Table 3: `steps`
- [ ] Create migration file
- [ ] Add columns:
  - `id` (PK, UUID)
  - `chapterId` (FK to chapters)
  - `stepKey` (VARCHAR UNIQUE) — 'I.1', 'I.2', 'II.3', 'III.4', etc.
  - `stepNumber` (INT) — position within chapter
  - `stepName` (VARCHAR) — 'Determine Eligibility', 'Fill Form I-130', etc.
  - `stepDescription` (TEXT) — brief description of what user does
  - `stepType` (ENUM: 'form', 'upload', 'question_flow', 'external_action', 'appointment', 'review')
  - `status` (ENUM: 'not_started', 'in_progress', 'completed', 'waiting', 'blocked')
  - `substatus` (VARCHAR NULL) — 'awaiting_payment_posting', 'waiting_certificate', etc.
  - `completedAt` (TIMESTAMP NULL)
  - `toolIntegration` (VARCHAR NULL) — 'form_filler_i130', 'affidavit_calculator', etc.
  - `toolUrl` (VARCHAR NULL) — URL if external tool
  - `requiresUpload` (BOOLEAN DEFAULT FALSE)
  - `requiresExternalConfirmation` (BOOLEAN DEFAULT FALSE)
  - `dependencies` (JSON) — array of stepIds that must complete first: `["step-uuid-1", "step-uuid-2"]`
  - `visibleWhen` (JSON) — conditions: `{"filingMethod": "online"}` or `{"filingMethod": ["online", "paper"]}`
  - `createdAt` (TIMESTAMP DEFAULT NOW())
  - `updatedAt` (TIMESTAMP DEFAULT NOW())
- [ ] Add indexes:
  - `(chapterId, stepNumber)` — get steps in chapter order
  - `(stepKey)` — fast step lookup
  - `(chapterId, status)` — find incomplete steps
- [ ] Add constraints:
  - FK: chapterId REFERENCES chapters(id) ON DELETE CASCADE
  - Check: stepNumber > 0
- [ ] Test migration

**Why:** Individual step definition. Contains all metadata about what step is, what tool runs, what conditions show/hide it.

---

#### Table 4: `case_data`
- [ ] Create migration file
- [ ] Add columns:
  - `id` (PK, UUID)
  - `journeyId` (FK to journeys)
  - `dataKey` (VARCHAR NOT NULL) — 'eligibility_citizenship', 'filing_method', 'sponsor_structure', etc.
  - `dataValue` (JSON) — flexible: `true`, `["online"]`, `{"structure": "joint_sponsor", "dependents": 2}`, etc.
  - `capturedAt` (TIMESTAMP DEFAULT NOW())
  - `updatedAt` (TIMESTAMP DEFAULT NOW())
- [ ] Add indexes:
  - `(journeyId, dataKey)` — fast user decision lookup
  - `(journeyId)` — get all case data for user
- [ ] Add constraints:
  - FK: journeyId REFERENCES journeys(id) ON DELETE CASCADE
  - Unique: (journeyId, dataKey) — only one value per key per journey
- [ ] Test migration

**Why:** Stores all user answers and decisions. Flexible JSON allows any type of data. Used for branching logic and prefilling forms.

---

#### Table 5: `documents`
- [ ] Create migration file
- [ ] Add columns:
  - `id` (PK, UUID)
  - `journeyId` (FK to journeys) OR `caseId` (decide based on existing system)
  - `documentType` (VARCHAR) — 'proof_citizenship', 'marriage_cert', 'police_certificate', 'tax_returns', etc.
  - `status` (ENUM: 'not_started', 'requested', 'pending', 'received', 'uploaded', 'expired', 'rejected')
  - `requiredBy` (VARCHAR) — which step requires this: 'I.2', 'II.4', etc.
  - `uploadedDate` (TIMESTAMP NULL)
  - `expiryDate` (TIMESTAMP NULL) — when document becomes invalid
  - `vaultFileId` (VARCHAR NULL) — reference to Document Vault system: paths/file-ids
  - `vaultFileUrl` (VARCHAR NULL) — direct URL if we store URLs
  - `isRequired` (BOOLEAN DEFAULT TRUE)
  - `isRecommended` (BOOLEAN DEFAULT FALSE)
  - `notes` (TEXT NULL) — user can add notes about document
  - `createdAt` (TIMESTAMP DEFAULT NOW())
  - `updatedAt` (TIMESTAMP DEFAULT NOW())
- [ ] Add indexes:
  - `(journeyId, status)` — find missing/pending documents
  - `(journeyId, requiredBy)` — documents for specific step
  - `(expiryDate)` — find expiring documents (for alerts)
- [ ] Add constraints:
  - FK: journeyId REFERENCES journeys(id) ON DELETE CASCADE
  - Check: expiryDate > uploadedDate if both exist
- [ ] Integration check: How does this link to existing Document Vault?
- [ ] Test migration

**Why:** Central document tracking. Links to Document Vault but also tracks status, expiry, requirements. Enables "missing documents" calculations and expiry alerts.

---

#### Table 6: `reminders`
- [ ] Create migration file
- [ ] Add columns:
  - `id` (PK, UUID)
  - `journeyId` (FK to journeys)
  - `stepId` (FK to steps, NULL for system reminders)
  - `reminderType` (ENUM: 'due_date_approaching', 'pending_action', 'follow_up', 'appointment_approaching', 'document_expiring')
  - `message` (VARCHAR) — 'Please upload your police certificate', etc.
  - `dueDate` (TIMESTAMP) — when reminder should fire
  - `status` (ENUM: 'active', 'snoozed', 'dismissed', 'resolved')
  - `snoozeUntilDate` (TIMESTAMP NULL) — if snoozed, when to show again
  - `nextReminderAt` (TIMESTAMP NULL) — next scheduled reminder time if recurring
  - `isRecurring` (BOOLEAN DEFAULT FALSE) — repeats until resolved?
  - `recurringIntervalDays` (INT NULL) — if recurring, every N days
  - `createdAt` (TIMESTAMP DEFAULT NOW())
  - `updatedAt` (TIMESTAMP DEFAULT NOW())
  - `sentAt` (TIMESTAMP NULL) — when notification was sent
- [ ] Add indexes:
  - `(journeyId, status, dueDate)` — get active reminders to send
  - `(stepId, status)` — get reminders for step
- [ ] Add constraints:
  - FK: journeyId REFERENCES journeys(id) ON DELETE CASCADE
  - FK: stepId REFERENCES steps(id) ON DELETE SET NULL
- [ ] Test migration

**Why:** Central reminder engine. Tracks what reminders exist, their status, and when to send next. Critical for keeping users on track.

---

#### Table 7: `tool_sessions`
- [ ] Create migration file
- [ ] Add columns:
  - `id` (PK, UUID)
  - `journeyId` (FK to journeys)
  - `stepId` (FK to steps)
  - `toolKey` (VARCHAR) — 'form_filler_i130', 'affidavit_calculator', 'interview_prep', etc.
  - `sessionState` (JSON) — entire saved state from tool: `{formAnswers: {...}, currentPage: 5, ...}`
  - `completionPercentage` (INT DEFAULT 0) — 0-100
  - `isCompleted` (BOOLEAN DEFAULT FALSE)
  - `toolOutput` (JSON NULL) — final result when complete: `{pdfUrl: "...", formData: {...}}`
  - `startedAt` (TIMESTAMP DEFAULT NOW())
  - `lastSavedAt` (TIMESTAMP DEFAULT NOW())
  - `completedAt` (TIMESTAMP NULL)
- [ ] Add indexes:
  - `(journeyId, toolKey)` — get tool session for user
  - `(stepId, toolKey)` — get session for specific step
  - `(journeyId, isCompleted)` — find incomplete tool sessions
- [ ] Add constraints:
  - FK: journeyId REFERENCES journeys(id) ON DELETE CASCADE
  - FK: stepId REFERENCES steps(id) ON DELETE CASCADE
  - Unique: (journeyId, stepId, toolKey) — one session per tool per step per user
- [ ] Test migration

**Why:** Saves tool state so users can resume mid-form. Enables "save/resume" feature. Tracks tool output for later reference.

---

#### Table 8: `portal_records`
- [ ] Create migration file
- [ ] Add columns:
  - `id` (PK, UUID)
  - `journeyId` (FK to journeys)
  - `portalType` (ENUM: 'uscis', 'ceac', 'embassy_booking', 'other')
  - `portalName` (VARCHAR) — 'USCIS Online Account', 'CEAC - New Delhi', etc.
  - `portalUrl` (VARCHAR) — link to portal
  - `accountEmail` (VARCHAR) — email associated with account (NOT password)
  - `accountUsername` (VARCHAR NULL) — if different from email
  - `accountIdentifier` (VARCHAR NULL) — case number, invoice ID, etc.
  - `nvcCaseNumber` (VARCHAR NULL) — if NVC portal
  - `nvcInvoiceId` (VARCHAR NULL) — if NVC portal
  - `savedAt` (TIMESTAMP DEFAULT NOW())
  - `lastAccessedAt` (TIMESTAMP NULL) — track if user still has access
  - `createdAt` (TIMESTAMP DEFAULT NOW())
- [ ] Add indexes:
  - `(journeyId, portalType)` — find portal of specific type
  - `(journeyId)` — all portals for user
- [ ] Add constraints:
  - FK: journeyId REFERENCES journeys(id) ON DELETE CASCADE
  - Never store passwords (security rule)
- [ ] Test migration

**Why:** Quick access to portal info without re-asking user. Enables "Portal Wallet" feature. Stores case identifiers for lookup.

---

#### Table 9: `appointments`
- [ ] Create migration file
- [ ] Add columns:
  - `id` (PK, UUID)
  - `journeyId` (FK to journeys)
  - `stepId` (FK to steps, NULL for system-created appointments)
  - `appointmentType` (ENUM: 'medical', 'interview', 'police_certificate_followup', 'other')
  - `appointmentDate` (DATE NOT NULL)
  - `appointmentTime` (TIME NULL) — time of appointment
  - `appointmentDateTime` (TIMESTAMP NULL) — combined for easier querying
  - `location` (VARCHAR NULL) — 'US Embassy, New Delhi'
  - `provider` (VARCHAR NULL) — 'Dr. Rajesh Medical Center', 'USCIS Field Office', etc.
  - `address` (TEXT NULL)
  - `phoneNumber` (VARCHAR NULL)
  - `notes` (TEXT NULL) — user's notes or system notes
  - `status` (ENUM: 'scheduled', 'completed', 'cancelled', 'rescheduled', 'pending_confirmation')
  - `reminderSentAt` (TIMESTAMP NULL) — track if 14-day reminder sent
  - `reminderSentAt7Days` (TIMESTAMP NULL) — track 7-day reminder
  - `reminderSentAt1Day` (TIMESTAMP NULL) — track 1-day reminder
  - `createdAt` (TIMESTAMP DEFAULT NOW())
  - `updatedAt` (TIMESTAMP DEFAULT NOW())
- [ ] Add indexes:
  - `(journeyId, appointmentDate DESC)` — get upcoming appointments
  - `(appointmentDate)` — find appointments needing reminders
- [ ] Add constraints:
  - FK: journeyId REFERENCES journeys(id) ON DELETE CASCADE
  - FK: stepId REFERENCES steps(id) ON DELETE SET NULL
  - Check: appointmentDate >= TODAY (cannot schedule in past)
- [ ] Test migration

**Why:** Tracks appointments for reminders and visibility. Multiple reminder timestamps track which reminders have been sent (prevents duplicate sends).

---

### 1.3 Database Seeding

- [ ] **Create seed data migration**
  - Insert all 3 chapters (Chapter I, II, III)
  - Insert all ~30 steps with correct metadata
  - Insert conditional visibility rules (JSON) for each step
  - Insert dependencies between steps
  - Insert step descriptions and instructions

- [ ] **Seed test data**
  - Create 2-3 sample test journeys
  - Complete some chapters to test progress calculations
  - Create sample documents, reminders, appointments
  - Purpose: Manual testing without UX needing to fill everything

- [ ] **Document what seed data does**
  - Comments in migration
  - How to reset seed data

### 1.4 Database Indexes & Performance

- [ ] **Create indexes on all FK columns**
  - Every FK should have index for JOIN performance
  - Check list: journeyId, chapterId, stepId on multiple tables

- [ ] **Create composite indexes for common queries**
  - `(journeyId, status)` — find incomplete items
  - `(journeyId, dataKey)` — case data lookups
  - `(journeyId, appointmentDate)` — upcoming appointments

- [ ] **Create index on JSON columns where needed**
  - If using PostgreSQL: GIN indexes for JSON searching
  - If using MySQL: may not need if not filtering on JSON content

- [ ] **Write index performance notes**
  - Expected query performance with/without index
  - When to use covering indexes vs separate

- [ ] **Test query performance**
  - Run explain plans on critical queries
  - Verify indexes are being used
  - Benchmark journey load (should be <50ms)

### 1.5 Migration Scripts & Rollback

- [ ] **Write forward migrations** (SQL up)
  - All DDL statements in correct order
  - Comments explaining each table/column

- [ ] **Write rollback migrations** (SQL down)
  - Drop tables in reverse order
  - Test rolling back then forward

- [ ] **Create migration runner script**
  - Bash/Python script to apply migrations to dev/staging/prod
  - Option to rollback specific migration
  - Dry-run mode to preview changes

- [ ] **Test migrations**
  - Run on fresh database
  - Test rollback and re-apply
  - Verify seed data loads

### 1.6 Data Integrity & Constraints

- [ ] **Add CHECK constraints**
  - completionPercentage BETWEEN 0 AND 100
  - completedStepsCount <= totalStepsCount
  - stepNumber > 0
  - appointmentDate >= CURDATE()

- [ ] **Add UNIQUE constraints**
  - (journeyId, dataKey) on case_data
  - (stepKey) on steps
  - (chapterKey) on chapters

- [ ] **Add NOT NULL constraints**
  - Decide which fields are truly not-null
  - Everything else should be nullable

- [ ] **Write data validation tests**
  - Try inserting invalid data
  - Verify constraints prevent it
  - Document constraint violation errors

### 1.7 Database Documentation

- [ ] **Create ERD (Entity Relationship Diagram)**
  - Tool: Lucidchart, DBVisualizer, or draw.io
  - Show all tables, FKs, relationships
  - Save as .png or .pdf in Docs folder

- [ ] **Document each table**
  - What it stores
  - When records are created/updated
  - Archival/cleanup strategy (soft delete vs hard delete)
  - Data retention policy

- [ ] **Document column meanings**
  - Especially JSON columns and ENUMs
  - Example values
  - Validation rules

- [ ] **Create data dictionary**
  - Table name → Purpose
  - Column name → Type → Purpose → Example values

---

## Phase 1 Deliverables

By end of Phase 1, you should have:

- ✅ 9 production-ready database tables
- ✅ Proper indexes on all critical columns
- ✅ FK constraints with cascade rules
- ✅ CHECK constraints for data validation
- ✅ Forward and rollback migrations
- ✅ Seed data for testing
- ✅ ERD diagram
- ✅ Table and column documentation
- ✅ Migration runner script
- ✅ Performance testing results

**Sign-off:** Database DBA or senior backend engineer approves schema

---

---

# PHASE 2: API LAYER

## Phase 2 Overview
**Duration:** Days 3-5  
**Builds On:** Phase 1 (database schema complete)
**Outcome:** All API endpoints defined, documented, and implemented (no business logic yet)
**Blocker Status:** Partial - Backend can work, Frontend blocked until endpoints exist

---

## ✅ PHASE 2 CHECKLIST

### 2.1 API Architecture & Standards

- [ ] **Define API standards document**
  - RESTful conventions (GET, POST, PATCH, DELETE)
  - URL naming: `/api/v1/journeys/:journeyId/steps/:stepId`
  - HTTP status codes: 200, 201, 400, 401, 403, 404, 422, 500
  - Error response format: `{ error: { code: "...", message: "...", details: {...} } }`
  - Pagination: offset/limit or cursor?
  - Rate limiting: Requests per second?

- [ ] **Define request/response format**
  - All requests send JSON Content-Type
  - Date format: ISO 8601 (2026-04-02T14:30:00Z)
  - Enum handling: strings or numbers?
  - Null values: include in JSON or omit?

- [ ] **Define authentication approach**
  - Bearer token? JWT? Session cookie?
  - Who issues tokens? (existing auth system)
  - Token expiration time?
  - Refresh token strategy?

- [ ] **Define authorization rules**
  - Can users only access their own journeys? (assume YES)
  - Admin viewing other users? (future feature)
  - Rate limiting per user?

- [ ] **Define versioning strategy**
  - API v1 path prefix
  - Backward compatibility rules
  - Deprecation timeline for old versions

### 2.2 Core Journey APIs

#### Endpoint Group: Journey Management

- [ ] **POST /api/v1/journeys**
    - Purpose: Create new IR-1 journey for user
    - Auth: Required (logged-in user)
    - Body: `{ visaType?: "IR-1", caseId?: UUID }`
    - Response: `{ id, userId, visaType, currentChapterId, currentStepId, status, progress, createdAt }`
    - Triggers: What happens after create? Create all chapters/steps? Load from seeded data?
    - Test: Create journey, verify chapters auto-created

- [ ] **GET /api/v1/journeys/:journeyId**
    - Purpose: Get full journey state (used by dashboard)
    - Auth: Required (user can only see own journeys)
    - Response: 
      ```json
      {
        journey: { id, userId, status, progress, filingMethod, ... },
        currentChapter: { id, name, status, progress, ... },
        currentStep: { id, name, type, status, ... },
        chapters: [ { id, name, status, progress }, ... ],
        caseData: { filingMethod: "online", sponsor_structure: {...}, ... },
        documents: [ { id, type, status, uploadedDate }, ... ],
        reminders: [ { id, type, message, dueDate, status }, ... ],
        appointments: [ { id, type, date, time, status }, ... ]
      }
      ```
    - Performance: Single query (maybe n+1 on documents/reminders)
    - Caching: Cache for 5 min if user hasn't changed anything?

- [ ] **PATCH /api/v1/journeys/:journeyId**
    - Purpose: Update journey (filing method, mostly)
    - Auth: Required (own journey only)
    - Body: `{ filingMethod?: "online" | "paper", status?: "..." }`
    - Response: Updated journey object
    - Logic: If filingMethod changes, trigger conditional step visibility re-evaluation
    - Test: Change filing method, verify relevant steps show/hide

- [ ] **DELETE /api/v1/journeys/:journeyId**
    - Purpose: Archive/delete journey
    - Auth: Required (own journey only) + maybe admin only?
    - Response: `{ success: true, message: "Journey archived" }`
    - Logic: Soft delete (set deletedAt timestamp)
    - Test: Delete journey, verify it doesn't show in list

- [ ] **GET /api/v1/users/:userId/journeys**
    - Purpose: List all journeys for user
    - Auth: Required (only own journeys)
    - Query params: `?status=in_progress&limit=10&offset=0`
    - Response: `{ journeys: [...], total: 5, hasMore: false }`
    - Test: Create multiple journeys, list them

---

#### Endpoint Group: Chapter Management

- [ ] **GET /api/v1/chapters/:chapterId**
    - Purpose: Get chapter details with all steps
    - Auth: Required
    - Response:
      ```json
      {
        id, name, number, status, progress,
        steps: [
          { id, name, number, type, status, completedAt, canStart: bool, ... },
          ...
        ]
      }
      ```
    - Logic: Calculate `canStart` based on dependencies
    - Test: Get chapter, verify steps in order with correct status

- [ ] **GET /api/v1/journeys/:journeyId/chapters**
    - Purpose: List all chapters for journey
    - Auth: Required
    - Response: `{ chapters: [ { id, name, status, progress }, ... ] }`
    - Test: Get all chapters, verify all 3 present

- [ ] **PATCH /api/v1/chapters/:chapterId**
    - Purpose: Update chapter (mostly auto-updates from step completion)
    - Auth: Internal only (not exposed to frontend)
    - Body: `{ status?: "...", completionPercentage?: 75 }`
    - Test: Mark chapter complete, verify progress = 100%

---

#### Endpoint Group: Step Management

- [ ] **GET /api/v1/steps/:stepId**
    - Purpose: Get step details (what user needs to do)
    - Auth: Required
    - Response:
      ```json
      {
        id, key, name, number, type, description,
        status, substatus, completedAt,
        toolIntegration, toolUrl,
        requiresUpload, requiresExternalConfirmation,
        dependencies: [ "step-uuid-1", ... ],
        visibleWhen: { ... },
        canStart: bool,
        previousStep: { id, name },
        nextStep: { id, name }
      }
      ```
    - Compute: `canStart`, `previousStep`, `nextStep` runtime

- [ ] **PATCH /api/v1/steps/:stepId**
    - Purpose: Update step status (user completing)
    - Auth: Required
    - Body: `{ status: "completed", substatus?: "...", completedAt?: timestamp }`
    - Response: Updated step, updated chapter (progress %), next step
    - Logic: 
      - Validate: Can step start? (dependencies met)
      - Validate: Is step completion valid? (type-specific)
      - Update step.status = "completed"
      - Trigger: Unlock dependent steps
      - Trigger: Recalculate chapter progress
      - Trigger: Create reminder for next step if needed
      - Trigger: Update journey.currentStepId
    - Test: Complete step, verify next step becomes current, chapter % updates

- [ ] **GET /api/v1/journeys/:journeyId/current-step**
    - Purpose: Get current step directly (dashboard shortcut)
    - Auth: Required
    - Response: Same as GET /api/v1/steps/:stepId
    - Optimization: Jump directly to current step without loading all chapters

---

### 2.3 Case Data APIs

- [ ] **POST /api/v1/journeys/:journeyId/case-data**
    - Purpose: Store user decision/answer
    - Auth: Required
    - Body: `{ dataKey: "filing_method", dataValue: "online" }`
    - Response: `{ id, journeyId, dataKey, dataValue, capturedAt }`
    - Logic: Create or update (upsert) on (journeyId, dataKey)
    - Test: Store eligibility decision, verify retrieval

- [ ] **GET /api/v1/journeys/:journeyId/case-data**
    - Purpose: Get all case data for user
    - Auth: Required
    - Response: `{ data: { filingMethod: "online", sponsorStructure: {...}, ... } }`
    - Optimization: Return as flat object (simpler) not array

- [ ] **GET /api/v1/journeys/:journeyId/case-data/:dataKey**
    - Purpose: Get single case data value
    - Auth: Required
    - Response: `{ dataKey, dataValue }`
    - Test: Get filing method, verify correct value

- [ ] **PATCH /api/v1/journeys/:journeyId/case-data/:dataKey**
    - Purpose: Update single case data value
    - Auth: Required
    - Body: `{ dataValue: "paper" }`
    - Response: Updated data
    - Logic: Trigger conditional visibility re-evaluation if relevant field changes
    - Test: Change filing method, verify steps visibility updates

- [ ] **DELETE /api/v1/journeys/:journeyId/case-data/:dataKey**
    - Purpose: Clear a decision (user wants to change something)
    - Auth: Required
    - Response: `{ success: true }`
    - Test: Delete filing method, verify step locking/unlocking

---

### 2.4 Document APIs

- [ ] **POST /api/v1/journeys/:journeyId/documents**
    - Purpose: Create document requirement or record upload
    - Auth: Required
    - Body: `{ documentType: "proof_citizenship", vaultFileId?: "vault_ref_123", expiryDate?: "2027-04-02" }`
    - Response: `{ id, journeyId, documentType, status, uploadedDate, expiryDate }`
    - Logic: If vaultFileId provided, status = "uploaded"; else status = "not_started"
    - Test: Upload document, verify vaultFileId stored

- [ ] **GET /api/v1/journeys/:journeyId/documents**
    - Purpose: Get all documents for case
    - Auth: Required
    - Query params: `?status=pending&type=proof_citizenship`
    - Response: `{ documents: [ { id, type, status, uploadedDate }, ... ], missingCount: 3 }`
    - Test: Get documents, verify counts correct

- [ ] **GET /api/v1/journeys/:journeyId/documents/:documentId**
    - Purpose: Get single document details
    - Auth: Required
    - Response: `{ id, type, status, uploadedDate, expiryDate, vaultFileId, isRequired, notes }`

- [ ] **PATCH /api/v1/journeys/:journeyId/documents/:documentId**
    - Purpose: Update document (status, expiry, notes)
    - Auth: Required
    - Body: `{ status?: "expired", expiryDate?: "...", notes?: "..." }`
    - Response: Updated document
    - Logic: If status changes to "expired", create reminder
    - Test: Mark document expired, verify reminder created

- [ ] **DELETE /api/v1/journeys/:journeyId/documents/:documentId**
    - Purpose: Remove document tracking
    - Auth: Required
    - Response: `{ success: true }`
    - Test: Delete document, verify it's gone

---

### 2.5 Reminder APIs

- [ ] **POST /api/v1/journeys/:journeyId/reminders**
    - Purpose: Create manual reminder (if frontend allows)
    - Auth: Required
    - Body: `{ stepId?: UUID, reminderType: "follow_up", message: "Follow up on police certificate", dueDate: "2026-04-15" }`
    - Response: `{ id, journeyId, stepId, reminderType, message, dueDate, status }`

- [ ] **GET /api/v1/journeys/:journeyId/reminders**
    - Purpose: Get all active reminders for case
    - Auth: Required
    - Query params: `?status=active&sort=dueDate`
    - Response: `{ reminders: [ { id, type, message, dueDate, status }, ... ] }`
    - Test: Get reminders, verify only active ones returned

- [ ] **PATCH /api/v1/reminders/:reminderId**
    - Purpose: Update reminder (dismiss, snooze, resolve)
    - Auth: Required
    - Body: `{ status: "dismissed" }` OR `{ status: "snoozed", snoozeUntilDate: "2026-04-10" }`
    - Response: Updated reminder

- [ ] **DELETE /api/v1/reminders/:reminderId**
    - Purpose: Delete reminder (rare)
    - Auth: Required

---

### 2.6 Tool Session APIs

- [ ] **PUT /api/v1/journeys/:journeyId/tool-sessions/:toolKey**
    - Purpose: Save tool session state (called during tool use)
    - Auth: Required (but tool may call via special token)
    - Body: `{ sessionState: {...}, completionPercentage: 45, isCompleted?: false }`
    - Response: `{ id, toolKey, sessionState, completionPercentage, lastSavedAt }`
    - Logic: Upsert on (journeyId, toolKey)
    - Test: Save tool session multiple times, verify state persists

- [ ] **GET /api/v1/journeys/:journeyId/tool-sessions/:toolKey**
    - Purpose: Resume tool from saved state
    - Auth: Required
    - Response: `{ toolKey, sessionState, completionPercentage, isCompleted, startedAt, lastSavedAt }`
    - Test: Save session, load it back, verify state identical

- [ ] **POST /api/v1/journeys/:journeyId/tool-sessions/:toolKey/complete**
    - Purpose: Mark tool complete (called by tool at end)
    - Auth: Required
    - Body: `{ toolOutput: {...} }`
    - Response: `{ success: true, nextStepId: "..." }`
    - Logic: 
      - Mark tool_sessions.isCompleted = true
      - Mark tool_sessions.completedAt = now
      - Mark tool_sessions.toolOutput = output
      - Mark corresponding step as "completed"
      - Calculate next step
    - Test: Complete tool, verify step marked complete

---

### 2.7 Portal Record APIs

- [ ] **POST /api/v1/journeys/:journeyId/portal-records**
    - Purpose: Save portal account info to wallet
    - Auth: Required
    - Body: `{ portalType: "uscis", portalName: "USCIS Online", portalUrl: "https://...", accountEmail: "user@example.com" }`
    - Response: `{ id, journeyId, portalType, portalName, accountEmail, savedAt }`
    - Security: Never accept passwords
    - Test: Save portal, verify retrieval

- [ ] **GET /api/v1/journeys/:journeyId/portal-records**
    - Purpose: Get all saved portals
    - Auth: Required
    - Response: `{ portals: [ { id, portalType, portalName, accountEmail, portalUrl }, ... ] }`

- [ ] **GET /api/v1/journeys/:journeyId/portal-records/:portalType**
    - Purpose: Get specific portal by type (quick access)
    - Auth: Required
    - Response: `{ id, portalType, portalName, accountEmail, portalUrl }`

- [ ] **PATCH /api/v1/journeys/:journeyId/portal-records/:portalRecordId**
    - Purpose: Update portal info
    - Auth: Required
    - Body: `{ accountEmail?: "new@example.com", portalUrl?: "..." }`
    - Response: Updated portal

- [ ] **DELETE /api/v1/journeys/:journeyId/portal-records/:portalRecordId**
    - Purpose: Remove saved portal
    - Auth: Required

---

### 2.8 Appointment APIs

- [ ] **POST /api/v1/journeys/:journeyId/appointments**
    - Purpose: Record appointment (medical, interview, etc)
    - Auth: Required
    - Body: `{ appointmentType: "medical", appointmentDate: "2026-06-15", appointmentTime: "14:00", location: "...", provider: "..." }`
    - Response: `{ id, journeyId, appointmentType, appointmentDate, appointmentTime, location, status, createdAt }`
    - Logic: Create reminders for 14 days, 7 days, 1 day before
    - Test: Create appointment, verify reminders created

- [ ] **GET /api/v1/journeys/:journeyId/appointments**
    - Purpose: Get all appointments
    - Auth: Required
    - Query params: `?upcomingOnly=true&type=medical`
    - Response: `{ appointments: [ { id, type, date, time, location, status }, ... ] }`

- [ ] **GET /api/v1/journeys/:journeyId/appointments/:appointmentId**
    - Purpose: Get appointment details

- [ ] **PATCH /api/v1/journeys/:journeyId/appointments/:appointmentId**
    - Purpose: Update appointment (reschedule, complete, cancel)
    - Auth: Required
    - Body: `{ appointmentDate?: "...", appointmentTime?: "...", status?: "completed" }`
    - Response: Updated appointment
    - Logic: If date/time changes, recalculate reminders
    - Test: Reschedule appointment, verify reminders update

- [ ] **DELETE /api/v1/journeys/:journeyId/appointments/:appointmentId**
    - Purpose: Cancel appointment

---

### 2.9 Internal/Admin Endpoints (No Frontend Access)

- [ ] **POST /api/v1/tool-completion** (webhook from external tools)
    - Purpose: Tools call back when complete (not routed through frontend)
    - Auth: Tool API key or special jwt
    - Body: `{ journeyId, toolKey, sessionState, output, signatureOrToken }`
    - Logic: Route to tool completion handler

- [ ] **POST /api/v1/admin/recalculate-progress/:journeyId**
    - Purpose: Force recalculate progress (cleanup/debugging)
    - Auth: Admin only
    - Logic: Recalculate all chapter progress %s

- [ ] **POST /api/v1/admin/send-pending-reminders**
    - Purpose: Cron job trigger to send reminders now (for testing)
    - Auth: Admin or internal only
    - Logic: Send all reminders with dueDate <= now and status = "active"

- [ ] **GET /api/v1/admin/journey-analytics**
    - Purpose: Analytics for how many users in each chapter
    - Auth: Admin only

---

### 2.10 Error Handling & Validation

- [ ] **Define validation for all endpoints**
    - User provides invalid data (journeyId doesn't exist)
    - User tries to access other user's journey (403 Forbidden)
    - Invalid state transitions (can't complete step before dependencies)
    - Data type mismatches (send string for date field)
    - Return 422 Unprocessable Entity with details

- [ ] **Create validation middleware**
    - Validates all incoming requests
    - Returns structured error responses
    - Tests validation on each endpoint

- [ ] **Define error response format**
    ```json
    {
      "success": false,
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid request",
        "details": [
          { "field": "filingMethod", "issue": "Invalid enum value" }
        ]
      }
    }
    ```

---

### 2.11 API Documentation

- [ ] **Create OpenAPI (Swagger) specification**
    - All endpoints documented
    - Request/response examples
    - Error codes documented

- [ ] **Create README for API**
    - Base URL
    - Authentication method
    - Rate limits
    - Pagination
    - Error handling

- [ ] **Create endpoint summary table**
    - Method, URL, Purpose, Auth, Response Format

---

## Phase 2 Deliverables

By end of Phase 2, you should have:

- ✅ 30+ API endpoints fully defined
- ✅ Request/response formats documented
- ✅ Authentication/authorization strategy
- ✅ Error handling standards
- ✅ Validation rules defined
- ✅ OpenAPI spec (Swagger)
- ✅ API documentation (README)
- ✅ Endpoint checklist

**Sign-off:** Frontend lead reviews APIs, confirms they have everything needed

---

---

# PHASE 3: CORE ENGINES & SERVICES

## Phase 3 Overview
**Duration:** Days 5-8  
**Builds On:** Phase 1 (DB) + Phase 2 (APIs)
**Outcome:** Business logic engines that power the roadmap
**Blocker Status:** This is what makes system actually work

---

## ✅ PHASE 3 CHECKLIST

### 3.1 Progress Engine

**What it does:** Calculates which chapter/step current, progress %, everything progress-related

**Engine Components:**

- [ ] **Service: ProgressCalculationService**
    - Method: `getCurrentChapter(journeyId)` → Chapter
      - Logic: Find first chapter with status != "complete"
      - Returns: Current chapter object with progress
      - Test: Create journey, verify Chapter I is current
    
    - Method: `getCurrentStep(chapterId)` → Step
      - Logic: Find first step with status != "completed"
      - Returns: Current step with canStart=true/false
      - Test: Complete Step I.1, verify I.2 becomes current
    
    - Method: `getChapterProgress(chapterId)` → number (0-100)
      - Logic: Count completed required steps / total required steps
      - Ignore optional steps in denominator
      - Returns: Percentage number
      - Test: Complete 3 of 10 steps, verify 30%
    
    - Method: `getJourneyProgress(journeyId)` → number (0-100)
      - Logic: (completedChapters * 33.33) + (currentChapterProgress * 0.3333) / 100
      - Rough estimate of overall position
      - Returns: Percentage
      - Test: Complete Chapter I fully, verify ~33%
    
    - Method: `evaluateStepVisibility(stepId, caseData)` → bool
      - Logic: Check step.visibleWhen JSON against case_data
      - Example: If step.visibleWhen = {filingMethod: "online"}, check case_data.filingMethod
      - Returns: true if visible, false if should be hidden
      - Test: Set filingMethod = "paper", verify paper-only steps hidden
    
    - Method: `canStartStep(stepId, journeyId)` → bool
      - Logic: Check all dependencies are completed
      - Check visibility conditions are met
      - Check prerequisites from earlier chapters done
      - Returns: true if user can start step
      - Test: Try to start S step before its dependencies, verify false

- [ ] **Write tests for ProgressCalculationService**
    - Test each method
    - Test edge cases (all steps done, no steps done, mixed)
    - Verify calculation accuracy

---

### 3.2 Conditional Logic Engine

**What it does:** Applies conditional branching (filing method, sponsor structure, country-specific)

**Engine Components:**

- [ ] **Service: ConditionalLogicEngine**
    - Method: `evaluateVisibility(step, caseData)` → bool
      - Handles complex conditions: AND, OR, NOT
      - Example: `{filingMethod: ["online", "paper"], hasChildren: false}`
      - Returns: Should step be visible?
    
    - Method: `updateDependentStepVisibility(changedDataKey, caseData, journeyId)` → void
      - When filingMethod changes, update all step visibility
      - When sponsorStructure changes, update financial docs checklist
      - Trigger: Recalculate visibility for all affected steps
      - Test: Change filing method, verify correct steps show/hide
    
    - Method: `generateDynamicChecklist(stepType, caseData)` → Document[]
      - For document/checklist steps, dynamically build list
      - Example: If sponsorStructure = "with_joint_sponsor", add sponsor financial docs
      - Example: If country = "Pakistan", add additional police certificate requirement
      - Returns: Array of document requirements
      - Test: Set sponsorStructure, verify checklist includes joint sponsor docs
    
    - Method: `evaluateStepBlockedStatus(stepId, journeyId)` → string (null | "blocked_reason")
      - Returns reason step is blocked, or null if not blocked
      - Reasons: "awaiting_dependency", "awaiting_external_data", "filing_method_not_selected"
      - Test: Try step with unmet dependencies, verify blocked reason returned

---

### 3.3 Step Completion Engine

**What it does:** Handles all logic when user completes a step

**Engine Components:**

- [ ] **Service: StepCompletionEngine**
    - Method: `completeStep(stepId, journeyId, completionData?)` → step + chapter + journey
      - Validates: Can step be marked complete?
      - Updates: step.status = "completed", step.completedAt = now
      - Triggers: 
        - Unlock dependent steps
        - Recalculate chapter progress %
        - Update journey.currentStepId
        - Create reminders for next step
        - Any external actions (e.g., trigger DS-260 availability after fee payment)
      - Returns: Updated step, chapter, journey objects
      - Test: Complete step, verify all side effects
    
    - Method: `canCompleteStep(stepId, journeyId)` → bool + errors
      - Type-specific validation
      - Example: Can't complete appointment step without date/time
      - Example: Can't complete form step without tool completion
      - Returns: true/false + list of validation errors
      - Test: Try completing step without requirements, verify error
    
    - Method: `validateStepCompletion(step, data)` → bool + errors
      - Verify data matches step type requirements
      - Form step: Verify tool marked complete
      - Upload step: Verify required files uploaded
      - Question step: Verify all questions answered
      - External action step: Verify user confirmed
      - Appointment step: Verify date/time exist
      - Returns: Validation result
      - Test: Each step type completion validation
    
    - Method: `unlockDependentSteps(completedStepId, journeyId)` → void
      - Find all steps that depend on this completed step
      - If dependencies now fully met, update their status from "blocked" to "not_started"
      - Test: Complete blocker step, verify dependent steps unlock
    
    - Method: `recalculateChapterProgress(chapterId, journeyId)` → void
      - Called after step completion
      - Recalculate completedStepsCount, totalStepsCount, completionPercentage
      - Update chapter record
      - Test: Complete step, verify chapter % updates correctly
    
    - Method: `updateCurrentStep(journeyId)` → void
      - After step completion, find new current step
      - Update journey.currentStepId
      - Test: Complete step, verify journey.currentStepId updates

---

### 3.4 Reminder Engine

**What it does:** Creates, schedules, sends, and manages reminders

**Engine Components:**

- [ ] **Service: ReminderEngine (Event-based)**
    - Method: `createReminder(journeyId, stepId, reminderType, dueDate, message)` → reminder
      - Creates reminder record in DB
      - Schedules notification delivery
      - Test: Create reminder, verify record exists
    
    - Method: `onStepBecomesCurrent(stepId, journeyId)` → void
      - Called when step becomes current step
      - Create automatic reminders based on step type
      - Example: Appointment step → create 14-day, 7-day, 1-day reminders
      - Example: Document upload step → create 3-day reminder
      - Example: External action step → create 1-week reminder
      - Test: Make step current, verify reminders created
    
    - Method: `onAppointmentScheduled(appointmentId, journeyId)` → void
      - Called when appointment created
      - Create 14-day, 7-day, 1-day before reminders
      - Test: Create appointment, verify 3 reminders created
    
    - Method: `onDocumentExpiringSoon(documentId)` → void
      - Called by job when document approaching expiry
      - Create reminder 1 month before expiry
      - Test: Create doc with 29-day expiry, verify reminder created
    
    - Method: `getPendingReminders()` → reminder[]
      - Find all reminders with dueDate <= now and status = "active"
      - Used by notification job to send them
      - Returns: Array of reminders needing delivery
      - Test: Find reminders that should be sent now
    
    - Method: `dismissReminder(reminderId)` → void
      - User dismisses reminder
      - Set status = "dismissed"
    
    - Method: `snoozeReminder(reminderId, snoozeUntilDate)` → void
      - User snoozes reminder
      - Set status = "snoozed", snoozeUntilDate = future date
      - Test: Snooze reminder, verify it disappears then reappears

---

### 3.5 Tool Integration Service

**What it does:** Routes users to tools, manages sessions, handles completion

**Engine Components:**

- [ ] **Service: ToolIntegrationService**
    - Method: `getLaunchConfig(stepId, journeyId)` → ToolLaunchConfig
      - Determine which tool for this step
      - Get pre-filled data from case_data table
      - Get resume session if exists
      - Returns: Config object with tool URL, preloadData, callbacks
      - Test: Get launch config for I-130 step, verify correct tool URL
    
    - Method: `preloadToolData(toolKey, journeyId)` → object
      - Gather all data tool needs to pre-fill form
      - Example: I-130 tool needs: petitioner name, beneficiary name, marriage date, etc.
      - Gets data from case_data and user profile
      - Returns: Preloaded JSON
      - Test: Get preload data, verify all fields populated
    
    - Method: `getResumeSession(journeyId, toolKey)` → ToolSession | null
      - Check if user has partial session for this tool
      - Returns: Saved session state or null
      - Test: Save session, get it back, verify content
    
    - Method: `saveToolSession(journeyId, toolKey, sessionState, completionPercentage)` → void
      - Called by tool or webhook while user using tool
      - Upsert on (journeyId, toolKey)
      - Test: Save session, update it, verify latest version stored
    
    - Method: `handleToolCompletion(journeyId, toolKey, output)` → void
      - Called when tool finishes
      - Mark tool_session.isCompleted = true
      - Store tool output (generated PDFs, form data, etc.)
      - Mark corresponding step as completed
      - Trigger: Unlock next steps
      - Test: Complete tool, verify step marked done
    
    - Method: `handleToolCompletionWebhook(signature, payload)` → void
      - External tool calls back via webhook
      - Verify signature/JWT
      - Extract journeyId, toolKey, output
      - Call handleToolCompletion

---

### 3.6 Tool-Specific Handlers

- [ ] **Handler: I-130 AutoFormFiller**
    - On launch: Preload petitioner/beneficiary info
    - On complete: Extract filled form → PDF, store in vault
    - Resume: Load saved form answers
    - Test: Complete I-130, verify PDF generated and saved

- [ ] **Handler: Affidavit Support Calculator**
    - On launch: Preload household structure, income data
    - On complete: Extract sponsor structure, generate required forms list
    - Trigger: Update case_data.sponsorStructure
    - Trigger: Regenerate Step II.6 checklist
    - Test: Complete calculator, verify Step II.6 checklist updates

- [ ] **Handler: Interview Prep Tool**
    - On launch: Show what's complete so far, interview date if scheduled
    - On complete: Mark step complete
    - Resume: Show completed sections, resume where left off
    - Test: Complete interview prep, verify step done

- [ ] **Handler: Case Strength Checker**
    - On calculate: Analyze case_data + documents
    - Return: Score, missing items, recommendations
    - On update: Recalculate when docs/data change
    - Test: Upload docs, verify score updates

---

### 3.7 Notification Service (New Module - See Section 8)

**What it does:** Queue and send all notifications (reminders, alerts)

- [ ] **Create NotificationService** (detailed in "New Modules" section)
    - Methods: sendEmail, sendPush, sendInApp, queue
    - Used by: ReminderEngine, monitoring system
    - Test: Queue notification, verify sent

---

### 3.8 Engine Integration Tests

- [ ] **Write integration tests**
    - Test full flow: User completes step → reminders created → next step unlocked
    - Test: Filing method changed → steps show/hide
    - Test: Sponsor structure determined → checklist updates
    - Test: Tool completes → step completes → journey updates
    - Coverage: 100% of critical paths

---

## Phase 3 Deliverables

By end of Phase 3, you should have:

- ✅ ProgressCalculationService fully implemented
- ✅ ConditionalLogicEngine fully implemented
- ✅ StepCompletionEngine fully implemented
- ✅ ReminderEngine fully implemented
- ✅ ToolIntegrationService fully implemented
- ✅ Tool-specific handlers (I-130, Affidavit, Interview, Case Strength)
- ✅ NotificationService interface defined (implementation in Phase 4)
- ✅ Unit tests for all services (80%+ coverage)
- ✅ Integration tests for critical paths
- ✅ Services documentation

**Sign-off:** Engineering lead reviews business logic, runs test suite

---

---

# PHASE 4: SUPPORTING SERVICES & INFRASTRUCTURE

## Phase 4 Overview
**Duration:** Days 7-10  
**Builds On:** Phases 1-3
**Outcome:** All services complete, production-ready

---

## ✅ PHASE 4 CHECKLIST

### 4.1 New Modules to Build

#### 4.1.1 Notification Service (New Module)

- [ ] **Create NotificationService**
    - Methods:
      - `sendEmailReminder(userId, reminderMessage)` → success bool
      - `sendPushNotification(userId, title, message)` → success bool
      - `sendInAppNotification(userId, message)` → creates in-app message
      - `queueNotification(userId, type, data)` → adds to queue
      - `sendPendingNotifications()` → cron job, sends all queued
    
    - Store: Create `notifications` and `notification_queue` tables
      - notifications: Track sent history
      - notification_queue: Pending notifications to send
    
    - External: Integrate with email service (SendGrid? AWS SES?)
    - External: Integrate with push notification service (Firebase? OneSignal?)
    
    - Test: Queue notification, run job, verify sent

- [ ] **Create notification job/scheduler**
    - Cron: Every 5 minutes, send pending notifications
    - Check: All reminders with dueDate <= now, status = "active"
    - Call: NotificationService.sendPendingNotifications()
    - Mark reminders as sent: Update sentAt timestamp
    - Handle failures: Retry up to 3 times
    - Test: Schedule job locally, verify it runs

#### 4.1.2 Data Validation Service (New Module)

- [ ] **Create DataValidationService**
    - Methods:
      - `validateJourneyInput(data)` → errors[]
      - `validateCaseData(dataKey, dataValue)` → errors[]
      - `validateDocument(documentType, data)` → errors[]
      - `validateAppointment(appData)` → errors[]
      - `validateStepCompletion(step, data)` → errors[]
    
    - Purpose: All API endpoints use this before updating DB
    - Rules: Type checking, enum validation, date validation, constraint checking
    - Returns: Array of violation objects with field names and messages
    - Test: Try invalid data, verify caught

#### 4.1.3 Audit/Logging Service (New Module)

- [ ] **Create AuditService**
    - Log all meaningful changes:
      - User completed step
      - User uploaded document
      - Filing method changed
      - Appointment scheduled
      - Reminder sent
    
    - Store: `audit_log` table
      - userId, action, affectedEntityId, affectedEntityType, timestamp, ipAddress, changes (JSON)
    
    - Purpose: Track user actions for debugging, compliance, analytics
    - Test: Complete step, verify audit log created

#### 4.1.4 Analytics Service

- [ ] **Create AnalyticsService**
    - Methods:
      - `trackEvent(userId, eventType, metadata)` → void
      - `getJourneyMetrics(journeyId)` → metrics
      - `getUserMetrics(userId)` → metrics
      - `getSystemMetrics()` → metrics
    
    - Events to track:
      - user_started_journey
      - step_completed
      - document_uploaded
      - tool_started
      - tool_completed
      - appointment_scheduled
      - reminder_sent
      - reminder_clicked
    
    - Use: Send to analytics platform (Mixpanel, Amplitude, custom)
    - Purpose: Understand user behavior, find drop-off points
    - Test: Track event, verify sent to analytics

### 4.2 Existing System Integration Changes

#### 4.2.1 Integration with User/Auth System

- [ ] **Verify user auth integration**
    - Confirm: How are users identified? (userId header, JWT, session?)
    - Confirm: How to verify user owns journey? (userId in JWT, session check?)
    - Integrate: Add middleware to verify user auth on all endpoints
    - Test: Try accessing other user's journey, verify 403 Forbidden

#### 4.2.2 Integration with Document Vault

- [ ] **API client for Document Vault**
    - Create: DocumentVaultClient service
    - Methods:
      - `uploadFile(userId, file, metadata)` → vaultFileId
      - `getFile(vaultFileId)` → fileUrl
      - `deleteFile(vaultFileId)` → success
      - `listUserFiles(userId, filters)` → file[]
    
    - Integration points:
      - When user uploads in Step I.2 → call uploadFile → store vaultFileId in documents table
      - When showing document list → call getFile URLs → display in UI
      - Expiry alerts → check files with expiryDate <= 30 days from now
    
    - Test: Upload file, verify vaultFileId returned and stored

#### 4.2.3 Integration with Portal Wallet (if exists)

- [ ] **Verify Portal Wallet integration**
    - Confirm: Does Portal Wallet already exist?
    - If yes: Create API client to store/retrieve from it
    - If no: We're implementing Portal Wallet in our tables (already defined)
    - Methods: storePortalRecord, getPortalRecord, listUserPortals
    - Test: Save portal, verify stored and retrieved

#### 4.2.4 Integration with Existing Case System

- [ ] **Map to existing case structure**
    - Confirm: How do cases exist in Rahvana?
    - Confirm: What's caseId format?
    - Verify: Can we FK journeys to cases?
    - Test: Create journey, verify linked to case correctly

### 4.3 Caching Strategy

- [ ] **Implement caching layer**
    - Tool: Redis or in-memory cache
    - What to cache:
      - `journey:{journeyId}` — journey + chapters, expires 5 min
      - `case-data:{journeyId}` — all case data, expires 5 min
      - `steps:{chapterId}` — all steps in chapter, expires 1 hour (rarely changes)
      - `appointments:{journeyId}` — upcoming appointments, expires 30 min
    
    - Invalidation:
      - When step completed → invalidate journey cache
      - When case data changes → invalidate case-data cache
      - When appointment created → invalidate appointment cache
    
    - Test: Update data, verify cache cleared, verify data fresh

### 4.4 Rate Limiting

- [ ] **Implement rate limiting**
    - Per-user: 100 requests per minute
    - Per-IP: 1000 requests per minute
    - Tool: Use Redis-based rate limiter
    - Return: 429 Too Many Requests if exceeded
    - Test: Make 101 requests quickly, verify 429 on 101st

### 4.5 Error Handling & Monitoring

- [ ] **Setup error tracking**
    - Tool: Sentry or similar
    - Capture: All exceptions, errors, warnings
    - Context: Include userId, journeyId, step info
    - Alert: Critical errors sent to Slack
    - Test: Throw error, verify captured in Sentry

- [ ] **Setup logging**
    - Log levels: ERROR, WARN, INFO, DEBUG
    - Log destinations: File + stdout
    - Log format: JSON for parsing
    - Retention: 30 days
    - Test: Trigger log, verify in log file

- [ ] **Setup monitoring**
    - Metrics: Request count, error count, response time, cache hit rate
    - Dashboards: API health, database queries, notification status
    - Tool: Datadog, New Relic, or custom Prometheus
    - Test: View dashboard, verify metrics updating

### 4.6 Performance Optimization

- [ ] **Database query optimization**
    - Identify slow queries: Use EXPLAIN plans
    - Add missing indexes
    - Optimize N+1 problems (batch load related data)
    - Test: Load journey, verify <50ms response

- [ ] **Connection pooling**
    - Configure pool size (20-50 connections)
    - Max waiting time before timeout
    - Test: Concurrent requests, verify pool works

- [ ] **Batch operations**
    - Example: Sending 100 reminders → batch insert notification records
    - Example: Updating progress for 10 chapters → batch update
    - Test: Large operations, verify performance acceptable

---

## PHASE 4 Deliverables

By end of Phase 4, you should have:

- ✅ NotificationService fully implemented with queue/job
- ✅ DataValidationService for all inputs
- ✅ AuditService logging all changes
- ✅ AnalyticsService tracking events
- ✅ Document Vault integration tested
- ✅ Portal Wallet integration tested
- ✅ User/auth integration verified
- ✅ Caching layer implemented
- ✅ Rate limiting configured
- ✅ Error tracking (Sentry) configured
- ✅ Logging configured
- ✅ Monitoring/dashboards set up
- ✅ Performance optimizations complete
- ✅ Tests for all new services

---

---

# PHASE 5: PRODUCTION & DEVOPS

## Phase 5 Overview
**Duration:** Days 10-14  
**Objective:** Production-ready system with deployment, monitoring, scaling
**Outcome:** Ready to go live

---

## ✅ PHASE 5 CHECKLIST

### 5.1 Testing

- [ ] **Finalize unit tests**
    - Target: 85%+ code coverage
    - Fix: Any failing tests
    - Add: Missing edge case tests
    - Run: Full test suite locally

- [ ] **Finalize integration tests**
    - Full flow: Create journey → complete steps → unlock chapters → schedule appointments
    - Branching: Online vs paper filing paths
    - Conditional logic: Filing method → step visibility
    - Tool integration: Launch tool → save/resume → complete
    - Test: Run full test suite

- [ ] **Load testing**
    - Scenario: 1000 concurrent users
    - Measure: Response times, error rates, resource usage
    - Tool: JMeter or Artillery
    - Target: p95 response < 500ms

- [ ] **Deployment testing**
    - Test: Run full deploy process on fresh server
    - Test: Database migrations applied
    - Test: Services start correctly
    - Test: Health checks pass

### 5.2 Database Backups & Recovery

- [ ] **Configure automated backups**
    - Frequency: Every 6 hours
    - Retention: 30 days
    - Storage: Separate location from main DB
    - Test: Perform restore from backup, verify data

- [ ] **Create database recovery runbook**
    - How to restore from backup
    - How long it takes
    - RTO (Recovery Time Objective): < 1 hour
    - RPO (Recovery Point Objective): < 6 hours

### 5.3 Deployment Process

- [ ] **Create deployment checklist**
    - Pre-deployment: Run tests, health checks
    - Deployment: Run migrations, deploy code, restart services
    - Post-deployment: Verify endpoints work, check logs for errors
    - Rollback: Steps to revert if issues

- [ ] **Setup feature flags**
    - Tool: LaunchDarkly or custom
    - Flags: For new engines, new features, gradual rollout
    - Gradual rollout: 10% → 50% → 100% users

- [ ] **Document deployment steps**
    - Step-by-step instructions
    - Who can deploy (team members)
    - Estimated time (10 min?)
    - Rollback time if needed

### 5.4 Monitoring & Alerting

- [ ] **Setup monitoring dashboards**
    - Metrics:
      - API response times (p50, p95, p99)
      - Error rate (% of requests that fail)
      - Database connection pool usage
      - Cache hit rate
      - Notification queue size
      - Background job status
    
    - Dashboards: Operations team, on-call engineer, management

- [ ] **Setup alerting**
    - Alert triggers:
      - Error rate > 1% for 5 min
      - Response time p95 > 1 second
      - API down (status code 503)
      - Database connection pool high (>80%)
      - Notification queue backing up (>1000 pending)
      - Background job failure
    
    - Alert destinations: Slack, PagerDuty, SMS
    - Test: Trigger alert, verify Slack message received

### 5.5 Documentation for Production

- [ ] **Create runbooks**
    - Common issues & fixes
    - Troubleshooting database slow queries
    - Clearing cache if data inconsistent
    - Manually sending reminder if stuck
    - Checking notification delivery logs

- [ ] **Create architecture documentation**
    - How do all systems connect?
    - Data flow diagrams
    - Service dependencies
    - How to add new step/tool

- [ ] **Create dependency map**
    - What services depend on what
    - External dependencies: Email service, Document Vault
    - Failure scenarios & mitigations

### 5.6 Security Review

- [ ] **Security audit checklist**
    - [ ] All input validated and sanitized
    - [ ] SQL injection: Use parameterized queries? Check
    - [ ] XSS: Return valid JSON? Check
    - [ ] CSRF: API endpoints don't require form tokens? OK for JSON APIs
    - [ ] Passwords: Never stored? Check
    - [ ] Secrets: Stored in env vars, not in code? Check
    - [ ] HTTPS: All endpoints HTTPS? Check
    - [ ] Auth: Verify user owns resource? Check
    - [ ] Database: Encrypt sensitive fields? (case data? filingMethod? No, not sensitive. Reminders? No.)
    - [ ] Logs: Don't log passwords, emails? Check

- [ ] **Secrets management**
    - Tool: HashiCorp Vault? AWS Secrets Manager? Environment variables?
    - Secrets needed: Database password, API keys, JWT signing key
    - Rotation policy: Change secrets quarterly?

### 5.7 Scalability Plan

- [ ] **Horizontal scaling**
    - Multiple API server instances
    - Load balancer in front
    - Session store (Redis) for shared state

- [ ] **Vertical scaling**
    - Can we just make servers bigger?
    - Database can handle 100k journeys? 1M? Plan accordingly

- [ ] **Document scaling steps**
    - When to add more servers
    - How to add them without downtime
    - Load testing strategy

### 5.8 Cutover Plan (Going Live)

- [ ] **Data migration**
    - Are there existing journeys/cases to migrate?
    - Migration script: Transform old data to new schema
    - Validation: Verify migration accuracy
    - Rollback: Can we restore if migration fails?

- [ ] **User communication**
    - When will system launch?
    - What will change for users?
    - Support contact if issues

- [ ] **Monitoring during launch**
    - Extra eyes on dashboards
    - On-call engineer available
    - Ability to rollback if critical issue

---

## Phase 5 Deliverables

By end of Phase 5, you should have:

- ✅ 85%+ code coverage
- ✅ Integration & E2E tests passing
- ✅ Load test results
- ✅ Automated backups configured
- ✅ Recovery testing completed
- ✅ Feature flags configured
- ✅ Monitoring dashboards live
- ✅ Alerting configured and tested
- ✅ Runbooks written
- ✅ Architecture documentation
- ✅ Security audit completed
- ✅ Secrets management configured
- ✅ Scalability plan documented
- ✅ Cutover plan documented
- ✅ GO/NO-GO review passed

---

---

# EXISTING SYSTEMS CHANGES

What changes are required to existing Rahvana systems to support the roadmap?

## Required Changes

### 1. User/Case System

- [ ] **Verify user-case relationship**
    - How do cases attach to users?
    - Can multiple journeys attach to one case?
    - Need to update schema? (Probably not)

### 2. Document/Vault System

- [ ] **Integration check**
    - Existing API endpoints for:
      - Upload file → get fileId
      - Get file URL
      - List user files
      - Delete file
    - If any missing, need to add

### 3. Email/Notification System

- [ ] **Integration check**
    - Existing method to send email?
    - Send to: email service, SMS service, push service?
    - Current API endpoints for sending?
    - If missing, need to build NotificationService

### 4. Authentication System

- [ ] **Verify auth integration**
    - How are users logged in?
    - JWT tokens? Sessions? OAuth?
    - Current middleware for protecting routes?
    - Need to add/update middleware for roadmap routes

### 5. Logging/Monitoring System

- [ ] **Verify logging infrastructure**
    - Is Sentry already setup?
    - Is DataDog/New Relic already setup?
    - If yes: Just configure for roadmap
    - If no: Need to implement

---

---

# NEW MODULES TO BUILD

Services/systems that don't exist yet and need to be created fresh:

## 1. NotificationService ✅
- Purpose: Queue and send reminders/alerts
- Tables: `notifications`, `notification_queue`
- External: Email service, push service integration
- Status: **NEW - Build in Phase 4**

## 2. ProgressCalculationService ✅
- Purpose: Calculate current chapter/step/progress %
- Tables: Uses existing journey/chapter/step tables
- Status: **NEW - Build in Phase 3**

## 3. ConditionalLogicEngine ✅
- Purpose: Evaluate step visibility, branching logic
- Tables: Uses steps.visibleWhen JSON
- Status: **NEW - Build in Phase 3**

## 4. StepCompletionEngine ✅
- Purpose: Handle step completion logic
- Tables: Updates steps, chapters, journeys
- Status: **NEW - Build in Phase 3**

## 5. ReminderEngine ✅
- Purpose: Create and manage reminders
- Tables: `reminders`
- Status: **NEW - Build in Phase 3**

## 6. ToolIntegrationService ✅
- Purpose: Route to tools, manage sessions
- Tables: `tool_sessions`
- Status: **NEW - Build in Phase 3**

## 7. DataValidationService ✅
- Purpose: Validate all inputs
- Tables: None (uses existing tables)
- Status: **NEW - Build in Phase 4**

## 8. AuditService ✅
- Purpose: Log all changes for audit trail
- Tables: `audit_log`
- Status: **NEW - Build in Phase 4**

## 9. AnalyticsService ✅
- Purpose: Track user events for analytics
- Tables: `analytics_events` (or external service)
- Status: **NEW - Build in Phase 4**

---

---

# DEPENDENCIES & INTEGRATION POINTS

### To Start Phase 1:
- ✅ None - can start immediately

### To Start Phase 2:
- ✅ Phase 1 (DB schema complete)

### To Start Phase 3:
- ✅ Phase 1 (DB schema)
- ✅ Phase 2 (API contracts)

### To Start Phase 4:
- ✅ Phases 1-3 complete
- ⏳ Integration with existing systems (Document Vault, Auth, Email)

### To Start Phase 5:
- ✅ Phases 1-4 complete

### Integration Dependencies:
- **Frontend:** Needs Phase 2 (APIs) complete
- **Tools:** Need Phase 3 (ToolIntegrationService) + callbacks/webhooks
- **Document Vault:** Need ToolIntegrationService to upload docs
- **User/Auth:** Already exists, just need to verify compatibility
- **Email/Notifications:** Might exist, might need to build

---

---

# DAILY STANDUP TEMPLATE

Use this at daily standup with frontend/product/QA:

```
BACKEND STANDUP

What We Completed Yesterday:
- [Phase 1] Created journeys, chapters, steps tables
- [Phase 2] Implemented 10 API endpoints
- [Phase 3] Built ProgressCalculationService

What We're Doing Today:
- Complete remaining 5 API endpoints
- Build ConditionalLogicEngine
- Write tests for ProgressEngine

Blockers:
- Waiting for Document Vault API specs from [person]
- Need clarity on filingMethod logic from product

Help Needed:
- Frontend needs to review API contracts by EOD
- DevOps to setup Redis for caching

Questions:
- How should we handle edge case where user is in Step X but tries to jump to Step Z?
```

---

---

## SUMMARY CHECKLIST

### Phase 1: Database (Days 1-3)
- [ ] 9 database tables created and tested
- [ ] Migrations working forward and backward
- [ ] Seed data loaded
- [ ] Indexes created
- [ ] Documentation complete

### Phase 2: APIs (Days 3-5)
- [ ] 30+ API endpoints defined
- [ ] Request/response formats documented
- [ ] Error handling standards defined
- [ ] OpenAPI spec created
- [ ] API documentation written

### Phase 3: Engines (Days 5-8)
- [ ] ProgressCalculationService complete
- [ ] ConditionalLogicEngine complete
- [ ] StepCompletionEngine complete
- [ ] ReminderEngine complete
- [ ] ToolIntegrationService complete
- [ ] Tests written (80%+ coverage)

### Phase 4: Services (Days 7-10)
- [ ] NotificationService implemented
- [ ] DataValidationService implemented
- [ ] AuditService implemented
- [ ] AnalyticsService implemented
- [ ] Integrations with existing systems verified
- [ ] Caching layer implemented
- [ ] Rate limiting configured
- [ ] Error tracking (Sentry) setup
- [ ] Logging configured
- [ ] Monitoring dashboards created

### Phase 5: Production (Days 10-14)
- [ ] Tests finalized (85%+ coverage)
- [ ] Load testing completed
- [ ] Backups configured
- [ ] Deployment scripts created
- [ ] Monitoring & alerting live
- [ ] Runbooks written
- [ ] Security audit passed
- [ ] Secrets management configured
- [ ] Ready for production deployment

---

**TOTAL ESTIMATED EFFORT:** 2 Backend Developers × 14 days = 28 person-days

**Expected Timeline:** 14 calendar days (10-14 days effective with aggressive sprint)
