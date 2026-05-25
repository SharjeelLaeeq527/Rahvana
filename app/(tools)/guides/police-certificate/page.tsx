"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  MapPin,
  FileText,
  Building2,
} from "lucide-react";

export default function PoliceCertificateGuidePage() {
  const [selectedProvince, setSelectedProvince] = React.useState<string>("sindh");

  const provinceData = {
    sindh: {
      name: "Sindh",
      office: "Police Khidmat Markaz / Facilitation Center",
      fee: "PKR 500-1,000",
      processing: "7-14 days",
      location: "Based on CNIC address",
      steps: [
        {
          title: "Visit Police Khidmat Markaz",
          description:
            "Go to the Police Facilitation Center in your district (based on CNIC address).",
        },
        {
          title: "Submit Application",
          description: "Fill out the PCC application form and submit required documents.",
        },
        {
          title: "Biometric Verification",
          description: "Provide fingerprints and photo at the center.",
        },
        {
          title: "Pay Fee",
          description: "Pay the processing fee (PKR 500-1,000) at the designated counter.",
        },
        {
          title: "Collect Certificate",
          description: "Return after 7-14 days to collect your PCC. Bring your receipt.",
        },
      ],
    },
    punjab: {
      name: "Punjab",
      office: "Punjab Police Integrated Command, Control & Communication Centre (PICCC)",
      fee: "PKR 500-1,500",
      processing: "10-15 days",
      location: "District Police Office",
      steps: [
        {
          title: "Visit District Police Office",
          description: "Go to your local District Police Office based on your CNIC address.",
        },
        {
          title: "Submit Application",
          description: "Fill the PCC form and attach required documents (CNIC, photos, fee).",
        },
        {
          title: "Verification Process",
          description: "Police will conduct background verification at your registered address.",
        },
        {
          title: "Pay Fee",
          description: "Pay the processing fee at the designated bank or office counter.",
        },
        {
          title: "Collect Certificate",
          description: "Collect your PCC after 10-15 days from the same office.",
        },
      ],
    },
    kpk: {
      name: "Khyber Pakhtunkhwa (KPK)",
      office: "District Police Office",
      fee: "PKR 500-1,000",
      processing: "10-20 days",
      location: "District Police Office",
      steps: [
        {
          title: "Visit District Police Office",
          description: "Go to the District Police Office in your area.",
        },
        {
          title: "Submit Application",
          description: "Complete the application form with required documents.",
        },
        {
          title: "Background Verification",
          description: "Local police will verify your address and conduct background checks.",
        },
        {
          title: "Pay Fee",
          description: "Pay the processing fee as instructed.",
        },
        {
          title: "Collect Certificate",
          description: "Return to collect your PCC after the processing period.",
        },
      ],
    },
    balochistan: {
      name: "Balochistan",
      office: "District Police Office",
      fee: "PKR 500-1,000",
      processing: "15-30 days",
      location: "District Police Office",
      steps: [
        {
          title: "Visit District Police Office",
          description: "Go to your local District Police Office.",
        },
        {
          title: "Submit Application",
          description: "Fill out the PCC application form and submit documents.",
        },
        {
          title: "Verification Process",
          description: "Police will conduct verification at your registered address.",
        },
        {
          title: "Pay Fee",
          description: "Pay the required fee at the office.",
        },
        {
          title: "Collect Certificate",
          description: "Collect your certificate after processing is complete.",
        },
      ],
    },
  };

  const currentProvince = provinceData[selectedProvince as keyof typeof provinceData];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Link href="/guides" className="hover:text-primary transition-colors">
              Guides
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">Police Character Certificate (PCC)</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white py-12">
        <div className="container mx-auto px-6">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all guides
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Shield className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Police Character Certificate (PCC)
              </h1>
              <p className="text-xl text-blue-100">
                Required for every country you've lived in for 6+ months since age 16
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Processing Time</span>
              </div>
              <p className="text-2xl font-bold">7-30 days</p>
              <p className="text-sm text-blue-100">Varies by province</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5" />
                <span className="font-semibold">Fee</span>
              </div>
              <p className="text-2xl font-bold">PKR 500-1,500</p>
              <p className="text-sm text-blue-100">Province-dependent</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">Validity</span>
              </div>
              <p className="text-2xl font-bold">6-12 months</p>
              <p className="text-sm text-blue-100">Usually valid</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Difficulty</span>
              </div>
              <p className="text-2xl font-bold">Medium</p>
              <p className="text-sm text-blue-100">Requires patience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Purpose */}
            <section className="bg-white rounded-xl p-8 shadow-md border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="h-1 w-8 bg-primary rounded-full"></div>
                Purpose
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                The Police Character Certificate (PCC) is a document that certifies you have{" "}
                <strong>no criminal record</strong> in Pakistan. It's a mandatory requirement for US
                visa applications.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Important:</strong> You need a PCC from:
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>
                        • <strong>Current residence</strong> (Pakistan)
                      </li>
                      <li>
                        • <strong>Every country</strong> you've lived in for 6+ months since age 16
                      </li>
                      <li>
                        • <strong>Every province</strong> in Pakistan where you've lived 6+ months
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Province Selector */}
            <section className="bg-white rounded-xl p-8 shadow-md border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="h-1 w-8 bg-primary rounded-full"></div>
                Select Your Province
              </h2>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {Object.entries(provinceData).map(([key, data]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedProvince(key)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedProvince === key
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-slate-200 hover:border-primary/50 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin
                        className={`h-6 w-6 ${selectedProvince === key ? "text-primary" : "text-slate-400"}`}
                      />
                      <div>
                        <h3
                          className={`font-semibold ${
                            selectedProvince === key ? "text-primary" : "text-slate-800"
                          }`}
                        >
                          {data.name}
                        </h3>
                        <p className="text-sm text-slate-500">{data.processing}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Province-Specific Info */}
              <div className="bg-gradient-to-br from-primary/5 to-blue-50 rounded-lg p-6 border border-primary/20">
                <h3 className="font-semibold text-lg text-slate-800 mb-4">
                  {currentProvince.name} - Quick Info
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Office</p>
                    <p className="font-semibold text-slate-800">{currentProvince.office}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Location</p>
                    <p className="font-semibold text-slate-800">{currentProvince.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Fee</p>
                    <p className="font-semibold text-slate-800">{currentProvince.fee}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Processing Time</p>
                    <p className="font-semibold text-slate-800">{currentProvince.processing}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Step-by-Step Process */}
            <section className="bg-white rounded-xl p-8 shadow-md border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="h-1 w-8 bg-primary rounded-full"></div>
                How to Obtain - {currentProvince.name}
              </h2>

              <div className="space-y-6">
                {currentProvince.steps.map((step, index) => (
                  <div
                    key={index}
                    className="relative pl-8 pb-6 border-l-2 border-primary/30 last:border-0 last:pb-0"
                  >
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-primary rounded-full"></div>
                    <h3 className="font-semibold text-lg text-slate-800 mb-2">
                      Step {index + 1}: {step.title}
                    </h3>
                    <p className="text-slate-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Required Documents */}
            <section className="bg-white rounded-xl p-8 shadow-md border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="h-1 w-8 bg-primary rounded-full"></div>
                Required Documents
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Original CNIC</h3>
                    <p className="text-slate-600">
                      Bring your original Computerized National Identity Card
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">CNIC Photocopy</h3>
                    <p className="text-slate-600">2-3 photocopies of both sides of your CNIC</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Passport-Size Photos</h3>
                    <p className="text-slate-600">2 recent passport-size photographs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Fee Payment</h3>
                    <p className="text-slate-600">Cash for processing fee (varies by province)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Application Form</h3>
                    <p className="text-slate-600">Available at the police office (fill on-site)</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Common Mistakes */}
            <section className="bg-white rounded-xl p-8 shadow-md border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="h-1 w-8 bg-primary rounded-full"></div>
                Common Mistakes to Avoid
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Wrong Province</h3>
                    <p className="text-sm text-red-700">
                      Applying in the wrong province. You MUST apply based on your CNIC address, not
                      current residence.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Expired PCC</h3>
                    <p className="text-sm text-red-700">
                      Using an old PCC. Most embassies require it to be issued within 6-12 months of
                      your interview.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Missing Previous Residences</h3>
                    <p className="text-sm text-red-700">
                      Not obtaining PCCs from all countries/provinces where you lived 6+ months.
                      This is mandatory!
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Incomplete Documents</h3>
                    <p className="text-sm text-red-700">
                      Forgetting to bring photocopies or photos. This will delay your application.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Pro Tips */}
            <section className="bg-white rounded-xl p-8 shadow-md border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="h-1 w-8 bg-primary rounded-full"></div>
                Pro Tips
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-800 mb-1">Apply Early</h3>
                    <p className="text-sm text-green-700">
                      Start the PCC process as soon as possible. Processing times can vary,
                      especially during busy periods.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-800 mb-1">Visit Early Morning</h3>
                    <p className="text-sm text-green-700">
                      Go to the police office early in the morning to avoid long queues and ensure
                      same-day processing.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-800 mb-1">Keep Receipt Safe</h3>
                    <p className="text-sm text-green-700">
                      Your receipt is essential for collecting the PCC. Keep it in a safe place and
                      bring it when collecting.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-800 mb-1">Get Multiple Copies</h3>
                    <p className="text-sm text-green-700">
                      Request 2-3 certified copies of your PCC. You may need extras for NVC,
                      embassy, or backup purposes.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Links */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-100 sticky top-6">
              <h3 className="font-semibold text-lg text-slate-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/police-verification"
                  className="flex items-center gap-3 p-3 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors group"
                >
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-primary">
                    PCC Service (Sindh)
                  </span>
                </Link>
                <Link
                  href="/guides"
                  className="flex items-center gap-3 p-3 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors group"
                >
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-primary">
                    All Document Guides
                  </span>
                </Link>
              </div>
            </div>

            {/* Related Guides */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-100">
              <h3 className="font-semibold text-lg text-slate-800 mb-4">Related Guides</h3>
              <div className="space-y-3">
                <Link
                  href="/guides/cnic"
                  className="block p-3 hover:bg-slate-50 rounded-lg transition-colors group"
                >
                  <h4 className="font-medium text-slate-700 group-hover:text-primary mb-1">CNIC</h4>
                  <p className="text-xs text-slate-500">Required for PCC application</p>
                </Link>
                <Link
                  href="/guides/court-records"
                  className="block p-3 hover:bg-slate-50 rounded-lg transition-colors group"
                >
                  <h4 className="font-medium text-slate-700 group-hover:text-primary mb-1">
                    Court Records
                  </h4>
                  <p className="text-xs text-slate-500">If you have legal history</p>
                </Link>
                <Link
                  href="/guides/interview-documents"
                  className="block p-3 hover:bg-slate-50 rounded-lg transition-colors group"
                >
                  <h4 className="font-medium text-slate-700 group-hover:text-primary mb-1">
                    Interview Documents
                  </h4>
                  <p className="text-xs text-slate-500">What to bring to embassy</p>
                </Link>
              </div>
            </div>

            {/* Help Box */}
            <div className="bg-gradient-to-br from-primary to-blue-600 text-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-lg mb-2">Need Help?</h3>
              <p className="text-sm text-blue-100 mb-4">
                Check your case strength and get a personalized document checklist.
              </p>
              <Link
                href="/visa-case-strength-checker"
                className="block text-center bg-white text-primary px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Try CasePulse AI
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
