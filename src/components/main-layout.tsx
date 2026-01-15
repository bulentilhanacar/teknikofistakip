
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calculator,
  FileSignature,
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Gavel,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { SiteHeader } from "./site-header";
import { useProject } from "@/context/project-context";
import { FolderKanban as ProjectIcon } from "lucide-react";

function ProjectNav() {
  const pathname = usePathname();
  const { selectedProject } = useProject();

  const projectMenuItems = [
    { href: "/", label: "Finansal Özet", icon: LayoutDashboard },
    { href: "/contracts", label: "Sözleşme Yönetimi", icon: FileSignature },
    { href: "/progress-payments", label: "Hakediş Hesaplama", icon: Calculator },
    { href: "/progress-tracking", label: "Hakediş Takip", icon: ClipboardList },
    { href: "/deductions", label: "Kesinti Yönetimi", icon: Gavel },
  ];

  if (!selectedProject) {
    return (
        <div className="p-4 text-sm text-sidebar-foreground/80">
            Proje menüsü yükleniyor...
        </div>
    )
  }

  return (
    <SidebarMenu>
      {projectMenuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function AppContent({ children }: { children: React.ReactNode }) {
  const { selectedProject, loading } = useProject();
  
  const renderContent = () => {
    if (loading) {
        return (
             <div className="flex flex-col items-center justify-center h-screen text-muted-foreground text-center">
                <ProjectIcon className="w-16 h-16 mb-4 animate-pulse" />
                <p className="text-lg">Proje verileri yükleniyor, lütfen bekleyin...</p>
            </div>
        )
    }

    return <main className="flex-1 p-4 sm:p-6">{children}</main>;
  };

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader>
          <Link
            href="/"
            className="flex items-center gap-2 font-headline text-lg font-semibold text-sidebar-foreground"
          >
            <Building2 className="h-6 w-6 text-primary" />
            <span className="truncate">İnşaat Takip</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-2 group-data-[collapsible=icon]:hidden">
             <p className="text-sm font-medium text-sidebar-foreground/80">{selectedProject?.name || 'Proje Yükleniyor...'}</p>
          </div>
          <ProjectNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <SiteHeader />
        {renderContent()}
      </SidebarInset>
    </SidebarProvider>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
      <AppContent>{children}</AppContent>
  );
}
