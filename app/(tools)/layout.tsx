import { ToolsGuard } from "./ToolsGuard";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <ToolsGuard>{children}</ToolsGuard>;
}
