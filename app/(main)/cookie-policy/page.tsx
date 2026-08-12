import PolicyPage from "@/components/policy/PolicyPage";
import { cookiePolicyData } from "@/lib/policies/cookie-policy-data";

export default function CookiePolicy() {
  return <PolicyPage policy={cookiePolicyData} />;
}
