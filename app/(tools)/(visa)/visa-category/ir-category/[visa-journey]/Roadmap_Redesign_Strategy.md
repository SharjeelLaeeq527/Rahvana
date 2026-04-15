# Technical Strategy: IR-1 Roadmap Redesign

## 1. Executive Summary

The IR-1 Roadmap is transitioning from a static checklist to an **Intelligent Journey System**. Our goal is to build a stateful, data-driven application that guides users through the complex USCIS/NVC process with contextual tools, persistent state, and premium UI.

## 2. Core Architecture: "The Journey Engine"

We will move away from hardcoded pages and towards a **Metadata-Driven UI**. The system architecture consists of:

### 2.1 Data Layer (JSON Schema)

Each Visa Category (e.g., IR-1) will be defined by a structured JSON file.

- **Chapters**: High-level milestones (USCIS Filing, NVC Processing, etc.).
- **Steps**: Atomic units of work.
- **Types**: Each step can be `info` (instructional), `quest` (interactive branching), or `tool` (integrated Rahvana app).
- **Conditional Logic**: Rules that show/hide chapters or steps based on user choices (e.g., Online vs. Paper filing).

### 2.2 State Management

- **Progressive Persistence**: Every action (answered quest, uploaded doc, started tool) is saved to the backend (Supabase).
- **Step States**: `NOT_STARTED`, `IN_PROGRESS`, `WAITING` (external dependency), `ACTION_NEEDED`, and `COMPLETE`.
- **Global Dashboard State**: A specialized hook to calculate overall progress and surface "Pending Actions" from past chapters.

## 3. UI/UX Pillars: "Refined Minimalism"

Following the Rahvana brand guidelines:

- **Color Palette**: Teal-led (`#0d7377`), high-contrast typography, and soft slate backgrounds.
- **Progressive Disclosure**: Detailed instructions remain collapsed until requested.
- **One Action at a Time**: Each screen focused on a single task to reduce cognitive load.
- **Metro-Style Navigation**: A visual "station line" within chapters to provide immediate orientation.

## 4. Key Feature Implementation

### 4.1 Interactive Quests (The QuestRenderer)

For steps like "Determine Eligibility," we will use a dedicated `QuestRenderer` component.

- **Format**: One question per screen.
- **Logic**: Branching based on answers (e.g., if a user has a prior marriage, trigger the "Termination Proof" path).

### 4.2 Integrated Tooling

Rahvana's ecosystem tools will be embedded via modules:

- **AutoFormFiller**: Deep linked to the roadmap state.
- **Document Vault**: Real-time status sync (Missing vs. Uploaded).
- **Affidavit Support Calculator**: Drives the dynamic generation of sponsorship steps.
- **Interview Prep**: Drives the dynamic generation of interview steps.

### 4.3 Waiting State Management

Unlike a standard TODOList, the roadmap recognizes that immigration involves long pauses.

- **Waiting Cards**: Surface when a user is blocked by government processing (e.g., "Waiting for NVC Welcome Letter").
- **Persistent Pending Items**: Steps like "Police Certificate" remain visible in a "Pending" state even if the user moves forward to later chapters.

## 5. Technical Stack

- **Frontend**: Next.js (App Router), Tailwind CSS (Theming), Framer Motion (Transitions).
- **Backend**: Supabase (Persistence), FastAPI (Logic).
- **Framework**: Component-based React architecture (Atomic Design).

## 6. Development Phases

1.  **Phase 1: Foundation**: Schema definition, Progress Engine, and Layout Shell.
2.  **Phase 2: The Dashboard**: Hero cards, Progress lines, and Wallet/Vault widgets.
3.  **Phase 3: Chapter Implementation**: Building out Chapters I, II, and III with integrated Quest and Tool logic.
4.  **Phase 4: Content & Assets**: Integrating graphical tutorials and fine-tuning UX transitions.

## 7. Scalability Goal

By centralizing the logic into a JSON-driven engine, adding a new visa category (e.g., F-1 or K-1) will require **zero new UI code**, only a new data configuration and relevant content assets.
