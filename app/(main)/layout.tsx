import { ProtectedApp } from "@/components/protected-app";

export default function MainGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedApp>{children}</ProtectedApp>;
}
