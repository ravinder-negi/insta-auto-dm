import { createClient } from "@/lib/supabase/server";
import { AuthLayout } from "../AuthLayout";
import { ResetPasswordForm } from "./ResetPasswordForm";

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
