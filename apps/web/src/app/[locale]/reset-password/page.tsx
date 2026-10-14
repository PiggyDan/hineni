import { PasswordRecovery } from "@/components/auth/password-recovery";
export { generateMetadata } from "../forgot-password/page";
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return <div className="container-page flex min-h-[70vh] items-center py-16"><PasswordRecovery token={token} invalid={!token || !!error} /></div>;
}
