# Spouse Collaboration — Simple Flow (Non-Technical)

Ye feature kya karega, asaan lafzon mein: **mian aur biwi dono apne apne
account se login karke ek hi case (journey) par milke kaam kar sakenge.**
Jaise ek hi Google Doc do log khol ke saath edit karte hain.

---

## Ek line mein

> Owner plan kharidta hai → spouse ko email pe invite bhejta hai → spouse usi
> email se login karta hai → dono ek hi case par kaam karte hain, dono ko owner
> ka plan milta hai → owner decide karta hai kaun petitioner / kaun beneficiary.
> **Spouse ke liye koi extra paisa nahi.**

---

## Poora flow — step by step

### 1) Owner account banata hai aur plan leta hai
- Jaise abhi hota hai, koi tabdeeli nahi.
- Plan: Basic / Premium / Executive — inmein se koi bhi.

### 2) Owner ko nayi cheez nazar aayegi: "Invite your spouse"
- **Kahan:** Case ke dashboard / settings mein ek naya card —
  **"Invite Your Spouse / Apne Partner Ko Add Karein"**.
- Owner spouse ka **email** likhega aur "Send Invite" dabayega.
- **Free walon ko:** ye button locked dikhega, sath likha hoga "Upgrade to a
  paid plan to add your spouse."
- **Sirf ek partner** add ho sakta hai — ek baar bhejne ke baad button "Invite
  sent" mein badal jayega.

### 3) Spouse ko email milti hai
- Spouse ke inbox mein ek email aayegi: *"[Owner ka naam] has invited you to
  join their visa journey on Rahvana."*
- Email mein ek **button / link** hoga: **"Accept Invite"**.

### 4) Spouse link kholta hai aur join karta hai
- Link kholte hi ek simple page khulega: *"You've been invited to a shared
  case. Sign up to continue."*
- **Zaroori baat:** Spouse ko **usi email** se signup/login karna hoga jis pe
  invite aayi thi. Doosri email kaam nahi karegi (rok di jayegi).
- Signup hote hi spouse seedha **shared case** mein pohanch jayega.

### 5) Role decide karne ka step (sirf pehli baar)
- Jab dono log case mein aa jate hain, owner ko ek card dikhega:
  **"Set up roles — Aap mein kaun petitioner hai aur kaun beneficiary?"**
- Owner select karega:
  - "Main **petitioner** (USA wala sponsor) hoon" → spouse khud-ba-khud
    beneficiary ban jayega, ya
  - "Main **beneficiary** hoon" → spouse petitioner ban jayega.
- Ye ek dafa set hota hai. Iske baad ye card hat jayega.

### 6) Ab dono saath kaam karte hain
- Dono ko **same case** dikhega — same steps, same documents, same progress.
- Ek banda jo bhi update karega, doosre ko bhi nazar aayega (refresh par).
- Dono **edit** kar sakte hain — documents upload, steps complete, sab.

---

## Kis ko kya dikhega (Owner vs Spouse)

| Cheez | Owner | Spouse (invited) |
| --- | --- | --- |
| Login | Apna account | Apna alag account (invited email) |
| Plan/features | Jo plan kharida | **Wahi plan** (free milta hai, owner ka chalta hai) |
| Case / journey | Poora dikhta hai | **Wahi poora case** dikhta hai |
| Documents | Saare | Saare (shared) |
| Steps complete karna | Kar sakta hai | Kar sakta hai |
| Spouse ko invite/remove karna | **Sirf owner** | Nahi |
| Role set karna (kaun petitioner) | **Sirf owner** | Nahi (dekh sakta hai) |

---

## Role decide karna kyun zaroori hai? (Asaan misaal)

Maan lo dono apna passport upload karte hain. System ko kaise pata chale ke
kaunsa passport sponsor (petitioner) ka hai aur kaunsa beneficiary ka?

- Jab role set hota hai, system ko pata hota hai: *"Ye banda petitioner hai."*
- To uska passport **automatic sponsor ke khaane** mein chala jata hai, aur
  beneficiary ka uske khaane mein.
- Isi liye **OCR, autofill, aur case-strength check khud-ba-khud sahi bhar
  jate hain** — ghalti ka chance kam.

---

## Paisay ka mamla (sabse simple part)

- **Spouse ke liye koi alag payment nahi.**
- Owner ne jo plan liya, **dono** uske features istemal karte hain — dono apne
  apne account se.
- Owner agar plan upgrade karta hai (jaise Basic se Premium), to **dono** ko
  naye features mil jate hain.

---

## Kuch zaroori usool (taake ghalti na ho)

1. **Sirf ek spouse** add ho sakta hai (ek se zyada nahi).
2. Spouse **sirf invited email** se hi join karega — doosri email block.
3. Email ek baar set ho gayi to **change nahi** hoti.
4. **Owner hi** spouse ko add/remove aur role set karta hai.
5. Owner agar spouse ko remove kar de, to spouse ka apna account rehta hai,
   bas us case ka access chala jata hai.

---

> Technical tafseel (database, RLS, API) ke liye dekhein:
> `docs/partner-collaboration-spec.md`
