// C:\Users\HP\Desktop\arachnie\Arachnie\app\visa-checker\page.tsx
"use client";

import Form from "@/app/components/visa-checker/Form";

export default function Home() {
  return (
    <div className="bg-background p-4 sm:p-6 md:p-8 mb-6 sm:mb-10">
      <div className="max-w-2xl mx-auto text-center mt-2 sm:mt-4 md:mt-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2 sm:mb-3">
          Visa Progress Checker
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-2 sm:px-0">
          Enter your USCIS Case Number – We will auto-fetch your Priority Date!
        </p>
        <Form />
      </div>
    </div>
  );
}
