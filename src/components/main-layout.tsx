"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calculator,
  FileSignature,
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  ChevronsUpDown,
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
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SiteHeader } from "./site-header";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "./ui/button";
import { useProject } from "@/context/project-context";

const projectMenuItems = [
  { href: "/", label: "Finansal Özet", icon: LayoutDashboard },
  { href: "/contracts", label: "Sözleşme Yönetimi", icon: FileSignature },
  { href: "/progress-payments", label: "Hakediş Hesaplama", icon: Calculator },
  { href: "/deductions", label: "Kesinti Yönetimi", icon: Gavel },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const userAvatar = PlaceHolderImages.find((p) => p.id === "user-avatar");
  const { projects, selectedProject, selectProject, addProject } = useProject();

  const handleAddProject = () => {
    // TODO: Add a dialog to get project name from user
    const newProjectName = `Yeni Proje ${projects.length + 1}`;
    addProject(newProjectName);
  }

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
            <div className="p-2">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            className="w-full justify-between group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-sidebar-border"
                        >
                            <span className="truncate group-data-[collapsible=icon]:hidden">{selectedProject?.name ?? "Proje Seçin"}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-data-[collapsible=icon]:hidden"/>
                            <FolderKanban className="hidden h-5 w-5 group-data-[collapsible=icon]:block" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--sidebar-width)] -translate-x-2">
                        <DropdownMenuLabel>Projeler</DropdownMenuLabel>
                        <DropdownMenuSeparator/>
                        {projects.map(project => (
                            <DropdownMenuItem key={project.id} onClick={() => selectProject(project.id)}>
                                {project.name}
                            </DropdownMenuItem>
                        ))}
                         <DropdownMenuSeparator/>
                        <DropdownMenuItem onClick={handleAddProject}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            <span>Yeni Proje Ekle</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
            </div>
            {selectedProject && (
              <SidebarMenu>
                {projectMenuItems.map((item) => {
                  const itemPath = item.href === "/" ? "/" : item.href;
                  const isActive = pathname === itemPath;
                  return (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.label}
                        >
                            <Link href={itemPath}>
                                <item.icon />
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            )}
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2">
                <Avatar className="h-8 w-8">
                  {userAvatar && <AvatarImage src={userAvatar.imageUrl} data-ai-hint={userAvatar.imageHint} />}
                  <AvatarFallback>TO</AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                  <span className="font-semibold">Teknik Ofis</span>
                  <span className="text-xs text-sidebar-foreground/70">
                    info@insaat.com
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Ayarlar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Çıkış Yap</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
