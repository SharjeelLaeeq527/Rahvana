"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Save, CheckCircle, AlertCircle, Info } from "lucide-react";

interface CaseRegistrationFormProps {
  onComplete: (data: {
    nvcCaseNum: string;
    nvcInvoice: string;
    embassyCity: string;
    beneficiaryName: string;
    passportNumber: string;
    surname: string;
  }) => void;
  existingData?: {
    nvcCaseNum?: string;
    nvcInvoice?: string;
    embassyCity?: string;
    beneficiaryName?: string;
    passportNumber?: string;
    surname?: string;
  };
}

export default function CaseRegistrationForm({
  onComplete,
  existingData,
}: CaseRegistrationFormProps) {
  const [nvcCaseNum, setNvcCaseNum] = useState(existingData?.nvcCaseNum || "");
  const [nvcInvoice, setNvcInvoice] = useState(existingData?.nvcInvoice || "");
  const [embassyCity, setEmbassyCity] = useState(existingData?.embassyCity || "");
  const [beneficiaryName, setBeneficiaryName] = useState(existingData?.beneficiaryName || "");
  const [passportNumber, setPassportNumber] = useState(existingData?.passportNumber || "");
  const [surname, setSurname] = useState(existingData?.surname || "");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (!nvcCaseNum || !nvcInvoice || !embassyCity || !passportNumber || !surname) {
      return;
    }

    onComplete({
      nvcCaseNum,
      nvcInvoice,
      embassyCity,
      beneficiaryName,
      passportNumber,
      surname,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const isComplete = nvcCaseNum && nvcInvoice && embassyCity && passportNumber && surname;

  return (
    <Card className="border-2 border-teal-200 bg-teal-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-teal-600" />
          Case Registration
          {isSaved && (
            <Badge className="bg-green-100 text-green-800 ml-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Provide your NVC case details so we can track your progress automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Why do we need this?</p>
              <p className="opacity-80">
                These details allow our admin team to track your case progress through the NVC and CEAC systems. 
                This information is stored securely and only used to update your dashboard with real-time status.
              </p>
            </div>
          </div>
        </div>

        {/* NVC Case Number */}
        <div>
          <Label htmlFor="nvc-case-num">
            NVC Case Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nvc-case-num"
            placeholder="e.g., 2025ABC1234567890"
            value={nvcCaseNum}
            onChange={(e) => setNvcCaseNum(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Found in your NVC Welcome Letter
          </p>
        </div>

        {/* CEAC Invoice ID */}
        <div>
          <Label htmlFor="nvc-invoice">
            CEAC Invoice ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nvc-invoice"
            placeholder="e.g., 202500001234"
            value={nvcInvoice}
            onChange={(e) => setNvcInvoice(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Also provided in your NVC Welcome Letter
          </p>
        </div>

        {/* Embassy/Consulate City */}
        <div>
          <Label htmlFor="embassy-city">
            Embassy/Consulate City <span className="text-red-500">*</span>
          </Label>
          <Select value={embassyCity} onValueChange={setEmbassyCity}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select your embassy city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Islamabad">Islamabad, Pakistan</SelectItem>
              <SelectItem value="Karachi">Karachi, Pakistan</SelectItem>
              <SelectItem value="Lahore">Lahore, Pakistan</SelectItem>
              <SelectItem value="Abu Dhabi">Abu Dhabi, UAE</SelectItem>
              <SelectItem value="Dubai">Dubai, UAE</SelectItem>
              <SelectItem value="London">London, UK</SelectItem>
              <SelectItem value="Toronto">Toronto, Canada</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Where your interview will be conducted
          </p>
        </div>

        {/* Beneficiary Name (Optional) */}
        <div>
          <Label htmlFor="beneficiary-name">
            Beneficiary Full Name <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <Input
            id="beneficiary-name"
            placeholder="e.g., Ayesha Khan"
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Passport Number */}
        <div>
          <Label htmlFor="passport-number">
            Passport Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="passport-number"
            placeholder="e.g., AZ1234567"
            value={passportNumber}
            onChange={(e) => setPassportNumber(e.target.value)}
            className="mt-1 uppercase"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Needed for CEAC visa status checking.
          </p>
        </div>

        {/* First 5 Letters of Surname */}
        <div>
          <Label htmlFor="surname">
            First 5 Letters of Surname <span className="text-red-500">*</span>
          </Label>
          <Input
            id="surname"
            placeholder="e.g., AHMED"
            value={surname}
            onChange={(e) => setSurname(e.target.value.substring(0, 5))}
            className="mt-1 uppercase"
            maxLength={5}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Needed for CEAC visa status checking.
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={!isComplete || isSaved}
            className="w-full"
          >
            {isSaved ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Saved Successfully
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Case Details
              </>
            )}
          </Button>
        </div>

        {!isComplete && (
          <div className="flex items-center gap-2 text-xs text-amber-700">
            <AlertCircle className="h-3 w-3" />
            <span>Please fill in all required fields</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
