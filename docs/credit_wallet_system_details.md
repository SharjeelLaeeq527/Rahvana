Rahvana — Credit-Based Wallet & Standalone Tools Implementation
Role
Act as a senior full-stack architect and engineer working on the existing Rahvana codebase.
Your task is to review the current architecture and implement the agreed direction from the latest pricing and credit-system meeting.
Important: Do not start coding immediately. First audit the current codebase, identify what already exists, prepare an implementation plan, and identify decisions that still need approval.
Do not rebuild working functionality unnecessarily.
1. Business Context
Rahvana currently supports immigration journeys such as IR-1 and IR-5, subscription tiers, and standalone tools.
Previously, purchasing an individual tool could unlock that tool both inside and outside a journey.
The new business direction separates two experiences:
Journey-integrated experience
Tools are available according to the user's purchased journey tier.
Eligible tools can access the active journey's relevant information.
Data and progress can be saved against the correct journey.
Existing subscription entitlements must remain functional.
Standalone experience
Tools are accessed outside the journey environment.
Tool usage is paid through an account-wide credit wallet.
Standalone tools must not automatically access journey-specific information.
Standalone usage must not automatically unlock journey-integrated functionality.
Existing journey data must remain isolated.
Standalone tools should not automatically save progress into journeys.
This separation is intentional and supports journey-tier upgrades.
2. Account-Wide Credit Wallet
Introduce or adapt a shared wallet belonging to the authenticated user.
Requirements:
One wallet per user account.
Credits can be used across eligible standalone tools.
Credits are not tied to a specific candidate or journey.
Multiple IR-1 and IR-5 journeys under the same account share the wallet.
Credit purchases increase the wallet balance.
Successful chargeable tool launches reduce the wallet balance.
Prevent negative balances.
Prevent unauthorized wallet modifications.
Preserve complete transaction history.
Before implementing, inspect existing wallet, payment, subscription, entitlement, and credit-related tables and functions.
Reuse existing infrastructure where appropriate.
Do not introduce duplicate wallet or entitlement systems.
3. Wallet Top-Ups
The user should be able to purchase credits without purchasing a specific standalone tool.
Expected experience:
User opens Wallet or Credits.
User selects a top-up amount.
User completes payment.
Payment is verified server-side.
Credits are added to the account wallet.
Updated balance becomes visible.
The meeting discussed fixed top-up amounts and a custom amount option.
Examples discussed:
$10
$15
$20
Custom amount
These are proposals, not necessarily final approved values.
Reuse the existing Stripe integration.
Ensure that credits are granted only after verified successful payment.
Use webhook idempotency so duplicate webhook deliveries cannot grant credits twice.
4. Standalone Tool Preview and Launch
Standalone tools should expose two distinct actions where applicable:
Preview
Allow users to explore the tool.
Do not deduct credits.
Do not expose paid functionality beyond the existing approved preview limitations.
Preserve existing preview behavior where practical.
Launch
Display the required credit amount.
Display the current wallet balance.
Ask for explicit confirmation before charging.
Example:
"This tool requires X credits. If you continue, X credits will be deducted from your wallet."
Actions:
Cancel
Proceed
If the user confirms:
Validate authentication.
Validate the tool's credit cost.
Check wallet balance.
Deduct credits securely.
Grant access to the corresponding chargeable usage.
Launch the tool.
If credits are insufficient:
Do not launch paid functionality.
Display the required and available credits.
Offer a wallet top-up path.
Agreed initial charging direction:
The meeting favored deduction when the user confirms a paid launch, rather than waiting for result generation.
However, inspect the current behavior of each tool and identify any tool-specific incompatibilities before implementation.
Do not silently invent a universal session lifetime or reuse policy.
5. Secure Credit Deduction
Implement credit deduction through a server-authoritative mechanism.
Requirements:
Never trust client-supplied credit prices.
Never allow the frontend to modify wallet balances directly.
Verify the authenticated account.
Use an atomic database operation or transaction.
Prevent concurrent requests from overspending the same balance.
Use an idempotency key or equivalent mechanism to prevent duplicate charges.
Record each successful deduction.
Ensure paid access is granted only when the charge succeeds.
Handle retries, failures, and interrupted requests safely.
Evaluate whether the existing Supabase/PostgreSQL RPC architecture can support atomic deduction.
Follow existing project conventions.
6. Credit Transaction History
Provide an auditable transaction history.
Each transaction should contain appropriate fields such as:
Transaction ID
User ID
Transaction type
Tool identifier, when applicable
Credit amount
Balance change
Timestamp
Payment reference, when applicable
Related usage identifier
Status
Support at least:
Wallet top-up
Tool usage deduction
Refund or reversal when necessary
Administrative adjustment, if an authorized workflow exists
Users should be able to see where their credits were spent.
The meeting suggested monthly or biweekly summaries, but the delivery mechanism and frequency were not finalized.
Implement the underlying transaction history first. Treat scheduled summaries as a separate decision.
7. Journey and Standalone Isolation
Review how tools currently determine their execution context.
The system must distinguish between:
Standalone mode
Journey-integrated mode
Requirements:
A standalone launch must not automatically inherit an active journey merely because the user has one.
Journey-integrated mode must only be available through an authorized journey context.
Do not rely exclusively on frontend URL parameters for authorization.
Validate the user's access to the relevant journey.
Verify the journey tier allows the integrated tool.
Ensure candidate-specific and journey-specific data remains isolated.
Prevent cross-journey data leakage.
Do not let standalone credit purchases upgrade journey entitlements.
Inspect existing CandidateContext, journey routing, subscription entitlements, and tool launch mechanisms.
Reuse the current architecture wherever possible.
8. Auto Form Filler
For the standalone version:
Do not automatically populate information from an immigration journey.
Users should enter the required information themselves.
Apply the approved credit-based launch mechanism.
Preserve existing form-generation functionality.
For the journey-integrated version:
Allow context-aware prepopulation when the journey tier permits it.
Read information only from the authorized active journey.
Save progress according to the existing journey-specific architecture.
The meeting identified possible repeated-use loopholes in Auto Form Filler.
Leadership agreed not to overengineer anti-abuse restrictions during the initial implementation.
Do not build complex anti-abuse controls without approval.
However, retain standard security, authorization, and payment protections.
9. Sponsorship Calculator, 221(g), and Other Tools
Audit each existing standalone tool, including:
Sponsorship Calculator
221(g) Action Planner
Auto Form Filler
Interview Prep
Other credit-eligible tools found in the repository
For each tool, identify:
Current pricing or entitlement checks.
Current preview behavior.
Current result-generation behavior.
Current usage counting.
Current progress-saving behavior.
Whether the tool can run inside a journey.
Whether the tool currently accesses journey context.
Whether the agreed paid-launch flow can be applied safely.
The meeting discussed 221(g) usage in relation to summary or action-plan generation, but its exact final credit consumption and reuse rules need verification.
Do not invent per-tool credit costs.
Do not assume every tool has identical usage semantics.
Produce a per-tool compatibility matrix before changing the implementation.
10. Preserve Existing Journey Subscriptions
Do not replace or remove the existing journey subscription system.
Preserve:
Basic, Premium, and Executive tier logic, where currently applicable.
Existing Stripe subscription or checkout behavior.
Journey-based entitlement checks.
Journey-specific data storage.
Candidate and journey isolation.
Integrated tool access for eligible plans.
Existing services associated with applicable tiers.
The wallet should complement journey subscriptions, not replace them.
A user may own a journey subscription and also have standalone wallet credits.
These are separate entitlements.
11. User Experience
Provide a consistent interface for:
Wallet balance
Wallet top-up
Transaction history
Standalone tool preview
Paid tool launch
Credit confirmation
Insufficient credits
Successful credit deduction
Payment and launch failures
Avoid confusing users about whether they are purchasing a journey tier or spending standalone credits.
Never charge credits for a journey-integrated tool that is already included in the user's authorized tier.
12. Architecture and Security Review
Before coding, inspect:
Existing Supabase schema and RLS policies
Existing Stripe checkout and webhook logic
Existing subscription entitlements
Existing credit or usage counters
Existing tool-specific purchase flows
Existing standalone and journey routing
Existing candidate and journey context
Existing authentication middleware
Existing server APIs and database functions
Identify security risks such as:
Client-side balance manipulation
Duplicate deductions
Concurrent overspending
Duplicate payment credits
Unauthorized journey access
Cross-candidate data leakage
Client-controlled pricing
Double charging
Partial failures between deduction and usage creation
Propose the smallest maintainable architecture that addresses these risks.
13. Decisions Requiring Confirmation
Do not silently make product decisions about:
Exact credit-to-dollar conversion
Exact top-up amounts and custom top-up limits
Exact per-tool credit costs
Signup bonus credits
Whether unused credits expire
Refund policy
Whether a paid launch grants one result, one session, or another usage unit
How retries and recalculations are handled
Whether paid standalone sessions can be resumed
Optional paid journey-context preloading
Monthly or biweekly transaction summaries
Migration of users with existing individual-tool purchases
Document these as open decisions with recommended options and tradeoffs.
Do not overwrite or invalidate existing purchases.
14. Implementation Phases
Phase 1 — Codebase audit
Inspect the existing implementation and prepare a report showing:
Existing functionality
Missing functionality
Relevant files
Database changes needed
API changes needed
Risks
Decisions requiring approval
Phase 2 — Architecture proposal
Provide:
Recommended wallet schema
Transaction ledger design
Payment flow
Atomic credit deduction flow
Tool launch authorization design
Journey versus standalone separation
Migration and backward-compatibility strategy
Wait for approval before making changes.
Phase 3 — Wallet backend
After approval, implement wallet persistence, secure top-ups, transaction recording, and atomic deduction.
Phase 4 — Wallet frontend
Implement wallet balance, top-up experience, and transaction history.
Phase 5 — Tool integration
Implement preview, launch confirmation, credit deduction, and authorized tool usage.
Reuse common components and services where possible.
Phase 6 — Journey isolation
Verify standalone tools remain isolated from journey-specific information while integrated tools retain authorized context awareness.
Phase 7 — Testing
Test at minimum:
User with zero credits
User with sufficient credits
User with insufficient credits
Successful top-up
Failed top-up
Duplicate Stripe webhook
Concurrent tool launches
Duplicate confirmation request
Tool launch failure
User with multiple journeys
User with Basic journey and wallet credits
User with Premium journey
Standalone Auto Form Filler
Journey-integrated Auto Form Filler
Unauthorized journey access
Existing purchased-tool entitlement compatibility
15. Final Deliverables
First provide:
Current-state architecture assessment.
Gap analysis against the meeting decisions.
Confirmed decisions versus unresolved decisions.
Proposed database and API architecture.
Files requiring modification.
Step-by-step implementation plan.
Estimated implementation effort.
Security and migration considerations.
Do not implement until I review and approve the plan.
Once approved, implement in phases, verify functionality, and report exactly what was changed and tested.
Do not claim a feature is complete without checking the code and relevant tests.
Keep the implementation aligned with the existing Rahvana codebase and avoid unnecessary rewrites.

