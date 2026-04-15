## **🎯 What Actually Gets Stored in DB**

### **NOT Everything** - Only User-Specific Data

```
DATABASE STORES:
✅ journeys (one per user per journey type)
✅ chapters (for THAT user's journey)
✅ steps (for THAT user's chapters)
✅ case_data (user's decisions/inputs)
```

```
CONFIG FILE STORES (NOT in DB):
✅ Journey template structure
✅ Chapter definitions
✅ Step definitions
✅ Dependencies & rules
```

---

## **📊 Example to Clarify**

### **WITHOUT Config Approach (❌ Heavy DB)**
```
If 1000 users all do IR1:
- 1000 journey records
- 1000 × 3 = 3000 chapter records (all identical)
- 1000 × 14 = 14000 step records (all identical)

DB size: HUGE, redundant data 🚫
```

### **WITH Config Approach (✅ Lean DB)**
```
Config file in backend memory:
- 1 copy of IR1 structure (3 chapters, 14 steps)
- Loaded once on server start

Database for 1000 users:
- 1000 journey records (small, just metadata)
- 1000 case_data records (user decisions only)

DB size: SMALL, only unique user data ✅
```

---

## **🔄 The Correct Flow**

### **Step 1: Load Config (Server Startup)**
```typescript
// Backend loads config ONCE
const ir1Config = require('config/journeys/ir1-roadmap.json');
// Kept in backend memory (not in DB)
```

### **Step 2: User Creates Journey**
```typescript
// User clicks "Start IR1 Journey"
// Backend:
// 1. Read config from memory (instant)
// 2. Create 1 journey record in DB
// 3. For THAT journey: create 3 chapters in DB (from config)
// 4. For THAT journey: create 14 steps in DB (from config)
```

### **Step 3: Database Contains Only This**
```
journeys table:
├── id: journey-1, user_id: user-1, journey_type: IR1, status: in_progress
├── id: journey-2, user_id: user-2, journey_type: IR1, status: not_started
└── id: journey-3, user_id: user-3, journey_type: F1, status: in_progress

chapters table (only for user-1's journey):
├── id: ch-1, journey_id: journey-1, chapter_key: chapter_1, ...
├── id: ch-2, journey_id: journey-1, chapter_key: chapter_2, ...
└── id: ch-3, journey_id: journey-1, chapter_key: chapter_3, ...

steps table (only for user-1's chapters):
├── id: step-1, chapter_id: ch-1, step_key: step_1_1, status: completed
├── id: step-2, chapter_id: ch-1, step_key: step_1_2, status: in_progress
└── ... 14 steps total per journey
```

---

### **Approach: Backend Config + DB (RECOMMENDED)**
```
Backend config file (not in DB):
{
  "chapters": [...],
  "steps": [...]
}

Database (only user-specific):
{
  "journeys": [user journey records],
  "chapters": [user's chapter instances],
  "steps": [user's step instances],
  "case_data": [user's decisions]
}

✅ Benefits:
- Config loaded once in memory (fast)
- DB stores only unique user data (lean)
- Single source of truth
- Easy to update roadmap
- Validation on server
- Audit trail
- Customization per user
- Real-time updates
- Consistency across all devices
```
---

## **📈 Database Size Comparison**

### **For 1000 users, 100 doing IR1, 50 doing F1, 50 doing H1B:**

| Approach | journeys | chapters | steps | Total Records | DB Size |
|----------|----------|----------|-------|---------------|---------|
| **Config + DB** | 200 | 450 | 2,800 | **3,450** | **~2 MB** ✅ |
| **Frontend JSON** | 200 | 450 | 2,800 | **3,450** | **~2 MB** + JSON duplication | ❌ |
| **Pure DB** | 200 | 450 | 2,800 | **3,450** | **~5 MB** + redundant | ❌ |

---

## **🎯 What You Should Do**

### **Create JSON**
```
/config/journeys/
├── ir1-roadmap.json (structure only, NOT in DB)
└── f1-roadmap.json  (structure only, NOT in DB)
```

### **Store in Database**
```
journeys → user-specific journey records
chapters → instances created from config
steps → instances created from config
case_data → user's decisions & inputs
```

---

## **💡 Why This is Better Than Frontend JSON**

| Concern | Frontend JSON | Backend Config + DB |
|---------|---------------|-------------------|
| User data separation | ❌ All on client | ✅ Secure on server |
| Real-time changes | ❌ Stale cache | ✅ Live updates |
| Customization | ❌ All users same | ✅ Per-user rules |
| Validation | ❌ Client-side | ✅ Server-side |
| Audit trail | ❌ None | ✅ Full history |
| Adding journey types | ❌ Need redeploy | ✅ Just add config |
| Performance | ❌ Download JSON | ✅ One API call |
| Data consistency | ❌ Device-dependent | ✅ Single source |

---

### **JSON Schema Template**

```json
{
  "journey_type": "IR1",
  "journey_name": "IR-1 Spousal Visa",
  "journey_description": "Immigration roadmap for spouses of US citizens",
  "total_estimated_months": 8,
  "chapters": [
    {
      "chapter_key": "chapter_1",
      "chapter_number": 1,
      "chapter_name": "Chapter I: USCIS Petition",
      "chapter_description": "File I-130 petition and wait for approval",
      "estimated_duration_months": 3,
      "display_order": 1,
      "steps": [
        {
          "step_key": "step_1_1",
          "step_number": 1,
          "step_name": "Determine Eligibility",
          "step_description": "Check if you qualify for IR-1 visa",
          "step_type": "informational",
          "tool_integration": null,
          "dependencies": [],
          "visible_when": {},
          "estimated_duration_days": 1,
          "is_required": true,
          "display_order": 1
        },
        {
          "step_key": "step_1_2",
          "step_number": 2,
          "step_name": "Fill Form I-130",
          "step_description": "Complete the I-130 form with beneficiary information",
          "step_type": "form_fillable",
          "tool_integration": "autofill_i130",
          "dependencies": ["step_1_1"],
          "visible_when": {},
          "estimated_duration_days": 3,
          "is_required": true,
          "display_order": 2
        },
        {
          "step_key": "step_1_3",
          "step_number": 3,
          "step_name": "Submit I-130 to USCIS",
          "step_description": "Submit the completed I-130 form",
          "step_type": "form_submit",
          "tool_integration": null,
          "dependencies": ["step_1_2"],
          "visible_when": {},
          "estimated_duration_days": 1,
          "is_required": true,
          "display_order": 3
        }
      ]
    },
    {
      "chapter_key": "chapter_2",
      "chapter_number": 2,
      "chapter_name": "Chapter II: NVC Processing",
      "chapter_description": "Process visa through National Visa Center",
      "estimated_duration_months": 3,
      "display_order": 2,
      "steps": [
        {
          "step_key": "step_2_1",
          "step_number": 1,
          "step_name": "NVC Case Registration",
          "step_description": "Register your case at NVC",
          "step_type": "informational",
          "tool_integration": null,
          "dependencies": [],
          "visible_when": {},
          "estimated_duration_days": 0,
          "is_required": true,
          "display_order": 1
        }
      ]
    }
  ]
}
```

---

## **📋 Field Definitions**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `journey_type` | string | ✅ | 'IR1', 'F1', 'H1B', etc. |
| `journey_name` | string | ✅ | Human-friendly name |
| `journey_description` | string | ✅ | What this journey is about |
| `total_estimated_months` | number | ✅ | Overall duration estimate |
| `chapters[].chapter_key` | string | ✅ | Unique ID: 'chapter_1', 'chapter_2' |
| `chapters[].chapter_number` | number | ✅ | Sequential: 1, 2, 3 |
| `chapters[].chapter_name` | string | ✅ | Display name |
| `chapters[].chapter_description` | string | ✅ | What happens in this chapter |
| `chapters[].estimated_duration_months` | number | ✅ | How long this chapter takes |
| `chapters[].display_order` | number | ✅ | Order to show (1, 2, 3, ...) |
| `chapters[].steps[].step_key` | string | ✅ | Unique ID: 'step_1_1', 'step_1_2' |
| `chapters[].steps[].step_number` | number | ✅ | Sequential within chapter: 1, 2, 3 |
| `chapters[].steps[].step_name` | string | ✅ | Display name |
| `chapters[].steps[].step_description` | string | ✅ | What user needs to do |
| `chapters[].steps[].step_type` | string | ✅ | 'informational', 'form_fillable', 'form_submit', 'awaiting_response', 'document_upload', 'appointment_scheduling', 'review', 'decision' |
| `chapters[].steps[].tool_integration` | string\|null | ❌ | Tool to launch: 'autofill_i130', 'interview_prep', 'case_strength', or null |
| `chapters[].steps[].dependencies` | array | ✅ | [step_keys] that must complete first: `["step_1_1"]` or `[]` for none |
| `chapters[].steps[].visible_when` | object | ✅ | Conditions for visibility: `{}` (always visible) or `{"filing_method": "online"}` |
| `chapters[].steps[].estimated_duration_days` | number | ✅ | How many days this step takes |
| `chapters[].steps[].is_required` | boolean | ✅ | Can user skip this step? |
| `chapters[].steps[].display_order` | number | ✅ | Order within chapter |

---

## **🎯 Key Info to Share**

**Tell your frontend teammate:**

1. **Structure:**
   - ONE JSON file
   - Top level: journey info
   - Nested: chapters (array)
   - Nested: steps (array of arrays)

2. **Format Rules:**
   - All field names are `snake_case` (not camelCase)
   - `chapter_key`: must start with "chapter_" (e.g., "chapter_1")
   - `step_key`: must follow pattern "step_X_Y" where X=chapter#, Y=step# (e.g., "step_1_1")
   - `dependencies`: array of step_keys that must be completed first
   - `visible_when`: empty object `{}` = always visible, or conditions like `{"filing_method": "online"}`

3. **Validation:**
   - All dependencies must reference existing step_keys
   - Numbers must be consecutive (no gaps: 1,2,3... not 1,3,5)
   - No duplicate keys
   - `step_type` must be one of the predefined values

4. **Example they should follow:**
   - Use the template above
   - Chapters in sequence (chapter_1, chapter_2, chapter_3)
   - Steps in sequence per chapter (step_1_1, step_1_2, step_1_3, etc.)
   - Set dependencies if step B depends on step A

---

## **📤 What to Tell Them**

```
Hey, I'm creating the backend JSON schema for the roadmap.
Here's the template/structure you should follow:

1. Use this JSON structure: [share template above]
2. Follow these field definitions: [share table above]
3. Key format rules:
   - chapter_key: "chapter_1", "chapter_2", "chapter_3"
   - step_key: "step_1_1", "step_1_2", "step_2_1", etc.
   - dependencies: array of step_keys (e.g., ["step_1_1"])
   - visible_when: {} or {"condition": "value"}
4. Validate that all dependencies reference existing steps
5. Send me the JSON when done, I'll load it in backend

This way we're aligned and it works perfectly!
```

---

## **✅ Why Share This?**

1. **Alignment:** Both of you use same structure
2. **No rework:** Frontend doesn't create wrong format
3. **Integration ready:** JSON loads directly into backend
4. **Saves time:** No back-and-forth corrections
