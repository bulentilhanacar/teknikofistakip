
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
  ChevronsUpDown,
  Gavel,
  Edit,
  Trash,
  ClipboardList,
  PlusCircle,
  MoreHorizontal,
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { SiteHeader } from "./site-header";
import { Button } from "./ui/button";
import { useProject } from "@/context/project-context";
import { Skeleton } from "./ui/skeleton";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { AddProjectDialog } from "./add-project-dialog";
import { RenameProjectDialog } from "./rename-project-dialog";
import { Project } from "@/context/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


function ProjectSelector() {
  const { projects, selectedProject, selectProject, deleteProject, updateProjectName, loading } = useProject();
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [editingName, setEditingName] = React.useState('');

  const handleRenameClick = (project: Project) => {
    setEditingProject(project);
    setEditingName(project.name);
  };

  const handleSaveRename = () => {
    if (editingProject && editingName.trim()) {
      updateProjectName(editingProject.id, editingName.trim());
    }
    setEditingProject(null);
  };
  
  const handleDeleteClick = (project: Project) => {
    deleteProject(project.id);
  }

  if (loading) {
     return (
        <div className="p-2 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
     )
  }

  return (
    <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                variant="ghost"
                className="w-full justify-between text-sidebar-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                <span className="truncate group-data-[collapsible=icon]:hidden">
                    {selectedProject?.name ?? "Proje Seçin"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-data-[collapsible=icon]:hidden" />
                <FolderKanban className="hidden h-5 w-5 group-data-[collapsible=icon]:block" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--sidebar-width)] -translate-x-2">
                <DropdownMenuLabel>Projeler</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {projects && projects.map((project) => (
                    <DropdownMenuItem key={project.id} onSelect={() => selectProject(project.id)}>
                        {project.name}
                    </DropdownMenuItem>
                ))}
                 {(!projects || projects.length === 0) && (
                    <DropdownMenuItem disabled>
                        Henüz proje oluşturulmamış.
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>

        {selectedProject && (
            <div className="mt-2 space-y-1 p-2 pt-0 group-data-[collapsible=icon]:hidden">
                <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground" onClick={() => handleRenameClick(selectedProject)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Yeniden Adlandır</span>
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-destructive/80 hover:text-destructive">
                            <Trash className="mr-2 h-4 w-4"/>
                            <span>Proje Sil</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                                "{selectedProject.name}" projesini ve tüm verilerini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteClick(selectedProject)}>Evet, Sil</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
            </div>
        )}
        
        {editingProject && (
            <RenameProjectDialog 
                project={editingProject}
                name={editingName}
                setName={setEditingName}
                onSave={handleSaveRename}
                isOpen={!!editingProject}
                onOpenChange={(isOpen) => !isOpen && setEditingProject(null)}
            />
        )}
    </>
  );
}

const projectMenuItems = [
  { href: "/", label: "Finansal Özet", icon: LayoutDashboard },
  { href: "/contracts", label: "Sözleşme Yönetimi", icon: FileSignature },
  { href: "/progress-payments", label: "Hakediş Hesaplama", icon: Calculator },
  { href: "/progress-tracking", label: "Hakediş Takip", icon: ClipboardList },
  { href: "/deductions", label: "Kesinti Yönetimi", icon: Gavel },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const selectedProject = useProject().selectedProject;

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
          {!isUserLoading && user && (
            <>
              <ProjectSelector />
              <SidebarSeparator className="my-1"/>
              <div className="p-2 pt-0">
                <AddProjectDialog />
              </div>
            </>
          )}
           {isUserLoading && (
             <div className="p-2 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
           )}
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
                );
              })}
            </SidebarMenu>
          )}
        </SidebarContent>
        <SidebarFooter>
          {/* Footer content can go here */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
