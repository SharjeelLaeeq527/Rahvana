# Architecture & Implementation Plan: Standalone Tools Credit-Based Pricing & Entitlement Engine

**Document Status**: APPROVED SPECIFICATION  
**Target System**: Multi-Candidate & Multi-Visa Category Platform (`IR-1`, `IR-5`, `IR-2`)  
**Scope**: Standalone Tool Pricing, Quantity Packs, Account-Level Credit Pool, and Candidate-Level Journey Entitlements  
**Author**: Engineering & Product Architecture Team  

---

## 1. Executive Summary & Strategic Context

With the rollout of the multi-candidate and multi-visa category architecture, a single petitioner account can manage multiple beneficiaries (e.g., Mother and Father under **IR-5**, multiple children under **IR-2**, or separate **IR-1** petitions). Each candidate operates in their own isolated journey context with dedicated roadmaps, vault documents, guides, and stage progress.

### The Pricing Dilemma
Candidates may hold different **Journey Plans** (`basic`, `premium`, `executive`), which already bundle specific tool entitlements. However, petitioners frequently require standalone access to high-value tools (such as the **221(g) Action Planner**, **Smart Form Filler**, **Mock Interview Prep**, **Sponsorship Calculator**, and **Photo Booth**) without necessarily upgrading the entire candidate roadmap.

### Option A: Account-Level Credit-Based System *(Recommended & Adopted)*
* **Mechanics**: Users purchase discrete **Credits** associated with specific tools (or tool bundles) deposited into an **Account-Level Wallet**. When an action is initiated for a candidate, the system checks whether the candidate already has journey-level entitlements. If not, it deducts 1 credit from the account pool and grants that candidate a persistent, revision-safe execution token.
* **Why This is Recommended**:
  1. **Maximum Flexibility**: A petitioner sponsoring Mother and Father can purchase a 4-Credit Smart Form Filler pack, using 2 forms for Mother (I-130 + DS-260) and 2 forms for Father (I-130 + DS-260).
  2. **Strict Cost & Margin Control**: Every AI generation, PDF rendering, or audio mock interview is strictly backed by paid units.
  3. **Multi-Pack & E-Commerce Scalability**: Enables volume discounts, quantity pickers ($199 for 3 credits $\times$ quantity 2 = 6 credits for $398), and promotional credit grants.
  4. **Clean Decoupling**: Separates financial transactions (Stripe checkout at account level) from workflow execution (scoped per candidate journey).

### Option B: Credit wallet system
in this system user has rahvana wallet, user buys credit for dollars and each tool will consume XX number for credits for the tools usage, the number of credit that are concumed for different tools will be different, eg: Smart Form Filler will consume 40 credits per form fill.

---
