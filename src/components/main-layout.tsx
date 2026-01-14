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
  MoreHorizontal,
  Edit,
  Trash,
  ClipboardList,
  PlusCircle,
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
} from "@/components/ui/dropdown-menu";
import { SiteHeader } from "./site-header";
import { Button } from "./ui/button";
import { useProject } from "@/context/project-context";
import { Skeleton } from "./ui/skeleton";
import { useUser, useAuth } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { AddProjectDialog } from "./add-project-dialog";
import { RenameProjectDialog } from "./rename-project-dialog";
import { Project } from "@/context/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


function ProjectSelector() {
  const { projects, selectedProject, selectProject, deleteProject, updateProjectName } = useProject();
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);

  if (!projects) {
     return <Skeleton className="h-10 w-full" />
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
                {projects.map((project) => (
                    <DropdownMenuItem key={project.id} onSelect={() => selectProject(project.id)}>
                        {project.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>

        {selectedProject && (
            <div className="mt-2 space-y-1 p-2 pt-0 group-data-[collapsible=icon]:hidden">
                <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground" onClick={() => setEditingProject(selectedProject)}>
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
                            <AlertDialogAction onClick={async () => await deleteProject(selectedProject.id)}>Evet, Sil</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
            </div>
        )}
        
        {editingProject && (
            <RenameProjectDialog 
                project={editingProject}
                onSave={updateProjectName}
                isOpen={!!editingProject}
                onOpenChange={(isOpen) => !isOpen && setEditingProject(null)}
            />
        )}
    </>
  );
}


export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { selectedProject } = useProject();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    if (auth && !user && !isUserLoading) {
        signInAnonymously(auth).catch((error) => {
            console.error("Anonymous sign-in failed", error);
        });
    }
  }, [auth, user, isUserLoading]);

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
          {isClient && !isUserLoading && user && (
            <>
              <ProjectSelector />
              <SidebarSeparator className="my-1"/>
              <div className="p-2 pt-0">
                <AddProjectDialog />
              </div>
            </>
          )}
           {isClient && isUserLoading && (
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
            {/* AuthStatus is removed to simplify UI for anonymous login */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
