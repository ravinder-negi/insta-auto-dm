import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-4 text-center dark:bg-black">
      <h1 className="max-w-lg text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Auto-DM Instagram commenters who say the magic word
      </h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Connect an Instagram account, set a keyword-to-DM rule, and every
        matching comment gets an instant private reply.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Get started
      </Link>
    </div>
  );
}
