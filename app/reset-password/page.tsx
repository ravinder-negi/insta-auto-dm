import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { BrandingPanel } from "../login/BrandingPanel";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <div className="order-1 flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 sm:py-16 lg:order-2 dark:bg-black">
        <ResetPasswordForm hasSession={!!user} />
      </div>
      <div className="order-2 lg:order-1 lg:flex-1">
        <BrandingPanel />
      </div>
    </div>
  );
}
