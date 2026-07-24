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
| **Risk** | Koi red flag hai? (short marriage, age gap, etc.) — ye score **minus** karta hai | **10%** |

**Formula:** `Score = Evidence×0.40 + Consistency×0.30 + Completeness×0.20 + Risk×0.10`

**Bands (score ka level):**
- **Weak** = 40 se kam (red-ish)
- **Moderate** = 40 se 70 (yellow)
- **Strong** = 70 se upar (green)

**Sabse important rule:** Jab tak user **asli evidence** (document upload ya evidence sawaal ka jawab) na de, ring koi number nahi dikhati — sirf **"Not started"** dikhati hai. Ye demo ka sabse bada point hai.

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

---

### ✅ TEST 3 — Pehla document upload karo

**Kya karo:** Step 1.2 (Documents) mein jao. "Birth Certificate" pe koi PDF upload karo. Wapas dashboard.

**Kya dikhna chahiye:**
- Ab ring **number dikhana shuru** karti hai (approx **35–40%**).
- Label calm hota hai — jaise **"Building your case"** (RED nahi).
- Evidence sub-score: **1 of 6** jaisa kuch.

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
