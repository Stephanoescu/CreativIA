"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Image as ImageIcon, Loader2, Search, Trash2 } from "lucide-react";
import { generateImageAction, deleteImageAction } from "@/presentation/actions/image.actions";
import type { Image } from "@/domain/entities/Image";

interface GalleryProps {
  initialImages: Image[];
  role: string;
}

export function GalleryView({ initialImages, role }: GalleryProps) {
  const router = useRouter();
  const [images, setImages] = useState<Image[]>(initialImages);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealism");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = true;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("style", style);
    
    const result = await generateImageAction(formData);
    
    if (result.success && result.image) {
      setImages([result.image, ...images]);
      setPrompt("");
      router.refresh();
    } else {
      setError(result.error || "Error al generar imagen");
    }
    
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta imagen?")) return;
    
    const result = await deleteImageAction(id);
    if (result.success) {
      setImages(images.filter(img => img.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Galería AI</h1>
          <p className="text-[#8b92a9]">Genera imágenes para tus campañas.</p>
        </div>
      </div>

      {canGenerate && (
        <form onSubmit={handleGenerate} className="glass-card p-6 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-4">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe la imagen que quieres generar..."
                className="input-field py-3 text-lg"
                disabled={loading}
              />
              <div className="flex items-center gap-4">
                <select 
                  value={style} 
                  onChange={(e) => setStyle(e.target.value)}
                  className="input-field w-auto py-2"
                  disabled={loading}
                >
                  <option value="photorealism">Fotorealismo</option>
                  <option value="digital-art">Arte Digital</option>
                  <option value="anime">Anime</option>
                  <option value="oil-painting">Pintura al óleo</option>
                  <option value="watercolor">Acuarela</option>
                  <option value="sketch">Boceto</option>
                </select>
                <span className="text-sm text-[#8b92a9]">
                  💡 Usando {process.env.NEXT_PUBLIC_AI_PROVIDER === "real" ? "AWS Bedrock SDXL" : "Mock Service ($0)"}
                </span>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !prompt.trim()}
              className="btn-primary py-3 px-8 h-full"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generar
                </>
              )}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </form>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.length === 0 ? (
          <div className="col-span-full py-12 text-center flex flex-col items-center glass-card">
            <div className="w-16 h-16 bg-[#252836] rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-[#8b92a9]" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No hay imágenes</h3>
            <p className="text-[#8b92a9] max-w-sm">
              Genera tu primera imagen con IA usando el panel superior.
            </p>
          </div>
        ) : (
          images.map((img) => (
            <div key={img.id} className="glass-card overflow-hidden group">
              <div className="aspect-square relative bg-[#252836]">
                {img.status === "completed" && img.storageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={img.storageUrl} 
                    alt={img.prompt}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  />
                ) : img.status === "failed" ? (
                  <div className="w-full h-full flex items-center justify-center text-red-400 text-sm p-4 text-center border border-red-500/20 bg-red-500/5">
                    Falló: {img.moderationFlags?.length ? "Bloqueado por moderación" : "Error en generación"}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#4257f8] animate-spin" />
                  </div>
                )}
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                   <button 
                     onClick={() => img.storageUrl && window.open(img.storageUrl, '_blank')}
                     className="btn-secondary"
                   >
                     <Search className="w-4 h-4" />
                   </button>
                   {canGenerate && (
                     <button 
                       onClick={() => handleDelete(img.id)}
                       className="btn-secondary text-red-400 hover:text-red-300"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   )}
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-white line-clamp-2 mb-2" title={img.prompt}>
                  {img.prompt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="badge bg-[#252836] text-[#8b92a9] border-[#2e3347]">
                    {img.style}
                  </span>
                  <span className="text-[10px] text-[#8b92a9]">
                    {new Date(img.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
