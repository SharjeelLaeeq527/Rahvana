// C:\Users\HP\Desktop\arachnie\Arachnie\app\visa-forms\[formCode]\wizard\page.tsx
import { MultiStepForm } from "@/app/components/forms/auto-visaform-filling/MultiStepForm";

// 2. Async Params Props Definition (Next 15 Fix)
type Props = {
  params: Promise<{ formCode: string }>;
};

// 3. Make the function async
export default async function FormWizardPage({ params }: Props) {
  // 4. Await params
  const resolvedParams = await params;
  const { formCode } = resolvedParams;
  const normalizedCode = formCode.toLowerCase().replace(/[^a-z0-9]/g, "");

  return (
    <main className="min-h-screen">
      {/* 5. Only pass the string formCode (No config object) */}
      {/* FIX: Pass the normalizedCode as the formCode prop */}
      <MultiStepForm formCode={normalizedCode} />
    </main>
  );
}
