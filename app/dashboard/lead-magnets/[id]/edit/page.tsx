import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeftIcon } from "../../../components/icons";
import { PageHeader } from "../../../components/PageHeader";
import { LeadMagnetForm } from "../../LeadMagnetForm";
import { updateLeadMagnet } from "../../actions";
import type { LeadMagnet } from "@/lib/types";

export default async function EditLeadMagnetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: magnet } = await supabase
    .from("lead_magnets")
    .select("id, title, description, file_url, file_name, is_active")
    .eq("id", id)
    .maybeSingle<
      Pick<LeadMagnet, "id" | "title" | "description" | "file_url" | "file_name" | "is_active">
    >();

  if (!magnet) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <Link
          href="/dashboard/lead-magnets"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to lead magnets
        </Link>
        <PageHeader
          eyebrow="Edit lead magnet"
          title={magnet.title}
          description="Update this lead magnet's details or file."
        />
      </div>

      <LeadMagnetForm
        action={updateLeadMagnet.bind(null, id)}
        initialValues={{
          title: magnet.title,
          description: magnet.description,
          file_url: magnet.file_url,
          file_name: magnet.file_name,
          is_active: magnet.is_active,
        }}
        submitLabel="Save changes"
        userId={user.id}
      />
    </div>
  );
}
