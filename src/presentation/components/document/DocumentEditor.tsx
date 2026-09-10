"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Send, CheckCircle, XCircle, Sparkles, History } from "lucide-react";
import { 
  saveDocumentAction, 
  submitForReviewAction,
  approveRejectDocumentAction 
} from "@/presentation/actions/document.actions";
import { editContentAction } from "@/presentation/actions/ai.actions";
import type { Document } from "@/domain/entities/Document";

interface EditorProps {
  initialDocument?: Document;
  role: string;
}

export function DocumentEditor({ initialDocument, role }: EditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialDocument?.title || "");
  const [content, setContent] = useState(initialDocument?.content || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function handleAiAction(action: "summarize" | "expand" | "fix-grammar" | "generate-variations") {
    if (isNew || !initialDocument || !content.trim()) return;
    setAiLoading(true);
    setError(null);

    // Auto-save first
    await handleSave();

    const formData = new FormData();
    formData.append("documentId", initialDocument.id);
    formData.append("text", content); // Enviamos todo el contenido por ahora
    formData.append("action", action);

    const result = await editContentAction(formData);
    if (result.success && result.result) {
      setContent(result.result.generatedText);
    } else {
      setError(result.error ?? "Error al procesar con IA");
    }
    setAiLoading(false);
  }

  const isNew = !initialDocument;
  const status = initialDocument?.status || "draft";
  const canEdit = status === "draft" || status === "rejected";
  const canApprove = status === "in_review";

  async function handleSave() {
    if (!title.trim()) {
      setError("Debes ingresar un título para guardar.");
      return;
    }
    if (!content.trim()) {
      setError("El documento no puede estar vacío.");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    if (!isNew) formData.append("documentId", initialDocument.id);
    formData.append("title", title);
    formData.append("content", content);
    formData.append("tags", JSON.stringify([]));

    const result = await saveDocumentAction(formData);
    
    if (result.success && result.document) {
      if (isNew) {
        router.push(`/dashboard/documents/${result.document.id}`);
      } else {
        router.refresh();
      }
    } else {
      setError(result.error || "Error al guardar");
    }
    setLoading(false);
  }

  async function handleSubmitReview() {
    if (isNew || !initialDocument) return;
    setLoading(true);
    
    // Auto-save first
    await handleSave();
    
    const formData = new FormData();
    formData.append("documentId", initialDocument.id);
    // En un entorno real, seleccionaríamos a quién enviarlo. Aquí enviamos a un UUID dummy.
    formData.append("approverId", "00000000-0000-0000-0000-000000000000"); 
    
    const result = await submitForReviewAction(formData);
    if (!result.success) setError(result.error ?? "Error al enviar a revisión");
    setLoading(false);
    router.refresh();
  }

  async function handleDecision(decision: "approved" | "rejected") {
    if (isNew || !initialDocument) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append("documentId", initialDocument.id);
    formData.append("decision", decision);
    
    const result = await approveRejectDocumentAction(formData);
    if (!result.success) setError(result.error ?? "Error al procesar decisión");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)]">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[#1a1d27] border-b border-[#2e3347] p-4 rounded-t-xl gap-4 md:gap-0">
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
          <button 
            onClick={() => router.push("/dashboard/documents")}
            className="text-[#8b92a9] hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
            placeholder="Título del documento..."
            className="bg-transparent text-white font-bold text-base md:text-lg focus:outline-none placeholder:text-[#8b92a9] flex-1 min-w-0"
          />

          {!isNew && (
            <span className={`badge border shrink-0 hidden md:inline-flex ${
              status === 'draft' ? 'bg-[#252836] text-[#8b92a9] border-[#2e3347]' :
              status === 'in_review' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
              status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
              'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {status}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto justify-end">
          {error && <span className="text-red-400 text-xs md:text-sm w-full md:w-auto text-right">{error}</span>}
          
          {canEdit && (
            <>
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="btn-secondary text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2"
              >
                <Save className="w-4 h-4 hidden md:block" />
                Guardar
              </button>
              
              {!isNew && (
                <button 
                  onClick={handleSubmitReview}
                  disabled={loading}
                  className="btn-primary text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2"
                >
                  <Send className="w-4 h-4 hidden md:block" />
                  Enviar
                </button>
              )}
            </>
          )}

          {canApprove && (
            <>
              <button 
                onClick={() => handleDecision("rejected")}
                disabled={loading}
                className="btn-secondary text-red-400 hover:text-red-300 hover:border-red-400/50 text-xs md:text-sm px-2 py-1.5"
              >
                <XCircle className="w-4 h-4" />
                Rechazar
              </button>
              <button 
                onClick={() => handleDecision("approved")}
                disabled={loading}
                className="btn-primary bg-green-600 hover:bg-green-500 text-xs md:text-sm px-2 py-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                Aprobar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden bg-[#0f1117] border border-t-0 border-[#2e3347] rounded-b-xl">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!canEdit}
          placeholder="Comienza a escribir aquí..."
          className="flex-1 w-full min-h-[300px] md:min-h-0 bg-transparent text-[#f1f3f9] p-4 md:p-8 resize-none focus:outline-none"
        />

        {/* AI Sidebar */}
        {canEdit && (
          <div className="w-full md:w-72 bg-[#1a1d27] border-t md:border-t-0 md:border-l border-[#2e3347] p-4 flex flex-col gap-4 shrink-0">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4257f8]" />
              Asistente IA
            </h3>
            <p className="text-sm text-[#8b92a9] hidden md:block">
              {isNew ? "Guarda el documento primero para usar la IA." : "Usa la IA para mejorar tu texto."}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2 mt-2 md:mt-4">
              <button 
                onClick={() => handleAiAction("summarize")}
                className="btn-secondary w-full justify-center md:justify-start text-xs md:text-sm" 
                disabled={aiLoading || isNew}
              >
                {aiLoading ? "..." : "Resumir"}
              </button>
              <button 
                onClick={() => handleAiAction("expand")}
                className="btn-secondary w-full justify-center md:justify-start text-xs md:text-sm" 
                disabled={aiLoading || isNew}
              >
                {aiLoading ? "..." : "Expandir"}
              </button>
              <button 
                onClick={() => handleAiAction("fix-grammar")}
                className="btn-secondary w-full justify-center md:justify-start text-xs md:text-sm" 
                disabled={aiLoading || isNew}
              >
                {aiLoading ? "..." : "Corregir"}
              </button>
              <button 
                onClick={() => handleAiAction("generate-variations")}
                className="btn-secondary w-full justify-center md:justify-start text-xs md:text-sm" 
                disabled={aiLoading || isNew}
              >
                {aiLoading ? "..." : "Variaciones"}
              </button>
            </div>
            
            <div className="mt-auto border-t border-[#2e3347] pt-4 hidden md:block">
               <button className="btn-ghost w-full justify-start text-sm">
                <History className="w-4 h-4" />
                Historial
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
