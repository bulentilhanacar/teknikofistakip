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
  ChevronDown,
  Shield,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AddProjectDialog } from "./add-project-dialog";
import { Project } from "@/context/types";


function ProjectNav() {
  const pathname = usePathname();
  const { 
    projects, 
    selectedProject, 
    selectProject,
    isAdmin,
    user
  } = useProject();

  const projectMenuItems = [
    { href: "/", label: "Finansal Özet", icon: LayoutDashboard },
    { href: "/contracts", label: "Sözleşme Yönetimi", icon: FileSignature },
    { href: "/progress-payments", label: "Hakediş Hesaplama", icon: Calculator },
    { href: "/progress-tracking", label: "Hakediş Takip", icon: ClipboardList },
    { href: "/deductions", label: "Kesinti Yönetimi", icon: Gavel },
  ];

  if (!user) {
     return (
        <div className="p-4 text-sm text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
            Lütfen sisteme giriş yapın.
        </div>
    )
  }

  if (!selectedProject && projects && projects.length === 0) {
    return (
      <div className="p-4 text-sm text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
        <p className="mb-4">Henüz bir projeniz yok.</p>
        <AddProjectDialog />
      </div>
    );
  }

  if (!selectedProject) {
     return (
      <div className="p-4 text-sm text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
        <p className="mb-4">Lütfen bir proje seçin veya yeni bir tane oluşturun.</p>
        <AddProjectDialog />
      </div>
    );
  }

  return (
    <>
      <div className="p-2 group-data-[collapsible=icon]:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start items-center gap-2 px-2">
                <span className="font-semibold text-base truncate flex-1 text-left">{selectedProject.name}</span>
                <ChevronDown className="h-4 w-4"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Proje Seçimi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projects && projects.map((project) => (
              <DropdownMenuItem key={project.id} onSelect={() => selectProject(project.id)} className="flex justify-between items-center">
                <span>{project.name}</span>
              </DropdownMenuItem>
            ))}
             <DropdownMenuSeparator />
             <AddProjectDialog>
                 <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Yeni Proje Ekle...
                 </DropdownMenuItem>
             </AddProjectDialog>
          </DropdownMenuContent>
        </DropdownMenu>
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
  const { loading, selectedProject, user } = useProject();

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
          <Building2 className="w-16 h-16 mb-4 animate-pulse" />
          <p className="text-lg">Proje verileri yükleniyor, lütfen bekleyin...</p>
        </div>
      );
    }
    
    if (!user) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                <Building2 className="w-16 h-16 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">İnşaat Takip Uygulamasına Hoş Geldiniz</h2>
                <p className="text-lg">Projelerinizi yönetmek için lütfen giriş yapın.</p>
            </div>
        )
    }
    
    if (!selectedProject && (!loading && user)) {
       return (
         <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
            <Building2 className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Proje Seçimi Gerekli</h2>
            <p className="text-lg mb-4">Devam etmek için lütfen bir proje seçin veya yeni bir tane oluşturun.</p>
            <AddProjectDialog />
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
