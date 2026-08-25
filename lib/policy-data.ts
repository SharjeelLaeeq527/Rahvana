export interface PolicySection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface PolicyData {
  slug: string;
  badge: string;
  title: string;
  description: string;
  effectiveDate: string;
  website: string;
  sections: PolicySection[];
  importantNotice?: {
    icon: string;
    text: string;
  };
}
