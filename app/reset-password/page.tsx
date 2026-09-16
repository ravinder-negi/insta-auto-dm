import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <ResetPasswordForm hasSession={!!user} />
    </div>
  );
}
