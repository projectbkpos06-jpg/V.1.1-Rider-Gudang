import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { adminMenuItems, riderMenuItems } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function MoreMenu() {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  // Filter menu yang tidak ada di bottom nav utama
  const extraMenus = isAdmin 
    ? [
        adminMenuItems[3], // Distribusi
        adminMenuItems[4], // Kategori
        adminMenuItems[6], // Pengaturan
      ]
    : [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex flex-col items-center justify-center flex-1 h-full px-2 gap-1 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-xs font-medium">More</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[60vh]">
        <div className="pt-6">
          <h3 className="mb-4 text-lg font-semibold">Menu Lainnya</h3>
          <nav className="space-y-2">
            {extraMenus.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.url}
                  to={item.url}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  {item.title}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}