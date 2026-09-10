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
    <aside className="fixed bottom-0 w-full md:relative md:w-64 bg-[#1a1d27] border-t md:border-t-0 md:border-r border-[#2e3347] flex flex-row md:flex-col h-16 md:h-full z-50 shrink-0">
      {/* Brand */}
      <div className="hidden md:flex h-16 items-center px-6 border-b border-[#2e3347]">
        <div className="flex items-center gap-3 text-white font-bold text-lg">
          <div className="w-8 h-8 bg-[#4257f8] rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          CreativIA
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-row md:flex-col justify-around md:justify-start py-0 md:py-6 px-2 md:px-4 space-y-0 md:space-y-1 items-center md:items-stretch">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-[10px] md:text-sm font-medium transition-colors w-full md:w-auto",
                isActive
                  ? "text-[#4257f8] md:bg-[#4257f8]/10"
                  : "text-[#8b92a9] hover:bg-[#252836] hover:text-[#f1f3f9]"
              )}
            >
              <Icon className="w-5 h-5 md:w-5 md:h-5 mb-0.5 md:mb-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Storage Quota Dummy */}
      <div className="hidden md:block p-4 m-4 bg-[#252836] rounded-xl border border-[#2e3347]">
        <div className="text-xs font-medium text-[#8b92a9] mb-2">Plan Pro</div>
        <div className="w-full bg-[#1a1d27] rounded-full h-1.5 mb-1.5">
          <div className="bg-[#4257f8] h-1.5 rounded-full w-[45%]" />
        </div>
        <div className="text-xs text-[#8b92a9]">45% de cuota mensual usada</div>
      </div>
    </aside>
  );
}

