import PassportOcrTool from "@/components/tools/PassportOcrTool";

export const metadata = {
  title: "Passport Auto-Fill",
  description: "Upload a passport to read and save its details automatically.",
};

export default function PassportOcrPage() {
  return (
    <div className="bg-background site-main-px mt-10 site-main-py mb-6 sm:mb-10">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2 sm:mb-3">
          Passport Auto-Fill
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground px-2 sm:px-0">
          Upload your passport once — we read the details, check them against your profile, and you
          confirm before anything is saved.
        </p>
      </div>
      <PassportOcrTool />
    </div>
  );
}
