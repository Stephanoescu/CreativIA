"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Image as ImageIcon, Users, Sparkles } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { name: "Documentos", href: "/dashboard/documents", icon: FileText },
  { name: "Galería AI", href: "/dashboard/gallery", icon: ImageIcon },
  { name: "Equipo", href: "/dashboard/team", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#1a1d27] border-r border-[#2e3347] flex flex-col h-full">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-[#2e3347]">
        <div className="flex items-center gap-3 text-white font-bold text-lg">
          <div className="w-8 h-8 bg-[#4257f8] rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          CreativIA
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#4257f8]/10 text-[#4257f8]"
                  : "text-[#8b92a9] hover:bg-[#252836] hover:text-[#f1f3f9]"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Storage Quota Dummy */}
      <div className="p-4 m-4 bg-[#252836] rounded-xl border border-[#2e3347]">
        <div className="text-xs font-medium text-[#8b92a9] mb-2">Plan Pro</div>
        <div className="w-full bg-[#1a1d27] rounded-full h-1.5 mb-1.5">
          <div className="bg-[#4257f8] h-1.5 rounded-full w-[45%]" />
        </div>
        <div className="text-xs text-[#8b92a9]">45% de cuota mensual usada</div>
      </div>
    </aside>
  );
}

