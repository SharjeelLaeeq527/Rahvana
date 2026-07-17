import { ScenarioFlags } from "./types";

export interface FlagOption {
  label: string;
  value: string | boolean;
}

export interface FlagField {
  key: keyof ScenarioFlags;
  type: "checkbox" | "radio";
  label: string;
  description?: string;
  options?: FlagOption[]; // Used for radio fields (e.g. relationship types)
  defaultValue?: any;
  showIf?: (flags: ScenarioFlags) => boolean; // For conditional child flags
}

export interface FlagGroup {
  groupName: string;
  fields: FlagField[];
}

export const VISA_FLAG_REGISTRY: Record<string, FlagGroup[]> = {
  "IR-1": [
    {
      groupName: "Marriage History",
      fields: [
        {
          key: "prior_marriage_petitioner",
          type: "checkbox",
          label: "Prior Marriage (Petitioner)",
          description: "Petitioner was previously married"
        },
        {
          key: "prior_marriage_beneficiary",
          type: "checkbox",
          label: "Prior Marriage (Beneficiary)",
          description: "Beneficiary was previously married"
        }
      ]
    },
    {
      groupName: "Additional Info",
      fields: [
        {
          key: "name_change_any_party",
          type: "checkbox",
          label: "Name Change",
          description: "Any party changed their name"
        }
      ]
    }
  ],
  "CR-1": [
    {
      groupName: "Marriage History",
      fields: [
        {
          key: "prior_marriage_petitioner",
          type: "checkbox",
          label: "Prior Marriage (Petitioner)",
          description: "Petitioner was previously married"
        },
        {
          key: "prior_marriage_beneficiary",
          type: "checkbox",
          label: "Prior Marriage (Beneficiary)",
          description: "Beneficiary was previously married"
        }
      ]
    },
    {
      groupName: "Additional Info",
      fields: [
        {
          key: "name_change_any_party",
          type: "checkbox",
          label: "Name Change",
          description: "Any party changed their name"
        }
      ]
    }
  ],
  "IR-2": [
    {
      groupName: "Child Information",
      fields: [
        {
          key: "child_adopted",
          type: "checkbox",
          label: "Adopted Child",
          description: "Child is adopted"
        },
        {
          key: "child_stepchild",
          type: "checkbox",
          label: "Stepchild",
          description: "Child is a stepchild"
        }
      ]
    }
  ],
  "CR-2": [
    {
      groupName: "Child Information",
      fields: [
        {
          key: "child_adopted",
          type: "checkbox",
          label: "Adopted Child",
          description: "Child is adopted"
        },
        {
          key: "child_stepchild",
          type: "checkbox",
          label: "Stepchild",
          description: "Child is a stepchild"
        }
      ]
    }
  ],
  "IR-5": [
    {
      groupName: "Petitioner-Parent Relationship Type",
      fields: [
        {
          key: "relationship_type",
          type: "radio",
          label: "Petitioner-Parent Relationship Type",
          options: [
            { label: "Biological mother — the petitioner's birth mother", value: "biological_mother" },
            { label: "Biological father — parents were legally married to each other", value: "father_married" },
            { label: "Biological father — parents were never married to each other", value: "father_unmarried" },
            { label: "Stepparent — a stepfather or stepmother", value: "stepparent" },
            { label: "Adoptive parent", value: "adoptive" },
          ]
        }
      ]
    },
    {
      groupName: "Additional Situations",
      fields: [
        {
          key: "stepparent_bio_parent_prior_marriages",
          type: "checkbox",
          label: "Biological Parent Prior Marriages",
          description: "The biological parent who married the stepparent had prior marriages.",
          showIf: (flags) => flags.relationship_type === "stepparent"
        },
        {
          key: "name_discrepancy",
          type: "checkbox",
          label: "Name or Identity Discrepancies",
          description: "There are name variations or spelling differences across the records."
        },
        {
          key: "primary_record_available",
          type: "checkbox",
          label: "Primary Birth Record Unavailable",
          description: "The primary birth certificate is unavailable, late-registered, or has inconsistencies.",
          defaultValue: true
        },
        {
          key: "parent_prior_marriages",
          type: "checkbox",
          label: "Parent's Prior Marriages",
          description: "The parent has prior marriages, divorces, or is widowed."
        }
      ]
    }
  ]
};
