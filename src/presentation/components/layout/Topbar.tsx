"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import { logoutAction } from "@/presentation/actions/auth.actions";

interface TopbarProps {
  user: {
    fullName: string;
    role: string;
    email: string;
  };
}

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

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="h-16 bg-[#1a1d27] border-b border-[#2e3347] flex items-center justify-between px-8">
      {/* Search / Breadcrumbs space */}
      <div className="flex-1" />

      {/* User Actions */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#252836] border border-[#2e3347] flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-[#8b92a9]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#f1f3f9] leading-none mb-1">
              {user.fullName}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  roleColors[user.role] || roleColors.writer
                }`}
              >
                {roleLabels[user.role] || user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-[#2e3347]" />

        <button
          onClick={() => logoutAction()}
          className="text-[#8b92a9] hover:text-white transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

