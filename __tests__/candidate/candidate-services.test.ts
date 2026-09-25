// __tests__/candidate/candidate-services.test.ts
// ============================================================================
// Multi-Candidate Services Scoping & Beneficiary Isolation Tests (Phase 3)
// ============================================================================

describe("Phase 3: Beneficiary-Specific Services & Multi-Candidate Scoping", () => {
  // ─── 1. Document Translation Scoping ─────────────────────────────────────
  describe("1. Document Translation Isolation & Metadata Tagging", () => {
    it("attaches candidate_id and candidate_name to document upload metadata", () => {
      const createUploadPayload = (
        userId: string,
        candidateId: string,
        candidateName: string,
        fileName: string
      ) => {
        return {
          user_id: userId,
          original_filename: fileName,
          metadata: {
            candidate_id: candidateId,
            candidate_name: candidateName,
            uploaded_at: new Date().toISOString(),
          },
        };
      };

      const cand1Upload = createUploadPayload(
        "user-123",
        "candidate-1",
        "Fatima Bibi",
        "birth_certificate_mother.pdf"
      );
      const cand2Upload = createUploadPayload(
        "user-123",
        "candidate-2",
        "Muhammad Ali",
        "marriage_certificate_father.pdf"
      );

      expect(cand1Upload.metadata.candidate_id).toBe("candidate-1");
      expect(cand1Upload.metadata.candidate_name).toBe("Fatima Bibi");
      expect(cand2Upload.metadata.candidate_id).toBe("candidate-2");
      expect(cand2Upload.metadata.candidate_name).toBe("Muhammad Ali");
    });

    it("filters translation documents by candidateId with legacy candidate-1 fallback", () => {
      const mockDocuments = [
        {
          id: "doc-1",
          user_id: "user-123",
          original_filename: "doc1.pdf",
          metadata: { candidate_id: "candidate-1", candidate_name: "Fatima Bibi" },
        },
        {
          id: "doc-2",
          user_id: "user-123",
          original_filename: "doc2.pdf",
          metadata: { candidate_id: "candidate-2", candidate_name: "Muhammad Ali" },
        },
        {
          id: "doc-legacy",
          user_id: "user-123",
          original_filename: "doc_legacy.pdf",
          metadata: { uploaded_by: "user-123" }, // No candidate_id
        },
      ];

      const filterByCandidate = (docs: typeof mockDocuments, candidateId: string | null) => {
        if (!candidateId) return docs;
        return docs.filter((doc) => {
          const directId = (doc as any).candidate_id;
          const metaId = doc.metadata?.candidate_id;
          if (directId) return directId === candidateId;
          if (metaId) return metaId === candidateId;
          if (candidateId === "candidate-1" && !directId && !metaId) {
            return true;
          }
          return false;
        });
      };

      const cand1Docs = filterByCandidate(mockDocuments, "candidate-1");
      const cand2Docs = filterByCandidate(mockDocuments, "candidate-2");
      const cand3Docs = filterByCandidate(mockDocuments, "candidate-3");

      expect(cand1Docs.map((d) => d.id)).toEqual(["doc-1", "doc-legacy"]);
      expect(cand2Docs.map((d) => d.id)).toEqual(["doc-2"]);
      expect(cand3Docs).toHaveLength(0);
    });
  });

  // ─── 2. Police Character Certificate (PCC) Scoping ───────────────────────
  describe("2. Police Character Certificate (PCC) Isolation & Biographics", () => {
    it("structures PCC request with candidate tags and admin notes", () => {
      const createPccRecord = (formData: {
        fullName: string;
        cnic: string;
        candidateId: string;
        candidateName: string;
      }) => {
        return {
          full_name: formData.fullName,
          cnic: formData.cnic,
          candidate_id: formData.candidateId,
          candidate_name: formData.candidateName,
          admin_notes: `[Candidate: ${formData.candidateId}] ${formData.candidateName}`.trim(),
        };
      };

      const recordCand1 = createPccRecord({
        fullName: "Fatima Bibi",
        cnic: "42101-1234567-2",
        candidateId: "candidate-1",
        candidateName: "Fatima Bibi",
      });

      const recordCand2 = createPccRecord({
        fullName: "Muhammad Ali",
        cnic: "42101-7654321-1",
        candidateId: "candidate-2",
        candidateName: "Muhammad Ali",
      });

      expect(recordCand1.candidate_id).toBe("candidate-1");
      expect(recordCand1.admin_notes).toBe("[Candidate: candidate-1] Fatima Bibi");
      expect(recordCand2.candidate_id).toBe("candidate-2");
      expect(recordCand2.admin_notes).toBe("[Candidate: candidate-2] Muhammad Ali");
    });

    it("auto-populates PCC form from active candidate data correctly", () => {
      const candidates = [
        {
          id: "candidate-1",
          label: "Mother",
          fullName: "Fatima Bibi",
          nationalId: "42101-1111111-1",
          dateOfBirth: "1965-04-12",
          passportNumber: "PK1234567",
        },
        {
          id: "candidate-2",
          label: "Father",
          fullName: "Muhammad Ali",
          nationalId: "42101-2222222-2",
          dateOfBirth: "1960-08-20",
          passportNumber: "PK7654321",
        },
      ];

      const getAutoFillForPcc = (candidate: (typeof candidates)[0]) => {
        return {
          fullName: candidate.fullName,
          cnic: candidate.nationalId || "",
          dob: candidate.dateOfBirth || "",
          passport: candidate.passportNumber || "",
        };
      };

      const autoFill1 = getAutoFillForPcc(candidates[0]);
      const autoFill2 = getAutoFillForPcc(candidates[1]);

      expect(autoFill1.fullName).toBe("Fatima Bibi");
      expect(autoFill1.cnic).toBe("42101-1111111-1");
      expect(autoFill2.fullName).toBe("Muhammad Ali");
      expect(autoFill2.cnic).toBe("42101-2222222-2");
      expect(autoFill1.cnic).not.toBe(autoFill2.cnic);
    });
  });

  // ─── 3. Medical Appointment Booking Scoping ──────────────────────────────
  describe("3. Medical Appointment Booking Isolation & Applicant Scoping", () => {
    it("attaches candidate_id and candidate_name to medical appointment payload", () => {
      const createAppointmentPayload = (
        formData: any,
        candidateId: string,
        candidateName: string
      ) => {
        return {
          ...formData,
          candidate_id: candidateId || "candidate-1",
          candidate_name: candidateName,
          admin_notes: candidateId ? `[Candidate: ${candidateId}] ${candidateName}`.trim() : "",
        };
      };

      const payloadMother = createAppointmentPayload(
        {
          givenName: "Fatima",
          surname: "Bibi",
          location: "islamabad",
          islamabadProvider: "amc",
        },
        "candidate-1",
        "Fatima Bibi"
      );

      const payloadFather = createAppointmentPayload(
        {
          givenName: "Muhammad",
          surname: "Ali",
          location: "karachi",
        },
        "candidate-2",
        "Muhammad Ali"
      );

      expect(payloadMother.candidate_id).toBe("candidate-1");
      expect(payloadMother.admin_notes).toContain("[Candidate: candidate-1]");
      expect(payloadFather.candidate_id).toBe("candidate-2");
      expect(payloadFather.admin_notes).toContain("[Candidate: candidate-2]");
    });

    it("maps active candidate biographics into appointment form structure", () => {
      const activeCandidate = {
        id: "candidate-2",
        fullName: "Muhammad Ali",
        name: { first: "Muhammad", last: "Ali" },
        passportNumber: "PK9876543",
        dateOfBirth: "1962-05-15",
        caseNumber: "ISL2024123456",
        visaCategory: "IR-5",
      };

      const givenName =
        activeCandidate.name?.first || activeCandidate.fullName.split(" ")[0] || "";
      const surname =
        activeCandidate.name?.last || activeCandidate.fullName.split(" ").slice(1).join(" ") || "";
      const passportNumber = activeCandidate.passportNumber || "";
      const dateOfBirth = activeCandidate.dateOfBirth || "";
      const caseNumber = activeCandidate.caseNumber || "";

      expect(givenName).toBe("Muhammad");
      expect(surname).toBe("Ali");
      expect(passportNumber).toBe("PK9876543");
      expect(dateOfBirth).toBe("1962-05-15");
      expect(caseNumber).toBe("ISL2024123456");
    });
  });

  // ─── 4. Services Status Hub & Dashboard Scoping ──────────────────────────
  describe("4. Services Status Hub Filtering", () => {
    const mockServicesStatusData = {
      pccRequests: [
        {
          id: "pcc-1",
          candidate_id: "candidate-1",
          admin_notes: "[Candidate: candidate-1] Fatima Bibi",
          province: "Sindh",
          status: "completed",
        },
        {
          id: "pcc-2",
          candidate_id: "candidate-2",
          admin_notes: "[Candidate: candidate-2] Muhammad Ali",
          province: "Sindh",
          status: "in_progress",
        },
        {
          id: "pcc-legacy",
          province: "Sindh",
          status: "pending",
        },
      ],
      medicalAppointments: [
        {
          id: "med-1",
          candidate_id: "candidate-1",
          full_name: "Fatima Bibi",
          status: "confirmed",
        },
        {
          id: "med-2",
          candidate_id: "candidate-2",
          full_name: "Muhammad Ali",
          status: "pending",
        },
      ],
      translationDocuments: [
        {
          id: "tr-1",
          metadata: { candidate_id: "candidate-1" },
          status: "completed",
        },
        {
          id: "tr-2",
          metadata: { candidate_id: "candidate-2" },
          status: "in_review",
        },
      ],
    };

    const filterServicesStatus = (data: typeof mockServicesStatusData, candidateId: string) => {
      const pcc = data.pccRequests.filter((item: any) => {
        const directId = item.candidate_id;
        const notesTag = item.admin_notes?.includes(`[Candidate: ${candidateId}]`);
        if (directId) return directId === candidateId;
        if (notesTag) return true;
        if (candidateId === "candidate-1" && !directId && !item.admin_notes?.includes("[Candidate: ")) {
          return true;
        }
        return false;
      });

      const medical = data.medicalAppointments.filter((item: any) => {
        const directId = item.candidate_id;
        if (directId) return directId === candidateId;
        if (candidateId === "candidate-1" && !directId) return true;
        return false;
      });

      const translations = data.translationDocuments.filter((item: any) => {
        const metaId = item.metadata?.candidate_id;
        if (metaId) return metaId === candidateId;
        if (candidateId === "candidate-1" && !metaId) return true;
        return false;
      });

      return { pcc, medical, translations };
    };

    it("filters all service requests strictly for candidate-1 (including legacy)", () => {
      const filtered1 = filterServicesStatus(mockServicesStatusData, "candidate-1");

      expect(filtered1.pcc.map((x) => x.id)).toEqual(["pcc-1", "pcc-legacy"]);
      expect(filtered1.medical.map((x) => x.id)).toEqual(["med-1"]);
      expect(filtered1.translations.map((x) => x.id)).toEqual(["tr-1"]);
    });

    it("filters all service requests strictly for candidate-2", () => {
      const filtered2 = filterServicesStatus(mockServicesStatusData, "candidate-2");

      expect(filtered2.pcc.map((x) => x.id)).toEqual(["pcc-2"]);
      expect(filtered2.medical.map((x) => x.id)).toEqual(["med-2"]);
      expect(filtered2.translations.map((x) => x.id)).toEqual(["tr-2"]);
    });

    it("returns empty results for candidate with no requests filed", () => {
      const filtered3 = filterServicesStatus(mockServicesStatusData, "candidate-3");

      expect(filtered3.pcc).toHaveLength(0);
      expect(filtered3.medical).toHaveLength(0);
      expect(filtered3.translations).toHaveLength(0);
    });
  });
});
