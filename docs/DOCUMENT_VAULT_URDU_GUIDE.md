# Document Vault Feature - Complete Roman Urdu Guide

## Bhaii ye kya hai? (Overview)

Document Vault ek **immigration document management system** hai jo **Pakistan se U.S. visa apply karne walon** ke liye banaya gaya hai. Ye system automatically track karta hai ke aapko konsi documents chahiye, unko store karta hai, aur expiry dates ka dhyan rakhta hai.

---

## Main Features (Kya kya features hain?)

### 1. **Personalized Document Checklist**
- Aapki visa category (jaise IR-1, CR-1, F1, etc.) ke mutabiq documents ki list banata hai
- Agar pehle marriage hui thi, joint sponsor hai, ya koi aur special case hai toh usske mutabiq documents add ho jate hain
- Total **30+ different types of documents** track hote hain

### 2. **Smart Document Organization**
- Documents ko **8 categories** mein organize karta hai:
  - Civil Documents (Birth Certificate, Nikah Nama, CNIC, etc.)
  - Financial Documents (Tax Returns, Employment Letter, Bank Statements)
  - Relationship Evidence (Wedding Photos, Communication Proof)
  - Police/Court/Military Documents
  - Medical Documents
  - Photos (Passport Photos)
  - Translations
  - Miscellaneous (DS-260, I-130 Approval, etc.)

### 3. **Automatic File Naming**
- Har file ka naam automatically standardized format mein save hota hai
- Format: `CASE_ID_ROLE_PERSON_NAME_DOCUMENT_KEY_DATE_VERSION.extension`
- Example: `IOE123456789_BENEFICIARY_AHMED_KHAN_NIKAH_NAMA_2025-12-23_v1.pdf`
- Ye naming convention se sab documents organized rehte hain

### 4. **Expiration Tracking**
- Automatically track karta hai ke konsi document kab expire ho rahi hai
- Color-coded warnings:
  - 🔴 Red: Expired documents
  - 🟡 Yellow: 30 days mein expire hone wali
  - 🟢 Green: Valid documents
- Notifications deta hai agar koi document expire hone wali ho

### 5. **Document Acquisition Wizard**
- Har document ke liye **step-by-step guide** hai
- Pakistan-specific information:
  - Kahan se milegi ye document?
  - Kitna time lagega?
  - Kitna paisa lagega?
  - Kya documents chahiye honge?
- Links to NADRA, U.S. Embassy, aur other resources

### 6. **Export Functionality**
- Ek click mein saari documents **ZIP file** mein download ho jati hain
- Category-wise folders mein organized
- Metadata file bhi include hoti hai

### 7. **Progress Tracking**
- Real-time dashboard dikhata hai:
  - Kitni documents upload hui hain
  - Kitni missing hain
  - Kitni expire ho rahi hain
  - Overall completion percentage

---

## Database Structure (Database mein kya store hota hai?)

### Table 1: `document_vault_config`
**Ye table user ki configuration store karta hai**

```sql
CREATE TABLE document_vault_config (
  id UUID PRIMARY KEY,
  user_id UUID (Auth users se link),
  visa_category TEXT (jaise 'IR-1', 'CR-1'),
  scenario_flags JSONB (special cases ka data),
  case_id TEXT (USCIS case number),
  petitioner_name TEXT (U.S. citizen ka naam),
  beneficiary_name TEXT (Pakistan waale ka naam),
  joint_sponsor_name TEXT (agar joint sponsor hai),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example data:**
```json
{
  "user_id": "abc-123",
  "visa_category": "IR-1",
  "scenario_flags": {
    "prior_marriage_beneficiary": true,
    "joint_sponsor_used": false
  },
  "case_id": "IOE123456789",
  "petitioner_name": "John Smith",
  "beneficiary_name": "Ahmed Khan"
}
```

### Table 2: `documents`
**Ye table har uploaded document ki details store karta hai**

```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  user_id UUID (kis user ki document hai),
  document_def_id TEXT (document type ka ID),
  original_filename TEXT (user ne jo naam diya tha),
  standardized_filename TEXT (system ne jo naam banaya),
  file_size BIGINT (file ka size bytes mein),
  mime_type TEXT (PDF, JPG, etc.),
  storage_path TEXT (file kahan save hui hai),
  uploaded_at TIMESTAMP (kab upload hui),
  uploaded_by TEXT (BENEFICIARY, PETITIONER, etc.),
  version INTEGER (1, 2, 3... agar multiple versions hain),
  expiration_date TIMESTAMP (kab expire hogi),
  is_expired BOOLEAN (expire ho gayi ya nahi),
  status TEXT (UPLOADED, MISSING, NEEDS_ATTENTION, EXPIRED),
  notes TEXT (user ke notes),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example data:**
```json
{
  "id": "doc-xyz-789",
  "user_id": "abc-123",
  "document_def_id": "nikah-nama",
  "original_filename": "marriage_certificate.pdf",
  "standardized_filename": "IOE123456789_BENEFICIARY_AHMED_KHAN_NIKAH_NAMA_2025-12-23_v1.pdf",
  "file_size": 2458624,
  "mime_type": "application/pdf",
  "storage_path": "uploads/document-vault/abc-123/doc-xyz-789/IOE123456789_BENEFICIARY_AHMED_KHAN_NIKAH_NAMA_2025-12-23_v1.pdf",
  "uploaded_at": "2025-12-23T10:30:00Z",
  "uploaded_by": "BENEFICIARY",
  "version": 1,
  "expiration_date": null,
  "is_expired": false,
  "status": "UPLOADED",
  "notes": "NADRA se mila hua certificate"
}
```

---

## Code Structure (Kahan kya code likha hai?)

### 1. **Types aur Definitions** (`lib/document-vault/`)

#### `types.ts` - Saare TypeScript types
- `VisaCategory`: Visa types (IR-1, CR-1, F1, etc.)
- `DocumentCategory`: Document categories (CIVIL, FINANCIAL, etc.)
- `DocumentRole`: Kaun upload kar raha hai (PETITIONER, BENEFICIARY, etc.)
- `DocumentStatus`: Document ki state (UPLOADED, MISSING, EXPIRED)
- `UploadedDocument`: Uploaded document ka structure
- `DocumentVaultConfig`: User ki configuration ka structure

#### `document-definitions.ts` - 30+ Document Definitions
Har document ki puri details:
```typescript
{
  id: 'nikah-nama',
  key: 'NIKAH_NAMA',
  name: 'Nikah Nama (Marriage Certificate)',
  description: 'Original Nikah Nama with English translation',
  category: 'CIVIL',
  roles: ['BENEFICIARY'],
  stages: ['USCIS', 'NVC', 'INTERVIEW'],
  required: true,
  validityType: 'none', // Ye expire nahi hoti
  wizardSteps: [
    {
      stepNumber: 1,
      title: 'Locate Original Nikah Nama',
      description: 'Original document dhundo...',
      tips: ['Must be signed by Nikah Registrar', ...]
    },
    {
      stepNumber: 2,
      title: 'Get Certified Translation',
      description: 'English translation karwao...',
      estimatedTime: '2-3 days',
      cost: 'PKR 2,000-5,000'
    }
  ]
}
```

#### `personalization-engine.ts` - Rules Engine
Ye decide karta hai ke kis user ko konsi documents chahiye:

```typescript
function isDocumentRequired(doc, visaCategory, scenarioFlags) {
  // Check visa category
  if (doc.requiredWhen.visaCategories) {
    if (!doc.requiredWhen.visaCategories.includes(visaCategory)) {
      return false; // Is visa type ke liye nahi chahiye
    }
  }

  // Check scenario flags
  if (doc.requiredWhen.scenarioFlags) {
    // Agar pehle marriage hui thi toh divorce papers chahiye
    if (doc.key === 'DIVORCE_DECREE') {
      return scenarioFlags.prior_marriage_beneficiary === true;
    }
  }

  return true;
}
```

#### `file-utils.ts` - File Naming aur Validation
```typescript
function generateStandardizedFilename(params) {
  // CASE_ID_ROLE_NAME_DOCTYPE_DATE_VERSION.ext
  const parts = [
    params.caseId,
    params.role,
    sanitizeName(params.personName),
    params.docKey,
    formatDate(params.date),
    `v${params.version}`
  ];

  return parts.join('_') + '.' + params.originalExtension;
}

function isValidFileType(filename, mimeType) {
  const allowed = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
  const ext = getExtension(filename);

  if (!allowed.includes(ext)) {
    return { valid: false, message: 'File type not supported' };
  }

  return { valid: true };
}
```

#### `storage-database.ts` - Database Operations (SERVER-SIDE)
Supabase database ke saath interaction:

```typescript
class DocumentDatabaseStorage {
  // Document save karna database mein
  async saveDocument(document: UploadedDocument) {
    const result = await supabase
      .from('documents')
      .upsert({
        id: document.id,
        user_id: document.userId,
        document_def_id: document.documentDefId,
        original_filename: document.originalFilename,
        standardized_filename: document.standardizedFilename,
        // ... aur sab fields
      });

    return result;
  }

  // User ki saari documents lana
  async getAllDocuments(userId: string) {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    return data;
  }

  // Document delete karna
  async deleteDocument(documentId: string, userId: string) {
    await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);
  }

  // Config save karna
  async saveVaultConfig(config: DocumentVaultConfig) {
    await supabase
      .from('document_vault_config')
      .upsert({
        user_id: config.userId,
        visa_category: config.visaCategory,
        scenario_flags: config.scenarioFlags,
        // ... baqi fields
      });
  }
}
```

#### `storage-server.ts` - File System Storage
Files ko actually hard disk pe save karna:

```typescript
class DocumentFileManager {
  // File save karna
  async saveFile(buffer, userId, documentId, filename) {
    // Path: uploads/document-vault/{userId}/{documentId}/{filename}
    const dir = path.join('uploads', 'document-vault', userId, documentId);

    // Directory banao agar nahi hai
    await fs.mkdir(dir, { recursive: true });

    // File write karo
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, buffer);

    return { success: true, storagePath: filePath };
  }

  // File read karna (download ke liye)
  async getFile(userId, documentId, filename) {
    const filePath = path.join('uploads', 'document-vault', userId, documentId, filename);
    const buffer = await fs.readFile(filePath);
    return buffer;
  }

  // File delete karna
  async deleteFile(userId, documentId) {
    const dir = path.join('uploads', 'document-vault', userId, documentId);
    await fs.rm(dir, { recursive: true });
  }
}
```

#### `expiration-tracker.ts` - Expiry Tracking
```typescript
function calculateExpirationDate(documentDef, uploadDate) {
  if (documentDef.validityType === 'fixed_days') {
    // Fixed validity period
    const expiryDate = new Date(uploadDate);
    expiryDate.setDate(expiryDate.getDate() + documentDef.validityDays);
    return expiryDate;
  }

  if (documentDef.validityType === 'user_set') {
    // User manually set karega
    return null;
  }

  return null; // Document expire nahi hoti
}

function updateDocumentStatuses(documents, documentDefs) {
  return documents.map(doc => {
    if (doc.expirationDate) {
      const now = new Date();
      const daysUntilExpiry = daysBetween(now, doc.expirationDate);

      if (daysUntilExpiry < 0) {
        return { ...doc, status: 'EXPIRED', isExpired: true };
      } else if (daysUntilExpiry <= 30) {
        return { ...doc, status: 'NEEDS_ATTENTION' };
      }
    }

    return { ...doc, status: 'UPLOADED' };
  });
}
```

#### `store.ts` - Zustand State Management (CLIENT-SIDE)
Frontend state management:

```typescript
const useDocumentVaultStore = create((set, get) => ({
  config: null,
  uploadedDocuments: [],
  requiredDocuments: [],

  // Initialize karna - pehli baar load pe
  initialize: async (userId) => {
    // Config load karo API se
    const configResponse = await fetch('/api/documents/config');
    const config = await configResponse.json();

    // Documents load karo API se
    const docsResponse = await fetch('/api/documents/list');
    const documents = await docsResponse.json();

    // Required documents calculate karo
    const requiredDocs = generateRequiredDocuments(config);

    set({ config, uploadedDocuments: documents, requiredDocuments: requiredDocs });
  },

  // Stats calculate karna
  getStats: () => {
    const { uploadedDocuments, requiredDocuments } = get();

    const total = requiredDocuments.length;
    const uploaded = uploadedDocuments.filter(d => d.status === 'UPLOADED').length;
    const missing = total - uploaded;
    const expiring = uploadedDocuments.filter(d => d.status === 'NEEDS_ATTENTION').length;

    return { total, uploaded, missing, expiring, percentComplete: (uploaded/total)*100 };
  }
}));
```

---

### 2. **API Routes** (`app/api/documents/`)

#### `upload/route.ts` - Document Upload API
**Ye API document upload karta hai**

```typescript
POST /api/documents/upload

// Step-by-step flow:
async function POST(request) {
  // 1. User authenticate karo
  const user = await supabase.auth.getUser();
  if (!user) return error('Unauthorized');

  // 2. Form data parse karo
  const formData = await request.formData();
  const file = formData.get('file');
  const documentDefId = formData.get('documentDefId');
  const role = formData.get('role'); // BENEFICIARY/PETITIONER
  const personName = formData.get('personName');

  // 3. File validate karo
  if (!isValidFileType(file.name, file.type)) {
    return error('Invalid file type');
  }
  if (!isValidFileSize(file.size, 10)) { // 10MB limit
    return error('File too large');
  }

  // 4. Document definition dhundo
  const documentDef = ALL_DOCUMENTS.find(d => d.id === documentDefId);

  // 5. Version number calculate karo
  const existingDocs = await db.getDocumentsByDefId(documentDefId, user.id);
  const version = existingDocs.length + 1;

  // 6. Standardized filename banao
  const filename = generateStandardizedFilename({
    caseId: 'IOE123456789',
    role: 'BENEFICIARY',
    personName: 'Ahmed Khan',
    docKey: 'NIKAH_NAMA',
    date: new Date(),
    version: 1,
    originalExtension: 'pdf'
  });
  // Result: IOE123456789_BENEFICIARY_AHMED_KHAN_NIKAH_NAMA_2025-12-23_v1.pdf

  // 7. File save karo filesystem pe
  const fileManager = new DocumentFileManager();
  const buffer = Buffer.from(await file.arrayBuffer());
  const saveResult = await fileManager.saveFile(buffer, user.id, documentId, filename);
  // File saved at: uploads/document-vault/{userId}/{documentId}/{filename}

  // 8. Expiration date calculate karo
  const expirationDate = calculateExpirationDate(documentDef, new Date());

  // 9. Document metadata banao
  const uploadedDocument = {
    id: generateDocumentId(),
    userId: user.id,
    documentDefId,
    originalFilename: file.name,
    standardizedFilename: filename,
    fileSize: file.size,
    mimeType: file.type,
    storagePath: saveResult.storagePath,
    uploadedAt: new Date(),
    uploadedBy: role,
    version,
    expirationDate,
    isExpired: false,
    status: 'UPLOADED',
  };

  // 10. Database mein save karo
  const db = new DocumentDatabaseStorage(supabase);
  await db.saveDocument(uploadedDocument);

  return success({ document: uploadedDocument });
}
```

#### `[id]/download/route.ts` - Document Download API
```typescript
GET /api/documents/{id}/download

async function GET(request, { params }) {
  // 1. User authenticate karo
  const user = await supabase.auth.getUser();

  // 2. Document metadata lao database se
  const db = new DocumentDatabaseStorage(supabase);
  const document = await db.getDocument(params.id, user.id);

  if (!document) return error('Document not found');

  // 3. File read karo filesystem se
  const fileManager = new DocumentFileManager();
  const buffer = await fileManager.getFile(
    document.userId,
    document.id,
    document.standardizedFilename
  );

  // 4. File download response bhejo
  return new Response(buffer, {
    headers: {
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.standardizedFilename}"`
    }
  });
}
```

#### `[id]/route.ts` - Delete aur Update
```typescript
// Delete document
DELETE /api/documents/{id}

async function DELETE(request, { params }) {
  const user = await supabase.auth.getUser();
  const db = new DocumentDatabaseStorage(supabase);
  const document = await db.getDocument(params.id, user.id);

  // File delete karo
  const fileManager = new DocumentFileManager();
  await fileManager.deleteFile(document.userId, document.id);

  // Database se delete karo
  await db.deleteDocument(params.id, user.id);

  return success({ message: 'Deleted' });
}

// Update document
PATCH /api/documents/{id}

async function PATCH(request, { params }) {
  const updates = await request.json();
  const db = new DocumentDatabaseStorage(supabase);

  await db.updateDocument(params.id, user.id, {
    expirationDate: updates.expirationDate,
    notes: updates.notes,
    status: updates.status
  });

  return success({ message: 'Updated' });
}
```

#### `export/route.ts` - Export All Documents as ZIP
```typescript
GET /api/documents/export

async function GET(request) {
  const user = await supabase.auth.getUser();
  const db = new DocumentDatabaseStorage(supabase);

  // 1. Saari documents lao
  const documents = await db.getAllDocuments(user.id);

  // 2. ZIP file banao
  const zip = new JSZip();

  // 3. Category-wise folders banao
  const byCategory = groupByCategory(documents);

  for (const [category, docs] of Object.entries(byCategory)) {
    const folder = zip.folder(getCategoryDisplayName(category));

    for (const doc of docs) {
      // File read karo
      const buffer = await fileManager.getFile(doc.userId, doc.id, doc.standardizedFilename);

      // ZIP mein add karo
      folder.file(doc.standardizedFilename, buffer);
    }
  }

  // 4. Metadata file add karo
  zip.file('metadata.json', JSON.stringify({
    exportDate: new Date(),
    totalDocuments: documents.length,
    documents: documents
  }));

  // 5. ZIP generate karo aur bhejo
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="document-vault-export.zip"'
    }
  });
}
```

#### `config/route.ts` - Configuration API
```typescript
// Get config
GET /api/documents/config

async function GET(request) {
  const user = await supabase.auth.getUser();
  const db = new DocumentDatabaseStorage(supabase);
  const config = await db.getVaultConfig(user.id);
  return json({ config });
}

// Save config
POST /api/documents/config

async function POST(request) {
  const user = await supabase.auth.getUser();
  const config = await request.json();

  const db = new DocumentDatabaseStorage(supabase);
  await db.saveVaultConfig({
    userId: user.id,
    visaCategory: config.visaCategory,
    scenarioFlags: config.scenarioFlags,
    caseId: config.caseId,
    petitionerName: config.petitionerName,
    beneficiaryName: config.beneficiaryName
  });

  return success({ message: 'Config saved' });
}
```

#### `list/route.ts` - List All Documents
```typescript
GET /api/documents/list

async function GET(request) {
  const user = await supabase.auth.getUser();
  const db = new DocumentDatabaseStorage(supabase);
  const documents = await db.getAllDocuments(user.id);
  return json({ documents });
}
```

---

### 3. **React Components** (`app/components/document-vault/`)

#### `ConfigurationWizard.tsx` - Initial Setup
**User pehli baar jab document vault kholta hai toh ye wizard dikhti hai**

```typescript
function ConfigurationWizard({ userId, onComplete }) {
  const [step, setStep] = useState(1);
  const [visaCategory, setVisaCategory] = useState('IR-1');
  const [scenarioFlags, setScenarioFlags] = useState({});

  const handleSubmit = async () => {
    // Config save karo
    const config = {
      userId,
      visaCategory,
      scenarioFlags,
      caseId: document.getElementById('caseId').value,
      petitionerName: document.getElementById('petitionerName').value,
      beneficiaryName: document.getElementById('beneficiaryName').value
    };

    await fetch('/api/documents/config', {
      method: 'POST',
      body: JSON.stringify(config)
    });

    onComplete();
  };

  return (
    <div>
      {step === 1 && (
        <div>
          <h2>Select Your Visa Category</h2>
          <select onChange={e => setVisaCategory(e.target.value)}>
            <option value="IR-1">IR-1: Spouse of U.S. Citizen</option>
            <option value="CR-1">CR-1: Conditional Resident Spouse</option>
            <option value="F1">F1: Unmarried Son/Daughter</option>
            {/* ... more options */}
          </select>
          <button onClick={() => setStep(2)}>Next</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Special Circumstances</h2>
          <label>
            <input type="checkbox"
              onChange={e => setScenarioFlags({
                ...scenarioFlags,
                prior_marriage_beneficiary: e.target.checked
              })} />
            Beneficiary ka pehle marriage hua tha?
          </label>
          {/* ... more flags */}
          <button onClick={handleSubmit}>Complete Setup</button>
        </div>
      )}
    </div>
  );
}
```

#### `DocumentCard.tsx` - Document Display Card
```typescript
function DocumentCard({ documentDef, uploadedDoc, onUpload, onDownload, onDelete }) {
  // Status color decide karo
  const getStatusColor = () => {
    if (!uploadedDoc) return 'gray'; // Missing
    if (uploadedDoc.status === 'EXPIRED') return 'red';
    if (uploadedDoc.status === 'NEEDS_ATTENTION') return 'yellow';
    return 'green'; // UPLOADED
  };

  // Expiry warning calculate karo
  const getExpiryWarning = () => {
    if (!uploadedDoc?.expirationDate) return null;

    const daysLeft = daysBetween(new Date(), uploadedDoc.expirationDate);

    if (daysLeft < 0) return '🔴 Expired';
    if (daysLeft <= 30) return `🟡 ${daysLeft} days left`;
    return '🟢 Valid';
  };

  return (
    <Card className={`border-${getStatusColor()}`}>
      <div>
        <h3>{documentDef.name}</h3>
        <p>{documentDef.description}</p>

        {uploadedDoc ? (
          <>
            <Badge>{uploadedDoc.status}</Badge>
            {getExpiryWarning() && <span>{getExpiryWarning()}</span>}
            <p>Uploaded: {formatDate(uploadedDoc.uploadedAt)}</p>
            <p>Version: {uploadedDoc.version}</p>

            <div>
              <Button onClick={onDownload}>Download</Button>
              <Button onClick={onUpload}>Re-upload</Button>
              <Button onClick={onDelete} variant="destructive">Delete</Button>
            </div>
          </>
        ) : (
          <>
            <Badge variant="destructive">Missing</Badge>
            <Button onClick={onUpload}>Upload Now</Button>
          </>
        )}
      </div>
    </Card>
  );
}
```

#### `DocumentUploadModal.tsx` - Upload Modal
```typescript
function DocumentUploadModal({ open, onClose, documentDef, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    setUploading(true);

    // Form data banao
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentDefId', documentDef.id);
    formData.append('role', 'BENEFICIARY');
    formData.append('personName', 'Ahmed Khan');
    formData.append('caseId', 'IOE123456789');

    // Upload karo
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      toast.success('Document uploaded successfully!');
      onUploadComplete();
      onClose();
    } else {
      toast.error(result.error);
    }

    setUploading(false);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2>Upload {documentDef.name}</h2>

      <input
        type="file"
        onChange={e => setFile(e.target.files[0])}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />

      {file && (
        <div>
          <p>File: {file.name}</p>
          <p>Size: {formatFileSize(file.size)}</p>
        </div>
      )}

      <Button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </Button>
    </Modal>
  );
}
```

#### `DocumentWizard.tsx` - Acquisition Guide
```typescript
function DocumentWizard({ open, onClose, documentDef }) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = documentDef.wizardSteps || [];

  return (
    <Modal open={open} onClose={onClose}>
      <h2>How to Get {documentDef.name}</h2>

      {steps.map((step, index) => (
        <div key={index} className={currentStep === index ? 'active' : 'hidden'}>
          <h3>Step {step.stepNumber}: {step.title}</h3>
          <p>{step.description}</p>

          {step.tips && (
            <div>
              <h4>Tips:</h4>
              <ul>
                {step.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}

          {step.resources && (
            <div>
              <h4>Resources:</h4>
              {step.resources.map((resource, i) => (
                <a key={i} href={resource.url} target="_blank">
                  {resource.name}
                </a>
              ))}
            </div>
          )}

          {step.estimatedTime && <p>Time: {step.estimatedTime}</p>}
          {step.cost && <p>Cost: {step.cost}</p>}
        </div>
      ))}

      <div>
        <Button onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 0}>
          Previous
        </Button>
        <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={currentStep === steps.length - 1}>
          Next
        </Button>
      </div>
    </Modal>
  );
}
```

---

### 4. **Main Page** (`app/(main)/document-vault/page.tsx`)

```typescript
function DocumentVaultPage() {
  const { user } = useAuth();
  const {
    config,
    uploadedDocuments,
    requiredDocuments,
    initialize,
    getStats,
    getNotifications
  } = useDocumentVaultStore();

  const stats = getStats(); // Total, uploaded, missing, etc.
  const notifications = getNotifications(); // Warnings

  useEffect(() => {
    // Initialize karo jab page load ho
    if (user) {
      initialize(user.id);
    }
  }, [user]);

  // Config nahi hai toh wizard dikhao
  if (!config) {
    return <ConfigurationWizard userId={user.id} />;
  }

  // Documents by category organize karo
  const documentsByCategory = getDocumentsByCategory(config);

  return (
    <div>
      {/* Header */}
      <h1>Document Vault</h1>
      <p>Managing documents for {config.visaCategory}</p>

      {/* Stats Dashboard */}
      <div className="stats-grid">
        <StatCard icon={FileText} label="Total" value={stats.total} />
        <StatCard icon={CheckCircle} label="Uploaded" value={stats.uploaded} color="green" />
        <StatCard icon={AlertCircle} label="Missing" value={stats.missing} color="red" />
        <StatCard icon={Clock} label="Expiring" value={stats.expiring} color="yellow" />
      </div>

      {/* Progress Bar */}
      <ProgressBar value={stats.percentComplete} />

      {/* Notifications */}
      {notifications.length > 0 && (
        <NotificationPanel notifications={notifications} />
      )}

      {/* Documents by Category */}
      {Object.entries(documentsByCategory).map(([category, docs]) => (
        <div key={category}>
          <h2>{getCategoryDisplayName(category)}</h2>

          <div className="document-grid">
            {docs.map(doc => {
              const uploadedDoc = uploadedDocuments.find(ud => ud.documentDefId === doc.id);

              return (
                <DocumentCard
                  key={doc.id}
                  documentDef={doc}
                  uploadedDoc={uploadedDoc}
                  onUpload={() => openUploadModal(doc.id)}
                  onDownload={() => handleDownload(uploadedDoc.id)}
                  onDelete={() => handleDelete(uploadedDoc.id)}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Export Button */}
      <Button onClick={handleExport}>
        <Download /> Export All Documents
      </Button>
    </div>
  );
}
```

---

## Complete User Flow (User experience kaise hai?)

### Flow 1: Initial Setup
```
1. User login karta hai
2. Document Vault page pe jata hai (/document-vault)
3. Pehli baar toh ConfigurationWizard dikhta hai
4. User apni visa category select karta hai (e.g., IR-1)
5. User special circumstances select karta hai:
   - Pehle marriage hui thi? ✓
   - Joint sponsor hai? ✗
   - Criminal history? ✗
6. User case details fill karta hai:
   - Case ID: IOE123456789
   - Petitioner Name: John Smith
   - Beneficiary Name: Ahmed Khan
7. "Complete Setup" button click
8. Config save hota hai database mein
9. Personalization engine required documents calculate karta hai
10. Dashboard load hota hai with personalized checklist
```

### Flow 2: Document Upload
```
1. Dashboard pe user ko missing documents dikhtihain (red cards)
2. User "Birth Certificate" card pe click karta hai
3. "Upload" button click
4. DocumentUploadModal khulta hai
5. User file select karta hai (birth_cert.pdf)
6. File validate hoti hai:
   - Type check: PDF ✓
   - Size check: 2.5MB < 10MB ✓
7. User additional details fill karta hai:
   - Role: BENEFICIARY
   - Person Name: Ahmed Khan
   - Notes: "NADRA se mila"
8. "Upload" button click
9. Frontend formData banata hai aur API call karta hai
10. Backend:
    - File validate hoti hai
    - Standardized filename banati hai:
      IOE123456789_BENEFICIARY_AHMED_KHAN_BIRTH_CERT_2025-12-23_v1.pdf
    - File save hoti hai filesystem pe:
      uploads/document-vault/abc-123/doc-xyz-789/IOE123456789_...
    - Metadata save hota hai database mein
11. Frontend:
    - Toast notification: "Document uploaded successfully!"
    - Document card green ho jata hai
    - Stats update ho jate hain: Total: 25, Uploaded: 1, Missing: 24
```

### Flow 3: Document Expiry Tracking
```
1. Background mein har minute expiration checker chalta hai
2. Police Certificate ke liye:
   - Uploaded: 2024-06-01
   - Validity: 365 days (1 year)
   - Expiration: 2025-06-01
   - Today: 2025-05-15
   - Days left: 17 days
3. Status update hota hai: UPLOADED → NEEDS_ATTENTION
4. Card color yellow ho jata hai
5. Notification dikhta hai: "⚠️ Police Certificate will expire in 17 days"
6. User ko reminder milta hai ke nayi certificate chahiye
```

### Flow 4: Document Download
```
1. User uploaded document card pe "Download" button click karta hai
2. Frontend API call karta hai: GET /api/documents/{id}/download
3. Backend:
   - Document metadata fetch karta hai database se
   - File read karta hai filesystem se
   - Response mein file send karta hai
4. Browser automatically download start karta hai
5. File download hoti hai standardized name ke saath:
   IOE123456789_BENEFICIARY_AHMED_KHAN_NIKAH_NAMA_2025-12-23_v1.pdf
```

### Flow 5: Export All Documents
```
1. User "Export All" button click karta hai
2. Frontend API call karta hai: GET /api/documents/export
3. Backend:
   - Saari documents fetch karta hai database se
   - ZIP file banata hai
   - Category-wise folders banata hai:
     - 01_Civil_Documents/
       - IOE123456789_BENEFICIARY_AHMED_KHAN_BIRTH_CERT_2025-12-23_v1.pdf
       - IOE123456789_BENEFICIARY_AHMED_KHAN_NIKAH_NAMA_2025-12-23_v1.pdf
     - 02_Financial_Documents/
       - IOE123456789_PETITIONER_JOHN_SMITH_I864_AFFIDAVIT_2025-12-20_v1.pdf
     - metadata.json
   - ZIP send karta hai
4. Browser ZIP download karta hai: document-vault-export-2025-12-23.zip
5. User apne computer pe saari documents organized mil jati hain
```

---

## Key Features Explained (Important features detail mein)

### 1. Personalization Engine (Kaun si documents chahiye?)

**Problem:** Har visa type ke liye alag documents chahiye. Plus special cases mein extra documents bhi chahiye.

**Solution:**
```typescript
// User ka config
const config = {
  visaCategory: 'IR-1', // Spouse visa
  scenarioFlags: {
    prior_marriage_beneficiary: true, // Pehle marriage hui thi
    joint_sponsor_used: false
  }
};

// Engine decide karega:
generateRequiredDocuments(config);

// Result:
[
  Birth Certificate (always required for IR-1),
  Nikah Nama (required for IR-1),
  Passport Copy (always required),
  CNIC (always required),
  Divorce Decree (✓ because prior_marriage_beneficiary = true),
  Police Certificate (always required),
  Medical Exam (always required),
  Wedding Photos (required for IR-1),
  I-864 Affidavit (always required),
  Tax Returns (always required),
  // ... total 20-25 documents depending on case
]
```

### 2. Automatic File Naming (File ka naam kaise banta hai?)

**Problem:** Users different names dete hain files ko. Organization mushkil ho jati hai.

**Solution:** Standardized naming convention
```
Format:
{CASE_ID}_{ROLE}_{PERSON_NAME}_{DOCUMENT_KEY}_{DATE}_{VERSION}.{extension}

Examples:
IOE123456789_BENEFICIARY_AHMED_KHAN_BIRTH_CERT_2025-12-23_v1.pdf
IOE123456789_BENEFICIARY_AHMED_KHAN_NIKAH_NAMA_2025-12-23_v1.pdf
IOE123456789_PETITIONER_JOHN_SMITH_I864_AFFIDAVIT_2025-12-20_v1.pdf
IOE123456789_PETITIONER_JOHN_SMITH_TAX_RETURNS_2025-12-20_v2.pdf (updated version)

Benefits:
✓ Alphabetically sorted by case ID
✓ Easy to find documents
✓ Version tracking automatic
✓ Professional looking
✓ NVC submission ke liye ready
```

### 3. Expiration Logic (Kab expire hoti hain documents?)

**4 types of validity:**

**Type 1: None (Kabhi expire nahi hoti)**
```typescript
Birth Certificate, Nikah Nama, Divorce Decree
validityType: 'none'
expirationDate: null
```

**Type 2: Fixed Days (Fixed period validity)**
```typescript
Police Certificate:
  validityType: 'fixed_days'
  validityDays: 365

  Upload: 2024-06-01
  Expiry: 2025-06-01 (1 year later)

  Status timeline:
  - Day 1-335: UPLOADED (green)
  - Day 336-365: NEEDS_ATTENTION (yellow, 30 days warning)
  - Day 366+: EXPIRED (red)
```

**Type 3: User Set (User khud set karega)**
```typescript
CNIC:
  validityType: 'user_set'

  User apni CNIC ki expiry date enter karega manually
```

**Type 4: Policy Variable (Case-specific)**
```typescript
I-864 Affidavit:
  validityType: 'policy_variable'

  Depends on when NVC processes it
  User optional date enter kar sakta hai
```

### 4. Version Tracking (Multiple uploads)

**Scenario:** User ne pehle purani birth certificate upload ki, phir nayi upload ki.

```typescript
First upload:
  version: 1
  filename: IOE123456789_BENEFICIARY_AHMED_KHAN_BIRTH_CERT_2025-06-01_v1.pdf

Second upload (re-upload):
  version: 2
  filename: IOE123456789_BENEFICIARY_AHMED_KHAN_BIRTH_CERT_2025-12-23_v2.pdf

Database mein dono versions stored hain
Latest version hi dashboard pe dikhta hai
But purane versions bhi accessible hain
```

### 5. Document Acquisition Wizard

**Problem:** Users ko nahi pata ke document kahan se mile gi, kaise apply karein.

**Solution:** Step-by-step guide har document ke liye

**Example: Police Certificate Wizard**
```typescript
Step 1: Apply at Local Police Station
  Description: Visit your local police station or apply through NADRA...

  Resources:
    - NADRA Police Verification (link)

  Tips:
    - Bring original CNIC
    - May require fingerprinting
    - Valid for 1 year from issue date

  Estimated Time: 2-4 weeks
  Cost: PKR 500-1,500

Step 2: Get English Translation
  Description: If certificate is in Urdu, get certified translation...

  Estimated Time: 2-3 days
  Cost: PKR 1,500-3,000
```

### 6. Smart Notifications

**Types of notifications:**

```typescript
1. Missing Documents
   "⚠️ Birth Certificate is required but not yet uploaded."

2. Expiring Soon (30 days)
   "⚠️ Police Certificate will expire in 17 days."

3. Expired
   "🔴 Medical Examination has expired."

4. Multiple Uploads Detected
   "ℹ️ You have uploaded 2 versions of Birth Certificate."
```

**Notification generation:**
```typescript
function generateNotifications(uploadedDocs, requiredDocs) {
  const notifications = [];

  // Check missing documents
  requiredDocs.forEach(reqDoc => {
    const uploaded = uploadedDocs.find(ud => ud.documentDefId === reqDoc.id);
    if (!uploaded) {
      notifications.push({
        type: 'DOC_MISSING',
        severity: 'warning',
        message: `${reqDoc.name} is required but not yet uploaded.`
      });
    }
  });

  // Check expiring documents
  uploadedDocs.forEach(doc => {
    if (doc.expirationDate) {
      const daysLeft = daysBetween(new Date(), doc.expirationDate);

      if (daysLeft < 0) {
        notifications.push({
          type: 'DOC_EXPIRED',
          severity: 'error',
          message: `${doc.name} has expired.`
        });
      } else if (daysLeft <= 30) {
        notifications.push({
          type: 'DOC_EXPIRING_SOON',
          severity: 'warning',
          message: `${doc.name} will expire in ${daysLeft} days.`
        });
      }
    }
  });

  return notifications;
}
```

---

## Database Security (RLS Policies)

**Row Level Security (RLS):** Har user sirf apni documents dekh sakta hai

```sql
-- Config policies
CREATE POLICY "Users can view their own config"
  ON document_vault_config FOR SELECT
  USING (auth.uid() = user_id);

-- Matlab:
-- User 'abc-123' sirf apna config dekh sakta hai
-- User 'xyz-456' uska config nahi dekh sakta

-- Documents policies
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

-- Matlab:
-- Ahmed Khan sirf apni documents dekh sakta hai
-- Ali Khan uski documents nahi dekh sakta
```

**Indexes for Performance:**
```sql
-- Fast queries ke liye indexes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_document_def_id ON documents(document_def_id);
CREATE INDEX idx_documents_status ON documents(status);

-- Faida:
-- Agar database mein 100,000 documents hain
-- User ki documents dhundne mein milliseconds lagenge
-- Without index: seconds lag jate
```

---

## File Storage Architecture

**Local Filesystem Storage:**
```
uploads/
└── document-vault/
    ├── user-abc-123/
    │   ├── doc-xyz-789/
    │   │   └── IOE123456789_BENEFICIARY_AHMED_KHAN_BIRTH_CERT_2025-12-23_v1.pdf
    │   ├── doc-xyz-790/
    │   │   └── IOE123456789_BENEFICIARY_AHMED_KHAN_NIKAH_NAMA_2025-12-23_v1.pdf
    │   └── doc-xyz-791/
    │       └── IOE123456789_PETITIONER_JOHN_SMITH_I864_AFFIDAVIT_2025-12-20_v1.pdf
    └── user-def-456/
        ├── doc-abc-100/
        │   └── ...
        └── doc-abc-101/
            └── ...
```

**Why this structure?**
- **Isolation:** Har user ki files alag directory mein
- **Organization:** Har document ki apni directory
- **Scalability:** Easily migrate kar sakte hain cloud storage pe later
- **Security:** User sirf apni directory access kar sakta hai

---

## Summary (Kya seekha?)

### Document Vault kya karta hai?
1. ✓ User ki visa category ke mutabiq documents list banata hai
2. ✓ Documents upload, download, delete kar sakte ho
3. ✓ Automatic standardized filename banata hai
4. ✓ Expiry dates track karta hai aur notifications deta hai
5. ✓ Step-by-step guide deta hai ke document kaise milegi
6. ✓ Progress tracking dashboard hai
7. ✓ Export kar sakte ho ZIP file mein

### Kahan kya store hota hai?
1. **Database (Supabase):**
   - `document_vault_config`: User ki configuration
   - `documents`: Document metadata (filename, size, expiry date, etc.)

2. **Filesystem (Local):**
   - Actual files: `uploads/document-vault/{userId}/{documentId}/{filename}`

### Code kahan likha hai?
1. **Backend (API Routes):** `app/api/documents/`
   - `upload/route.ts`: Upload document
   - `[id]/download/route.ts`: Download document
   - `[id]/route.ts`: Delete/Update document
   - `export/route.ts`: Export all as ZIP
   - `config/route.ts`: Save/Get configuration
   - `list/route.ts`: List all documents

2. **Frontend (React Components):** `app/components/document-vault/`
   - `ConfigurationWizard.tsx`: Initial setup
   - `DocumentCard.tsx`: Document display
   - `DocumentUploadModal.tsx`: Upload interface
   - `DocumentWizard.tsx`: Acquisition guide

3. **Business Logic:** `lib/document-vault/`
   - `types.ts`: Type definitions
   - `document-definitions.ts`: 30+ document configs
   - `personalization-engine.ts`: Required docs calculator
   - `file-utils.ts`: File naming & validation
   - `storage-database.ts`: Database operations
   - `storage-server.ts`: Filesystem operations
   - `expiration-tracker.ts`: Expiry logic
   - `store.ts`: State management (Zustand)

4. **Main Page:** `app/(main)/document-vault/page.tsx`

### Feature kaise kaam karta hai?
```
User Login
  ↓
Configuration Wizard (visa category + special cases select)
  ↓
Config Save (database + localStorage)
  ↓
Required Documents Calculate (personalization engine)
  ↓
Dashboard Load (stats, notifications, document cards)
  ↓
Document Upload (file → validate → save filesystem → save database)
  ↓
Status Tracking (background checker updates expiry statuses)
  ↓
Export All (ZIP with category folders)
```

---

## Future Improvements (Aage kya ho sakta hai?)

1. **Cloud Storage:** Files ko Supabase Storage ya AWS S3 pe shift karna
2. **OCR Integration:** Document content automatically verify karna
3. **Email/SMS Reminders:** Expiry notifications email/SMS pe bhejna
4. **Collaboration:** Attorney ya family members ko access dena
5. **Document Templates:** Pre-filled forms generate karna
6. **Mobile App:** React Native app banana
7. **AI Assistant:** Document requirements explain karne ke liye chatbot

---

**Yaad rakho:**
- Ye feature **Pakistan se U.S. visa applicants** ke liye hai
- Documents **automatically organized** rehti hain
- **Expiry tracking** automatic hai
- **Step-by-step guides** hain har document ke liye
- **Database** mein metadata, **filesystem** pe actual files
- **RLS policies** se security hai
- **Export** kar sakte ho sab kuch ek ZIP mein

**Agar koi confusion hai toh ye file dobara parh lo!** 🚀
