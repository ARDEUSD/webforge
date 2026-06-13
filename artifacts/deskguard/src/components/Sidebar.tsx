import { Link, useLocation } from "wouter";
import { LayoutDashboard, Map, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library-map", label: "Library Map", icon: Map },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { isAdmin } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: api.getStats,
    refetchInterval: 10000,
  });

  const isActive = (href: string) =>
    href === "/dashboard"
      ? location === "/" || location === "/dashboard"
      : location.startsWith(href);

  return (
    <aside className="w-44 shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">DeskGuard</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Library Occupancy</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {mainNav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <div
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                isActive(href)
                  ? "bg-sidebar-accent text-white font-medium"
                  : "text-muted-foreground hover:text-white hover:bg-sidebar-accent"
              }`}
            >
              {isActive(href) && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r-full" />
              )}
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
              {label === "Library Map" && stats && (
                <span className="ml-auto text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-medium">
                  {stats.free}
                </span>
              )}
            </div>
          </Link>
        ))}

        {/* Admin Panel — only shown when logged in */}
        {isAdmin && (
          <Link href="/admin/panel">
            <div
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                isActive("/admin")
                  ? "bg-sidebar-accent text-white font-medium"
                  : "text-muted-foreground hover:text-white hover:bg-sidebar-accent"
              }`}
            >
              {isActive("/admin") && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r-full" />
              )}
              <Shield className="w-4 h-4 shrink-0" />
              <span>Admin Panel</span>
            </div>
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] text-muted-foreground">System Online</span>
        </div>
        {!isAdmin && (
          <Link href="/admin/login">
            <span className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer">
              Staff login
            </span>
          </Link>
        )}
        {isAdmin && (
          <p className="text-[10px] text-muted-foreground/50">v1.2.0 (Prototype)</p>
        )}
      </div>
    </aside>
  );
}
