import PolicyPage from "@/components/policy/PolicyPage";
import { privacyPolicyData } from "@/lib/policies/privacy-policy-data";

export default function PrivacyPolicy() {
  return <PolicyPage policy={privacyPolicyData} />;
}
