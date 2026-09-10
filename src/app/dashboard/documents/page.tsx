import Link from "next/link";
import { Plus, FileText, Search, Clock, Tag } from "lucide-react";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { SupabaseDocumentRepository } from "@/infrastructure/repositories/SupabaseDocumentRepository";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default async function DocumentsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createSupabaseServerClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  const docRepo = new SupabaseDocumentRepository(supabase);
  const result = await docRepo.findByOrganization(profile.organization_id, {
    page: 1,
    pageSize: 50,
  });

  const statusColors: Record<string, string> = {
    draft: "bg-[#252836] text-[#8b92a9] border-[#2e3347]",
    in_review: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    archived: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  const statusLabels: Record<string, string> = {
    draft: "Borrador",
    in_review: "En Revisión",
    approved: "Aprobado",
    rejected: "Rechazado",
    archived: "Archivado",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Documentos</h1>
          <p className="text-[#8b92a9]">Gestiona y crea contenido para tus campañas.</p>
        </div>

        <Link href="/dashboard/documents/new" className="btn-primary">
          <Plus className="w-5 h-5" />
          Nuevo Documento
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b92a9]" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* List */}
      <div className="glass-card overflow-hidden">
        {result.data.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#252836] rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[#8b92a9]" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No hay documentos</h3>
            <p className="text-[#8b92a9] max-w-sm mb-6">
              Aún no has creado ningún documento. Empieza a generar contenido con IA.
            </p>
            {(profile.role === "writer" || profile.role === "admin") && (
              <Link href="/dashboard/documents/new" className="btn-primary">
                <Plus className="w-5 h-5" />
                Crear el primero
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2e3347] bg-[#1a1d27]/50">
                <th className="px-6 py-4 text-sm font-medium text-[#8b92a9]">Título</th>
                <th className="px-6 py-4 text-sm font-medium text-[#8b92a9]">Estado</th>
                <th className="px-6 py-4 text-sm font-medium text-[#8b92a9]">Etiquetas</th>
                <th className="px-6 py-4 text-sm font-medium text-[#8b92a9]">Última edición</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-[#2e3347] hover:bg-[#252836]/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/documents/${doc.id}`}
                      className="flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#252836] flex items-center justify-center group-hover:bg-[#4257f8]/10 transition-colors">
                        <FileText className="w-5 h-5 text-[#8b92a9] group-hover:text-[#4257f8] transition-colors" />
                      </div>
                      <span className="font-medium text-white group-hover:text-[#4257f8] transition-colors">
                        {doc.title}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`badge border ${
                        statusColors[doc.status] || statusColors.draft
                      }`}
                    >
                      {statusLabels[doc.status] || doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {doc.tags.slice(0, 2).map((tag: string) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 text-xs text-[#8b92a9] bg-[#252836] px-2 py-1 rounded-md"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 2 && (
                        <span className="text-xs text-[#8b92a9] bg-[#252836] px-2 py-1 rounded-md">
                          +{doc.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-[#8b92a9]">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(doc.updatedAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
