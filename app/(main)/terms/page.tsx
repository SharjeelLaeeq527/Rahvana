import PolicyPage from "@/components/policy/PolicyPage";
import { termsData } from "@/lib/policies/terms-data";

export default function TermsOfService() {
  return <PolicyPage policy={termsData} />;
}
