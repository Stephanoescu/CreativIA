import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { SupabaseUserRepository } from "@/infrastructure/repositories/SupabaseUserRepository";
import { Mail, Building2 } from "lucide-react";

export default async function TeamPage() {
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

  const userRepo = new SupabaseUserRepository(supabase);
  const users = await userRepo.findByOrganization(profile.organization_id);

  const { data: org } = await supabase
    .from("organizations")
    .select("name, plan, max_members")
    .eq("id", profile.organization_id)
    .single();

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/10 text-red-400 border-red-500/20",
    approver: "bg-green-500/10 text-green-400 border-green-500/20",
    designer: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    writer: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  
  const roleLabels: Record<string, string> = {
    admin: "Admin",
    approver: "Aprobador",
    designer: "Diseñador",
    writer: "Redactor",
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Equipo</h1>
          <p className="text-[#8b92a9]">Gestiona los miembros de tu organización.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#4257f8]/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[#4257f8]" />
          </div>
          <div>
            <p className="text-sm text-[#8b92a9] mb-1">Organización</p>
            <p className="font-semibold text-white">{org?.name}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold text-green-400 uppercase">{org?.plan}</span>
          </div>
          <div>
            <p className="text-sm text-[#8b92a9] mb-1">Plan actual</p>
            <p className="font-semibold text-white">{users.length} / {org?.max_members} miembros</p>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#2e3347] bg-[#1a1d27]/50">
              <th className="px-6 py-4 text-sm font-medium text-[#8b92a9]">Usuario</th>
              <th className="px-6 py-4 text-sm font-medium text-[#8b92a9]">Email</th>
              <th className="px-6 py-4 text-sm font-medium text-[#8b92a9]">Rol</th>
              <th className="px-6 py-4 text-sm font-medium text-[#8b92a9]">Estado</th>
            </tr>
          </thead>
          <tbody>
            {users.map((member) => (
              <tr key={member.id} className="border-b border-[#2e3347] hover:bg-[#252836]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#252836] border border-[#2e3347] flex items-center justify-center text-sm font-medium text-white">
                      {member.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-white">
                      {member.fullName}
                      {member.id === user.id && <span className="ml-2 text-xs text-[#8b92a9]">(Tú)</span>}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[#8b92a9] text-sm">
                    <Mail className="w-4 h-4" />
                    {member.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`badge border ${roleColors[member.role] || roleColors.writer}`}>
                    {roleLabels[member.role] || member.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="badge bg-[#252836] text-[#8b92a9] border-[#2e3347]">
                    {member.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

