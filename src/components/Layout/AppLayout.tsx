import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {!isMobile && <AppSidebar />}
        <main className="flex-1 bg-background">
          <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-[100vw] overflow-x-hidden">
            <div className="md:hidden mb-4">
              <h1 className="text-2xl font-bold">{window.location.pathname.split('/')[1] || 'Dashboard'}</h1>
            </div>
            {children}
          </div>
          <BottomNav />
        </main>
      </div>
    </SidebarProvider>
  );
}
