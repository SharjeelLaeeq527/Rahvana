# Case Strength — Demo Guide (Roman English)

**Kal boss ko frontend se demo dene ke liye. Simple language. Sirf clicking + dekhna.**

---

## Pehle ye samajh lo — "Analysis" hoti kaise hai?

Score (0 se 100 tak "Case Health" ring) **4 cheezon** se banta hai. Yaad rakho:

| Ingredient | Matlab (simple) | Weight |
|---|---|---|
| **Evidence** | Kitne asli documents upload kiye | **40%** |
| **Consistency** | Aapke jawab aur documents aapas mein match karte hain? | **30%** |
| **Completeness** | Kitne forms / sawaal complete kiye | **20%** |
| **Risk** | Koi red flag hai? (short marriage, etc.) — ye score **minus** karta hai | **10%** |

**Formula:** `Score = Evidence×0.40 + Consistency×0.30 + Completeness×0.20 + Risk×0.10`

**Bands (score ka level):**
- **Weak** = 40 se kam (red-ish)
- **Moderate** = 40 se 70 (yellow)
- **Strong** = 70 se upar (green)

**Sabse important rule:** Jab tak user **asli evidence** (document upload ya evidence sawaal ka jawab) na de, ring koi number nahi dikhati — sirf **"Not started"** dikhati hai. Ye demo ka sabse bada point hai.

---

## Risk Flag ko detail mein samajho (example ke saath)

### Risk flag hai kya?
Risk flag = ek **red flag / warning** jo aapke **eligibility jawab** se banti hai. Ye score ke **"Risk" wale 10% hisse** ko kam karti hai. Matlab: jitne zyada red flags, utna Risk score neeche, utna overall score halka sa neeche.

### Kaise kam karti hai (penalty math)
Risk ingredient **100 se shuru** hota hai, phir minus hota hai:
- **Critical** flag (bada masla): **−20**
- **Warning** flag (chhota masla): **−8**
- **Info** flag: **−3**

Risk score = `100 − (total minus)`. Phir overall mein `Risk × 10%`.

### IR-5 ke asli risk flags (yehi system mein hain)
**Critical (bade — disclose karna zaroori):**
- Parent ka **court / police / criminal record** ← aap "crome/blocked" wali baat kar rahe the, ye wahi hai
- Parent ka **past immigration ya fraud issue**
- Parent ka **U.S. overstay** (unlawful presence)

**Warning (chhote — plan karna hai):**
- **Income kam** ho sakti hai (sponsorship)
- **Medical / vaccination** issue
- **U.S. domicile** pe dhyan chahiye

### Proper example (numbers ke saath)

**Pehle — koi risk flag nahi:**
Maan lo user ne 3 document upload kiye + forms bhare:
```
Evidence = 60, Consistency = 100, Completeness = 70, Risk flag = 0 → Risk = 100

Score = 60×0.40 + 100×0.30 + 70×0.20 + 100×0.10
      = 24 + 30 + 14 + 10 = 78  → "Strong" (green)
```

**Ab — Step 1 mein user select karta hai: "Parent ka court/police record hai"**
Ye ek **critical** risk flag ban gaya (`parent_criminal_history`).
```
Risk = 100 − 20 = 80  →  overall mein 80×0.10 = 8  (pehle 10 tha)

Naya Score = 24 + 30 + 14 + 8 = 76   (sirf 2 point kam)

LEKIN health label badal jaata hai → "Needs Immediate Attention" (RED)
```

### Ye 2 cheezein demonstrate karta hai (boss ko yehi batao):
1. **Number pe halka asar:** Risk sirf 10% weight hai, isliye score thoda hi neeche jaata hai (78 → 76). Matlab red flag case ko **khatam nahi** karta.
2. **Label pe bada asar:** Kyunki ye **critical** flag hai, health status **red "Needs Immediate Attention"** ho jaata hai — chahe number 76 ho. Kyun? Kyunki ye cheez **disclose karna zaroori** hai, warna aage ja kar case reject ho sakta hai. System user ko warn karta hai.

### Kab hota hai / kab dikhta hai (zaroori nuance)
- Risk flag Step 1 mein jawab dete hi **background mein calculate** ho jaata hai.
- **Lekin** jab tak koi **document upload (evidence)** na ho, ring/score dikhti hi nahi — to risk ka asar bhi **tab** dikhega jab evidence aayegi aur score active hoga.
- Us se pehle flag sirf **store** rehta hai, ring pe nahi dikhta.

> Ek line: **Eligibility jawab → risk flag banta hai (background) → document upload → score active → tab risk flag score/label mein dikhta hai.**

---

## Alerts — kaunse, kab, aur kis time aate hain

### Sabse pehle: Alerts kab SHURU hote hain?
Jab tak aap **kam se kam 1 step complete** na karo, koi alert nahi aata — Alert Center pe **"No alerts yet"** dikhta hai. Ye jaan-boojh kar hai, taake shuru mein 10 fake alerts se user overwhelm na ho.

### Kaunse alerts dikhte hain (Progressive disclosure)
- **Aapke current step + peeche guzre steps** ke alerts dikhte hain.
- **Aage wale (future) steps** ke alerts **chhupe** rehte hain — taake jo abhi karna hi nahi, uska tension na ho.
- **Exception:** kuch cheezein jo waqt leti hain (jaise joint sponsor, police certificate) **1 chapter pehle** "Plan ahead" ke tor pe dikh jaati hain, taake user time se arrange kar le.

### 5 tarah ke alerts

| Alert | Kab aata hai | Rang / level |
|---|---|---|
| **Missing Document** | Zaroori document abhi tak nahi diya | Info → Yellow → Red (3 stage, neeche dekho) |
| **Consistency** | Jawab aur document match na karein (jaise date mismatch) | Warning / Critical |
| **Risk flag** | Eligibility mein red flag jawab (criminal, overstay, income kam) | Warning / Critical |
| **Score-drop (Band-drop)** | Score neeche ek band cross kare | Yellow warning |
| **(Past-step deficiency)** | Guzre step ka koi kaam adhoora chhoot gaya | Warning → Critical over time |

---

### 1) Missing Document alert — 3 stage timing

Missing document **ek dam RED nahi** hota. Dheere dheere serious hota hai. Do tarike:

**A. Agar filing date pata ho (deadline ke hisaab se — ye preferred hai):**
- Filing mein **30+ din** baaki → **"To gather"** (info, calm — gray)
- Filing mein **30 din ya kam** → **"Due soon"** (yellow warning)
- Filing mein **7 din ya kam** → **"Critical"** (red, blocking)

**B. Agar filing date na ho (din ke hisaab se fallback):**
- **0–7 din** → "To gather" (info)
- **7–21 din** → "Due soon" (yellow)
- **21+ din** → "Critical" (red)

### 2) Grace periods (turant nahi, thoda ruk kar)
- **Current step** ka warning: **3 din** ke baad dikhta hai (turant nahi — taake abhi-abhi pohanche user ko na daraye).
- **Guzre step** ka adhoora kaam: **7 din** baad warning banta hai, aur **21 din** baad **critical** ho jaata hai.
- **Recurring reminder:** har **14 din** mein yaad-dahani, **max 3 baar** (spam nahi).

### 3) Consistency alert — kab
Jab aapka **jawab aur uploaded document contradict** karein — jaise aap ne bola "shaadi 2020", certificate 2019 ka upload kiya. Ye **turant** dikhta hai jab woh document/jawab add karo.

### 4) Risk flag alert — kab
Jab eligibility mein aisa jawab do jo red flag banaye (criminal record, overstay, income kam). *Note:* ring/score sirf tab active hota hai jab evidence ho — detail upar **"Risk Flag"** section mein hai.

### 5) Score-drop (Band-drop) alert — kab
- Sirf jab score **neeche** ek band cross kare (Strong→Moderate, ya Moderate→Weak).
- **Upar** jaane pe **chup** rehta hai (koi alert nahi, bas purana alert clear ho jaata hai).
- Same band ke andar chhoti upar-neeche → kuch nahi.
- Reopen/refresh pe dobara nahi nag karta — sirf **live** drop pe aata hai.

---

### 👉 Demo mein escalation kaise dikhao (tip)
Demo ek hi din mein hota hai, to "7 din / 21 din" wala time naturally nahi dikhega — document bas **"To gather"** pe rahega. Escalation live dikhane ka aasan tarika:
- Journey ki **filing date paas set kar do** (jaise 5 din baad) → missing docs turant **"Critical" (red)** ho jaayenge (deadline-relative rule).
- 20 din baad set karo → **"Due soon" (yellow)**.
- Isse aap boss ko teeno stage (info → yellow → red) live dikha sakte ho, bina time travel ke.

---

## Demo se pehle Setup (5 min)

1. Do nayi journeys banao:
   - Ek **IR-5** (Parent visa) — naam: "Test IR-5"
   - Ek **IR-1** (Spouse visa) — naam: "Test IR-1"
2. Dono mein **kuch mat karo** — koi step complete mat karo, koi document upload mat karo.
3. 2-3 documents apne paas ready rakho (PDF) — **abhi upload mat karo**, demo ke DAURAAN karna hai.
4. Browser refresh kar lo taake fresh state ho.

---

## IR-5 Demo — step by step

### ✅ TEST 1 — Fresh journey (bilkul khaali)

**Kya karo:** IR-5 dashboard kholo. Kuch mat karo.

**Kya dikhna chahiye:**
- Case Health ring pe number **nahi** — bas dashes **"— / 100"** aur **"Not started"**.
- Left side Alert Center: **"No alerts yet"**.
- Agar drawer (Improve/Analysis) kholo to: **"Analysis Not Started"**.
- **Koi** "Missing (6) — Parent's Passport..." wali list **nahi** aani chahiye.

**Ye kyun ho raha:** System ne abhi tak koi asli signal nahi dekha (na document, na evidence sawaal). Isliye jhoota score dikhana galat hoga.

**Faida:** User ko fake "40%" ya "50%" nahi dikhta. Pehle bug tha ke khaali journey pe bhi 40/100 aur missing documents dikh jaate the — ab fix ho gaya.

**Kab hota hai:** Jab tak `completed step + asli evidence` dono na hon.

> 👉 Boss ko bolo: "Dekhiye — khaali case pe hum jhoota number nahi dikhate. Pehle yahan 40 aa jaata tha, ab honest 'Not started' aata hai."

---

### ✅ TEST 2 — Sirf sawaal answer karo (document nahi)

**Kya karo:** Step 1.1 (Eligibility) kholo, kuch sawaal answer karo, par **document upload mat karo**. Wapas dashboard pe aao.

**Kya dikhna chahiye:** Ring abhi bhi **"Not started"** (ya bahut low) — kyunki **evidence** nahi aayi, sirf sawaal bhare.

**Ye kyun:** Score ka bada hissa (40%) EVIDENCE hai. Form bharna alag cheez hai, proof dena alag.

**Faida:** User samajhta hai ke sirf forms bharne se case strong nahi hota — asli documents chahiye.

**Kab:** Jab sawaal to bhare hon par koi document upload na hua ho.

> ⚠️ **Zaroori note (agar boss pooche):** Chahe Step 1 mein aap koi aisa jawab do
> jispe **"blocked"/risk** wala warning aaye (jaise criminal record) — tab bhi
> case strength score **START nahi hoga**, ring "Not started" hi rahegi. Kyunki
> eligibility jawab "evidence" nahi hai. Wo risk flag background mein ban jaata hai
> aur baad mein (document upload ke baad, jab score active ho) score/label ko
> affect karta hai. Detail upar **"Risk Flag"** section mein hai.

---

### ✅ TEST 3 — Pehla document upload karo

**Kya karo:** Step 1.2 (Documents) mein jao. "Birth Certificate" pe koi PDF upload karo. Wapas dashboard.

**Kya dikhna chahiye:**
- Ab ring **number dikhana shuru** karti hai (approx **35–40%**).
- Label calm hota hai — jaise **"Building your case"** (RED nahi).
- Evidence sub-score: **1 of 3** jaisa kuch (IR-5 ke current-stage required = 3 identity docs).

**Ye kyun:** Ab asli evidence aa gayi, to gate khul gaya aur real score dikhne laga.

**Faida:** Score turant asli progress dikhata hai. Language calm hai — dar nahi lagta.

**Kab:** Pehla asli document (ya evidence sawaal) aate hi.

> 👉 Boss ko bolo: "Jaise hi asli document aata hai, ring live update hoti hai."

---

### ✅ TEST 4 — 2-3 documents upload karo

**Kya karo:** 2-3 aur documents upload karo (Police, Medical, etc.). Wapas dashboard.

**Kya dikhna chahiye:**
- Ring upar jaata hai (approx **65–70%**), label **"Moderate"**.
- Jo documents abhi missing hain unpe **"To gather"** (info, calm) — **RED nahi**.

**Ye kyun (escalation samjhao):** Missing document ek dam RED nahi hota. 3 stage hote hain:
- **To gather** (abhi normal) → **Due soon** (yellow, filing paas aa rahi) → **Critical** (red, zaroori).

**Faida:** Din-1 pe 10 red alerts nahi aate (alarm fatigue nahi). Alert dheere dheere serious hota hai.

**Kab:** Missing document par time/deadline ke hisaab se stage badalta hai.

---

### ✅ TEST 5 — Saare forms + Q&A complete karo

**Kya karo:** Baaki eligibility + civil document sawaal complete karo.

**Kya dikhna chahiye:**
- Ring approx **75-80%**, label **"Strong"** (green).
- Consistency section: **"All clear"** (koi contradiction nahi).
- Breakdown mein charon ingredient dikhte hain (Evidence / Consistency / Completeness / Risk).

**Ye kyun:** Ab completeness bhi upar, consistency bhi 100% — is liye score strong.

**Faida:** User ko clear dikhta hai kaunsi cheez score badha rahi hai.

**Kab:** Jab documents + forms dono kaafi ho jaayein.

---

### ✅ TEST 6 — Band-drop alert (ye zaroor dikhana — powerful hai)

**Kya karo:** Strong hone ke baad, kisi eligibility sawaal ka jawab **badal do** (aisa jo contradiction bana de). Wapas dashboard.

**Kya dikhna chahiye:**
- Ring **neeche** girta hai.
- Upar **yellow alert**: *"Case strength dropped to Moderate"*.
- Us alert pe **"View breakdown"** button — click karo → **drawer khulta hai** breakdown ke saath.

**Ye kyun:** Jab score neeche girta hai (band cross karta hai neeche ki taraf), system chup nahi rehta — batata hai.

**Faida:** User ko turant pata chalta hai "mera score kyun gira" — ek click mein wajah.

**Kab:** Sirf jab score **neeche** ek band cross kare (upar jaane pe chup rehta hai — sirf clear ho jaata hai).

> ⚠️ Ye button IR-1 (V2) aur IR-5 (V3) dono pe test karo — aaj hi V2 pe fix kiya hai.

---

## IR-1 Demo (Spouse) — same system, alag data

IR-1 pe **wahi 6 tests** dobara karo. Sirf ye farq highlight karo:

- **Alag documents:** IR-1 mein Marriage Certificate, joint photos, co-residence lease. IR-5 mein Medical, Police, Birth Certificate.
- **Alag sawaal:** IR-1 relationship pe, IR-5 medical/security pe.
- **Same formula:** dono 40/30/20/10, same escalation, same band-drop alert.

> 👉 Boss ko bolo: "Ek hi engine, alag alag category. Nayi visa category add karna ab 1 din ka kaam hai, 3 hafte ka nahi."

**Sabse zaroori IR-1 check:** Page **crash na kare**. (Aaj ek crash "overallCaseScore before initialization" fix kiya hai — confirm karo ke IR-1 dashboard sahi khulta hai.)

---

## Extra edge cases (agar time ho)

1. **Autofill trap:** Sirf sawaal bharo, document 0 → ring **Not started** rehni chahiye (pehle yahan fake 50% aata tha).
2. **Consistency pakadti hai:** Sawaal mein bolo "shaadi 2020", certificate upload karo "2019" ka → **mismatch warning** aati hai, score girta hai.
3. **Risk flags:** Aise jawab do jo flag banayein (short marriage, bada age gap) → score pe **10% penalty**, flags list hoti hain.

---

## Aaj testing ki checklist (tick karte jao)

**Fresh (khaali) journey:**
- [ ] IR-5 fresh: ring "— / 100 · Not started" (number nahi)
- [ ] IR-5 fresh: drawer "Analysis Not Started" (koi Missing list nahi)
- [ ] IR-5 fresh: Alert Center "No alerts yet"
- [ ] IR-1 fresh: bilkul wahi behavior
- [ ] IR-1 dashboard **crash nahi** karta (khulta hai theek se)

**Document upload ke baad:**
- [ ] 1 document → ring number dikhati hai, drawer full analysis + missing list
- [ ] 2-3 documents → "To gather" (calm), red nahi
- [ ] Saare forms → "Strong" (green), consistency "All clear"

**Alert:**
- [ ] Jawab badlo → yellow "Case strength dropped" alert
- [ ] Alert ka "View breakdown" → drawer khulta hai (IR-5 **aur** IR-1 dono)

---

## Ek line mein boss ko pitch

> "Pehle system fake score deta tha, autofill ko proof samajhta tha, aur din-1 pe 10 red alerts. Ab: khaali case pe honest 'Not started', sirf asli documents count hote hain, alerts dheere dheere serious hote hain, score girne pe user ko turant pata chalta hai — aur yehi ek engine har visa category pe chalta hai."
