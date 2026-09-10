import { redirect } from "next/navigation";

export default function DashboardIndex() {
  // Redirigir siempre a la sección principal de documentos por defecto
  redirect("/dashboard/documents");
}

