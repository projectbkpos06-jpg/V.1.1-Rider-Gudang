import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "react-router-dom";
import { adminMenuItems, riderMenuItems } from "./AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

import { MoreMenu } from "./MoreMenu";

export function BottomNav() {
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const menuItems = isAdmin 
    ? [
        adminMenuItems[0], // Dashboard
        adminMenuItems[1], // Produk
        adminMenuItems[2], // Gudang
        adminMenuItems[5], // Laporan
      ]
    : [
        riderMenuItems[0], // Dashboard
        riderMenuItems[1], // POS
        riderMenuItems[2], // Produk Saya
        riderMenuItems[3], // Pengaturan
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center flex-1 h-full px-2 gap-1",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.title}</span>
            </NavLink>
          );
        })}
        {isAdmin && <MoreMenu />}
      </div>
    </nav>
  );
}