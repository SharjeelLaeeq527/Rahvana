// app/(auth)/layout.tsx
// Auth pages ka apna layout — header aur footer nahi hoga

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
