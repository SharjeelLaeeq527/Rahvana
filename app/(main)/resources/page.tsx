import ResourcesContent, { ResourceTab } from "./ResourcesContent";

const RESOURCE_TABS: ResourceTab[] = ["toolbox", "guides", "services"];

const getResourceTab = (tab?: string | string[]): ResourceTab => {
  const value = Array.isArray(tab) ? tab[0] : tab;
  return RESOURCE_TABS.includes(value as ResourceTab) ? (value as ResourceTab) : "toolbox";
};

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const params = await searchParams;

  return <ResourcesContent initialTab={getResourceTab(params.tab)} />;
}
