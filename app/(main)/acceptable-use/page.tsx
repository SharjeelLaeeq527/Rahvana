import PolicyPage from "@/components/policy/PolicyPage";
import { acceptableUsePolicyData } from "@/lib/policies/acceptable-use-data";

export default function AcceptableUse() {
  return <PolicyPage policy={acceptableUsePolicyData} />;
}
