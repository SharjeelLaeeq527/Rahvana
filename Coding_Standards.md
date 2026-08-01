# Rahvana Coding Standards

> This document defines the coding standards for the Rahvana project.
>
> Every team member is expected to follow these conventions to ensure the codebase remains consistent, readable, and maintainable.

---

# Table of Contents

1. General Principles
2. Project Structure
3. Naming Conventions
4. TypeScript Standards
5. React Standards
6. Next.js Standards
7. Tailwind CSS Standards
8. Imports
9. Functions
10. Variables
11. Constants
12. Error Handling
13. API & Services
14. Folder Structure
15. Git Workflow
16. Commit Messages
17. Code Review Checklist

---

# 1. General Principles

## Write code for humans.

Code is read far more often than it is written.

Prioritize:

- Readability
- Simplicity
- Reusability
- Consistency

Avoid clever code if a simpler solution exists.

---

## Follow DRY

**Don't Repeat Yourself**

If the same logic appears more than once, extract it into:

- utility
- hook
- component
- service

---

## Follow KISS

**Keep It Simple**

Prefer:

```ts
if (isAdmin) {
    ...
}
```

Instead of overly complex expressions.

---

## Component Responsibility

Each component should have one responsibility.

Good:

```
UserCard
```

Bad:

```
UserCard
UserList
UserSearch
UserPagination

(all inside one component)
```

---

# 2. Project Structure

```
src/
│
├── app/
│
├── components/
│   ├── common/
│   ├── layout/
│   ├── ui/
│   └── forms/
│
├── hooks/
├── services/
├── utils/
├── lib/
├── types/
├── constants/
├── store/
├── assets/
└── styles/
```

---

# 3. Naming Conventions

## Components

Use PascalCase

```
UserCard.tsx
Navbar.tsx
Sidebar.tsx
DocumentVault.tsx
```

---

## Hooks

Always begin with use

```
useAuth.ts

useDocuments.ts

usePagination.ts
```

---

## Utility Files

camelCase

```
formatDate.ts

calculateAge.ts

downloadFile.ts
```

---

## Variables

Always use camelCase

Good

```ts
const userName;

const visaStatus;

const totalIncome;

const isLoading;
```

Bad

```ts
const user_name;

const UserName;

const USERNAME;
```

---

## Boolean Variables

Always begin with:

```
is

has

can

should

was
```

Example

```ts
isLoading;

hasPermission;

canEdit;

shouldRedirect;

wasSuccessful;
```

---

## Functions

Functions describe actions.

```
getUser()

updateProfile()

deleteDocument()

calculateIncome()

formatDate()
```

---

## Components

```
<UserCard />

<DocumentList />

<Navbar />
```

---

## Interfaces

```
interface User {}

interface Document {}

interface UserCardProps {}
```

Never

```
interface Props {}
```

---

## Types

```
User

Visa

Document
```

---

## Enums

```
enum VisaStatus {
    Pending,
    Approved,
    Rejected,
}
```

---

# 4. TypeScript Standards

Always use strict typing.

Avoid

```ts
any;
```

Prefer

```ts
unknown;
```

or proper interfaces.

---

Prefer interfaces for objects.

```ts
interface User {
  id: string;
  name: string;
}
```

---

Use type for unions.

```ts
type Status = "pending" | "approved" | "rejected";
```

---

Never ignore TypeScript errors using

```ts
// @ts-ignore
```

unless absolutely necessary.

---

# 5. React Standards

One component per file.

Keep components under roughly 300 lines.

If larger:

Split into:

- child components

or

- custom hooks

---

Props interface

```ts
interface DocumentCardProps {
  document: Document;
  onDelete: () => void;
}
```

---

Avoid inline functions if they become large.

Bad

```tsx
<Button
    onClick={() => {
        ...
        ...
        ...
        ...
    }}
/>
```

Move logic into a named function.

---

# 6. Next.js Standards

Use App Router.

Use Server Components by default.

Use Client Components only when necessary.

```
"use client"
```

should not become the default.

---

Keep page.tsx focused on layout and composition.

Move business logic elsewhere.

---

Use loading.tsx

error.tsx

notFound.tsx

when appropriate.

---

# 7. Tailwind CSS Standards

Order utility classes consistently.

Recommended order

```
Layout

Flex/Grid

Spacing

Sizing

Typography

Colors

Background

Border

Effects

Animation

State
```

Example

```tsx
className="
flex
items-center
justify-between
gap-4
w-full
p-6
text-lg
font-semibold
text-white
bg-primary
rounded-xl
shadow
hover:bg-primary-dark
transition
"
```

---

Never hardcode colors repeatedly.

Use Tailwind theme tokens whenever possible.

---

# 8. Imports

Always use absolute imports.

Good

```
@/components/Navbar
```

Avoid

```
../../../Navbar
```

---

# 9. Functions

Functions should do one thing.

Bad

```
loadUser()
```

- fetch data
- validate
- sort
- filter
- save

Good

```
fetchUser()

validateUser()

sortDocuments()

saveProfile()
```

---

Function names should begin with verbs.

Examples

```
get

fetch

create

update

delete

calculate

format

validate
```

---

# 10. Variables

Names should explain purpose.

Bad

```ts
const data;

const obj;

const item;
```

Good

```ts
const interviewQuestions;

const visaDocuments;

const sponsorIncome;
```

---

# 11. Constants

Avoid magic numbers.

Bad

```ts
if (age > 21)
```

Good

```ts
const MINIMUM_SPONSOR_AGE = 21;

if (age > MINIMUM_SPONSOR_AGE)
```

---

Store reusable constants inside

```
constants/
```

---

# 12. Error Handling

Never ignore errors.

Bad

```ts
catch {}
```

Good

```ts
catch (error) {
    console.error(error);
}
```

Display meaningful UI errors whenever possible.

---

# 13. API & Services

Business logic belongs inside services.

Avoid API calls inside components.

Good

```
services/user.service.ts
```

Component

```ts
await userService.getProfile();
```

---

# 14. Folder Structure

Keep folders lowercase.

```
components

hooks

utils

services

styles
```

Avoid

```
Components

Hooks

Utils
```

---

# 15. Git Workflow

---

Always create Pull Requests.

Do not commit directly to main.

---

# 16. Commit Messages

Follow Conventional Commits.

```
feat:

fix:

refactor:

style:

docs:

test:

chore:
```

Examples

```
feat: add document vault upload

fix: resolve DS-260 validation issue

docs: update coding standards

refactor: simplify sponsor calculator

chore: upgrade Next.js
```

# 17. Documentation Explains "Why"

---

# 18. Code Review Checklist

Before requesting a review, verify:

- Code builds successfully.
- No TypeScript errors.
- No ESLint warnings.
- No unused imports.
- No unused variables.
- No console.log statements.
- No duplicated code.
- Naming follows conventions.
- Components remain focused.
- Proper loading and error states exist.
- Accessibility has been considered.
- Responsive behavior has been verified.

---

# Recommended Tools

Install and configure:

- ESLint
- Prettier
- TypeScript (Strict Mode)
- Husky
- lint-staged
- Prettier Tailwind Plugin

---

# Final Rule

> Code should be easy enough that another developer can understand it without asking the original author.

When in doubt, choose the solution that is simpler, clearer, and more maintainable.
