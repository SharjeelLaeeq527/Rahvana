// lib/journey/NurtureService.ts
// Provides contextual educational content ("Nudges") for waiting periods.
// Based on IR-1 Roadmap Feature Document §12.2 and §3.1.
// ============================================================

export interface NurtureNugget {
  title: string;
  content: string;
  cta_label?: string;
  cta_link?: string;
  chapter_key: string;
}

const WAIT_NUGGETS: Record<string, NurtureNugget[]> = {
  "chapter_1": [
    {
      title: "While you wait for your Receipt Notice (I-797C)...",
      content: "USCIS typically takes 2-4 weeks to issue a receipt notice. During this time, they are performing initial security checks and intake validation.",
      cta_label: "Learn about Processing Times",
      cta_link: "https://uscis.gov/casestatus",
      chapter_key: "chapter_1"
    },
    {
      title: "Preparation Tip: Civil Documents",
      content: "Chapter II will require original civil documents (birth certs, marriage certs). Start identifying where your originals are kept today to save 1-2 weeks later.",
      chapter_key: "chapter_1"
    }
  ],
  "chapter_2": [
    {
      title: "NVC Fee Posting Delay",
      content: "NVC payments can take up to 3 business days to show as 'Paid' in CEAC. Only after this change can you start the DS-260 application.",
      chapter_key: "chapter_2"
    },
    {
      title: "Scanning Guideline Reminder",
      content: "Ensure all scans are under 2MB and in PDF format. Use the Rahvana PDF Processing tool to optimize your files.",
      cta_label: "Open PDF Tool",
      cta_link: "/tools/pdf-processing",
      chapter_key: "chapter_2"
    }
  ],
  "chapter_3": [
    {
      title: "Medical Exam Expiry",
      content: "Visa medical exams are usually valid for 6 months. Do not book your medical too early if your interview date is not yet confirmed.",
      chapter_key: "chapter_3"
    },
    {
      title: "Interview Confidence",
      content: "The consular interview is about verifying the bona-fide nature of your relationship. Review your I-130 answers before your appointment.",
      cta_label: "Review I-130 Answers",
      cta_link: "/journey/step/i130-review",
      chapter_key: "chapter_3"
    }
  ]
};

export class NurtureService {
  /**
   * Get nuggets relevant to the current chapter and state
   */
  getNuggetsForChapter(chapterKey: string): NurtureNugget[] {
    // We can expand this to filter by specific wait-state later
    return WAIT_NUGGETS[chapterKey] || [];
  }

  /**
   * Get a single random tip for a quick dashboard widget
   */
  getRandomTip(): string {
    const allTips = Object.values(WAIT_NUGGETS).flat();
    const randomIndex = Math.floor(Math.random() * allTips.length);
    return allTips[randomIndex].content;
  }
}
