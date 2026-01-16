"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calculator,
  FileSignature,
  LayoutDashboard,
  ClipboardList,
  Gavel,
  Shield,
  Clock,
  UserCheck,
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


function ProjectNav() {
  const pathname = usePathname();
  const { 
    selectedProject, 
    isAdmin,
  } = useProject();

  const projectMenuItems = [
    { href: "/", label: "Finansal Özet", icon: LayoutDashboard },
    { href: "/contracts", label: "Sözleşme Yönetimi", icon: FileSignature },
    { href: "/progress-payments", label: "Hakediş Hesaplama", icon: Calculator },
    { href: "/progress-tracking", label: "Hakediş Takip", icon: ClipboardList },
    { href: "/deductions", label: "Kesinti Yönetimi", icon: Gavel },
  ];

  if (!selectedProject) {
     return (
      <div className="p-4 text-sm text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
        <p className="mb-4">Projeler yükleniyor veya henüz proje oluşturulmamış.</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-2 group-data-[collapsible=icon]:hidden">
           <div className="w-full justify-start items-center gap-2 px-2 py-2">
                <span className="font-semibold text-base truncate flex-1 text-left">{selectedProject.name}</span>
            </div>
      </div>

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
        {isAdmin && (
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin'}
                tooltip={"Admin Paneli"}
              >
                <Link href="/admin">
                  <Shield />
                  <span>Admin Paneli</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
        )}
       </SidebarMenu>
    </>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, userAppStatus } = useProject();

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
          <Building2 className="w-16 h-16 mb-4 animate-pulse" />
          <p className="text-lg">Veriler yükleniyor, lütfen bekleyin...</p>
        </div>
      );
    }
    
    if (!user) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                <UserCheck className="w-16 h-16 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">İnşaat Takip Uygulamasına Hoş Geldiniz</h2>
                <p className="text-lg">Sisteme erişim talebinde bulunmak için lütfen giriş yapın.</p>
            </div>
        )
    }
    
    if (userAppStatus === 'pending') {
       return (
         <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
            <Clock className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Hesabınız Onay Bekliyor</h2>
            <p className="text-lg mb-4">Erişim talebiniz alındı. Hesabınız bir admin tarafından onaylandığında sisteme erişebileceksiniz.</p>
        </div>
       )
    }
    
    if (userAppStatus === 'approved' || userAppStatus === 'admin') {
       return <main className="flex-1 p-4 sm:p-6">{children}</main>;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
            <Building2 className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Bilinmeyen Durum</h2>
            <p className="text-lg">Bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
        </div>
    )
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
