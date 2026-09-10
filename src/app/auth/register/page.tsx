"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, Lock, User, Building2, AlertCircle } from "lucide-react";
import { registerAction } from "@/presentation/actions/auth.actions";

// ID de la organización demo creada en el seed SQL
const DEMO_ORG_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    formData.set("organizationId", DEMO_ORG_ID);
    const result = await registerAction(formData);
    if (!result.success) {
      setError(result.error ?? "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#4257f8]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#4257f8] rounded-2xl mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CreativIA</h1>
          <p className="text-[#8b92a9] mt-1">Crea tu cuenta</p>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Registro</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-[#8b92a9] mb-1.5">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b92a9]" />
                <input
                  name="fullName"
                  type="text"
                  required
                  placeholder="Ana García"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#8b92a9] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b92a9]" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#8b92a9] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b92a9]" />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-[#8b92a9] mb-1.5">
                Rol en el equipo
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b92a9]" />
                <select name="role" className="input-field pl-10 appearance-none">
                  <option value="writer">✍️ Redactor</option>
                  <option value="designer">🎨 Diseñador</option>
                  <option value="approver">✅ Aprobador</option>
                  <option value="admin">⚙️ Administrador</option>
                </select>
              </div>
            </div>

            <div className="bg-[#4257f8]/10 border border-[#4257f8]/30 rounded-lg px-3 py-2 text-xs text-[#8b92a9]">
              🏢 Te unirás a la organización <span className="text-white font-medium">CreativIA Demo</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#8b92a9] mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/auth/login"
              className="text-[#4257f8] hover:text-[#6380fd] font-medium transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
