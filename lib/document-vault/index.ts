// Document Vault - Main Export File

// Types
export * from "./types";

// Document Definitions
export * from "./document-definitions";

// Personalization Engine
export * from "./personalization-engine";

// File Utilities
export * from "./file-utils";

// Client Storage (safe for client components)
export * from "./storage-client";

// Server Storage (server-side only - import directly in API routes)
// export * from './storage-server'; // Don't export here to prevent client usage

// Expiration Tracker
export * from "./expiration-tracker";

// Zustand Store
export * from "./store";
