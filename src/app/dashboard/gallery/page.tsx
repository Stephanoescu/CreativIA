import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { SupabaseImageRepository } from "@/infrastructure/repositories/SupabaseImageRepository";
import { GalleryView } from "@/presentation/components/gallery/GalleryView";

export default async function GalleryPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createSupabaseServerClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  const imageRepo = new SupabaseImageRepository(supabase);
  const result = await imageRepo.findByOrganization(profile.organization_id, {
    page: 1,
    pageSize: 50,
  });

  return (
    <GalleryView 
      initialImages={result.data} 
      role={profile.role} 
    />
  );
}
