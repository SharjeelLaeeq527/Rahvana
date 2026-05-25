import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PDFDocument } from "pdf-lib";

// ============================================================================
// PDF EDITOR TYPES
// ============================================================================

export interface TextAnnotation {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  font?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right";
  bgColor?: string;
  opacity?: number;
  rotation?: number;
  width?: number;
  height?: number;
}

export interface SignatureAnnotation {
  id: string;
  pageIndex: number;
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export type ShapeType = "check" | "cross" | "rectangle" | "arrow";

export interface ShapeAnnotation {
  id: string;
  pageIndex: number;
  type: ShapeType;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation?: number;
  strokeWidth?: number;
  fillColor?: string;
  width?: number;
  height?: number;
}

export interface PageModification {
  originalIndex: number;
  rotation: number;
  deleted: boolean;
}

// ============================================================================
// PDF EDITOR STORE
// ============================================================================

export interface PDFEditorStore {
  pdfFile: File | null;
  pdfDoc: PDFDocument | null;
  currentPage: number;
  totalPages: number;

  annotations: TextAnnotation[];
  signatureAnnotations: SignatureAnnotation[];
  shapeAnnotations: ShapeAnnotation[];
  signatureImage: string | null;

  selectedAnnotation: string | null;
  pageModifications: PageModification[];

  setSignatureImage: (img: string | null) => void;
  setPageModifications: (mods: PageModification[]) => void;
  setPdfFile: (file: File) => void;
  setPdfDoc: (doc: PDFDocument | null) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;

  addAnnotation: (annotation: TextAnnotation) => void;
  updateAnnotation: (id: string, updates: Partial<TextAnnotation>) => void;
  deleteAnnotation: (id: string) => void;
  getPageAnnotations: (pageIndex: number) => TextAnnotation[];

  addSignatureAnnotation: (signature: SignatureAnnotation) => void;
  updateSignatureAnnotation: (id: string, updates: Partial<SignatureAnnotation>) => void;
  deleteSignatureAnnotation: (id: string) => void;
  getPageSignatures: (pageIndex: number) => SignatureAnnotation[];

  addShapeAnnotation: (shape: ShapeAnnotation) => void;
  updateShapeAnnotation: (id: string, updates: Partial<ShapeAnnotation>) => void;
  deleteShapeAnnotation: (id: string) => void;
  getPageShapes: (pageIndex: number) => ShapeAnnotation[];

  setSelectedAnnotation: (id: string | null) => void;
  reset: () => void;
}

export const usePDFStore = create<PDFEditorStore>((set, get) => ({
  pdfFile: null,
  pdfDoc: null,
  currentPage: 0,
  totalPages: 0,
  annotations: [],
  signatureAnnotations: [],
  shapeAnnotations: [],
  signatureImage: null,
  selectedAnnotation: null,
  pageModifications: [],

  setSignatureImage: (img) => set({ signatureImage: img }),
  setPageModifications: (mods) => set({ pageModifications: mods }),
  setPdfFile: (file) => set({ pdfFile: file }),
  setPdfDoc: (doc) => set({ pdfDoc: doc }),
  setCurrentPage: (page) => set({ currentPage: page }),

  setTotalPages: (pages) => {
    set({ totalPages: pages });
    if (get().pageModifications.length === 0) {
      const mods: PageModification[] = [];
      for (let i = 0; i < pages; i++) {
        mods.push({ originalIndex: i, rotation: 0, deleted: false });
      }
      set({ pageModifications: mods });
    }
  },

  addAnnotation: (annotation) =>
    set((state) => ({ annotations: [...state.annotations, annotation] })),

  updateAnnotation: (id, updates) =>
    set((state) => ({
      annotations: state.annotations.map((ann) => (ann.id === id ? { ...ann, ...updates } : ann)),
    })),

  deleteAnnotation: (id) =>
    set((state) => ({
      annotations: state.annotations.filter((ann) => ann.id !== id),
    })),

  getPageAnnotations: (pageIndex) => get().annotations.filter((ann) => ann.pageIndex === pageIndex),

  addSignatureAnnotation: (signature) =>
    set((state) => ({
      signatureAnnotations: [...state.signatureAnnotations, signature],
    })),

  updateSignatureAnnotation: (id, updates) =>
    set((state) => ({
      signatureAnnotations: state.signatureAnnotations.map((sig) =>
        sig.id === id ? { ...sig, ...updates } : sig
      ),
    })),

  deleteSignatureAnnotation: (id) =>
    set((state) => ({
      signatureAnnotations: state.signatureAnnotations.filter((sig) => sig.id !== id),
    })),

  getPageSignatures: (pageIndex) =>
    get().signatureAnnotations.filter((sig) => sig.pageIndex === pageIndex),

  addShapeAnnotation: (shape) =>
    set((state) => ({
      shapeAnnotations: [...state.shapeAnnotations, shape],
    })),

  updateShapeAnnotation: (id, updates) =>
    set((state) => ({
      shapeAnnotations: state.shapeAnnotations.map((shape) =>
        shape.id === id ? { ...shape, ...updates } : shape
      ),
    })),

  deleteShapeAnnotation: (id) =>
    set((state) => ({
      shapeAnnotations: state.shapeAnnotations.filter((shape) => shape.id !== id),
    })),

  getPageShapes: (pageIndex) =>
    get().shapeAnnotations.filter((shape) => shape.pageIndex === pageIndex),

  setSelectedAnnotation: (id) => set({ selectedAnnotation: id }),

  reset: () =>
    set({
      pdfFile: null,
      pdfDoc: null,
      currentPage: 0,
      totalPages: 0,
      annotations: [],
      signatureAnnotations: [],
      shapeAnnotations: [],
      signatureImage: null,
      selectedAnnotation: null,
      pageModifications: [],
    }),
}));

// ============================================================================
// IR PATHWAY ROADMAP STORE
// ============================================================================

interface RoadmapStore {
  completedSteps: number[];
  completeStep: (stepId: number) => void;
  uncompleteStep: (stepId: number) => void;
  resetProgress: () => void;
}

export const useStore = create<RoadmapStore>()(
  persist(
    (set) => ({
      completedSteps: [],
      completeStep: (stepId) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(stepId)
            ? state.completedSteps
            : [...state.completedSteps, stepId],
        })),
      uncompleteStep: (stepId) =>
        set((state) => ({
          completedSteps: state.completedSteps.filter((id) => id !== stepId),
        })),
      resetProgress: () => set({ completedSteps: [] }),
    }),
    {
      name: "roadmap-storage",
    }
  )
);
