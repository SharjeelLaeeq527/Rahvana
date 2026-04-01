# Scalability Strategy: Visa Case Strength Checker

This document outlines the strategic roadmap for scaling the Visa Case Strength Checker to support multiple visa categories (K1, B1/B2, F1, etc.) while maintaining a clean and manageable codebase.

## 1. Current Bottlenecks
*   **Database Coupling**: The `question_key` is currently an `ENUM`. This means adding any new question requires a manual database migration, which is a major point of failure and slows down development.
*   **Hardcoded Scoring Logic**: Scoring rules for IR-1/CR-1 are hardcoded in `scoring-rules.ts`. Adding new categories would require massive `switch` statements or conditional blocks, making the code brittle.
*   **Monolithic Questionnaire**: All questions are in one JSON file. As we add more categories, this file will become unreadable.
*   **Rigid Types**: The `FormData` interface is strictly typed to specific keys, making it difficult to support dynamic sets of questions.

## 2. Proposed Scalability Architecture

### A. Database Decoupling (High Priority)
*   **Action**: Change `user_case_answers.question_key` from `ENUM` to `TEXT` (or `VARCHAR`).
*   **Benefit**: Allows the frontend to define and save new question keys entirely through configuration (JSON) without database changes.

### B. Modular Data Structure
*   **Action**: Transition to a directory-based data structure:
    ```text
    data/visa-checker/
    ├── categories/
    │   ├── ir-1/
    │   │   ├── questionnaire.json
    │   │   └── rules.json (Scoring & Risk flags)
    │   ├── k1-fiance/
    │   │   ├── questionnaire.json
    │   │   └── rules.json
    │   └── b1-b2-visitor/
    │       ├── questionnaire.json
    │       └── rules.json
    ```

### C. Config-Driven Scoring Engine (The "Brain")
*   **Action**: Implement a "Scoring Engine" that evaluates rules defined in JSON rather than TypeScript.
*   **Model**: Follow the pattern in `lib/interview-prep/rules-loader.ts`.
*   **Example Rule Definition**:
    ```json
    {
      "id": "insufficient_meetings",
      "condition": {
        "field": "number_of_in_person_visits",
        "operator": "lessThan",
        "value": 2
      },
      "actions": {
        "deductPoints": 15,
        "severity": "HIGH",
        "flagCode": "NO_IN_PERSON_MEETINGS"
      }
    }
    ```

### D. Generic UI Components
*   **Action**: Ensure `QuestionStep` and `ReviewStep` are "Metadata Driven":
    *   They should take a list of questions from the JSON and render them dynamically using a `ComponentRegistry` (Text, Select, Boolean, Date).
    *   The `ReviewStep` should automatically group and label answers based on the questionnaire's `sections` array.

## 3. Implementation Roadmap

| Phase | Task | Objective |
| :--- | :--- | :--- |
| **Phase 1** | **Migration** | Convert `ENUM` to `TEXT` in Supabase. |
| **Phase 2** | **Refactor Data** | Split mono-JSON into category-specific folders. |
| **Phase 3** | **Rules Engine** | Build a logic evaluator that reads `rules.json`. |
| **Phase 4** | **New Categories** | Add K1 and B1/B2 by simply creating new JSON folders. |

## 4. Summary Recommendation
To make the tool truly scalable, we must move away from **"Code as Logic"** (Hardcoded rules) and move toward **"Data as Logic"** (Dynamic rules in JSON). This allows non-developers to add new visa categories by simply creating configuration files, without risking the stability of the core application.
