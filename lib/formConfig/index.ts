// lib/formConfig/index.ts

import * as i130 from "./i130";
import * as i864 from "./i864";
import * as i130a from "./i130a";
import * as i129f from "./i129f";
import * as i912 from "./i912";
import * as i864a from "./i864a";
import * as i864ez from "./i864ez";
import * as i693 from "./i693";
import * as ds260 from "./ds260";
import * as i485 from "./i485";
import * as g1450 from "./g1450";
import * as g1650 from "./g1650";
import * as g1651 from "./g1651";

import type { FormConfig } from "./types"; // import your FormConfig type

// Define the type for the configs object
const configs: Record<string, FormConfig> = {
  i130,
  i864,
  i130a,
  i129f,
  i912,
  i864a,
  i864ez,
  i693,
  ds260,
  i485,
  g1450,
  g1650,
  g1651,
};

// Function to get the form config based on the form code
export const getFormConfig = (formCode: string): FormConfig | null => {
  const normalized = formCode.toLowerCase().replace(/[^a-z0-9]/g, "");
  return configs[normalized] || null;
};
