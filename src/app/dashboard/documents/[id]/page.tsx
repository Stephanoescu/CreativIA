import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { SupabaseDocumentRepository } from "@/infrastructure/repositories/SupabaseDocumentRepository";
import { DocumentEditor } from "@/presentation/components/document/DocumentEditor";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const isNew = resolvedParams.id === "new";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createSupabaseServerClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let initialDocument = undefined;

  if (!isNew) {
    const docRepo = new SupabaseDocumentRepository(supabase);
    const doc = await docRepo.findById(resolvedParams.id);
    if (!doc) {
      redirect("/dashboard/documents");
    }
    initialDocument = doc;
  } else {
    // Si es nuevo y no es escritor o admin, lo echamos
    if (profile.role !== "writer" && profile.role !== "admin") {
      redirect("/dashboard/documents");
    }
  }

  return (
    <div className="h-full">
      <DocumentEditor 
        initialDocument={initialDocument} 
        role={profile.role} 
      />
    </div>
  );
}

