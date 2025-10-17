import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { adminMenuItems, riderMenuItems } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function MoreMenu() {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Filter menu yang tidak ada di bottom nav utama
  const extraMenus = isAdmin 
    ? [
        adminMenuItems[3], // Distribusi
        adminMenuItems[4], // Kategori
        adminMenuItems[6], // Pengaturan
      ]
    : [
        riderMenuItems[2], // Setting untuk rider
      ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
      setOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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

            {/* Logout Button */}
            <button
              onClick={() => {
                handleLogout();
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Keluar
            </button>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}