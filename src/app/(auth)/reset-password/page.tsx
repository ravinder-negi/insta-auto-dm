import { createClient } from "@/lib/supabase/server";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AuthLayout>
      <ResetPasswordForm hasSession={!!user} />
    </AuthLayout>
  );
}
