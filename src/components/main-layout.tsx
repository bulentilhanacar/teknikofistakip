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


const projectMenuItems = [
  { href: "/", label: "Finansal Özet", icon: LayoutDashboard },
  { href: "/contracts", label: "Sözleşme Yönetimi", icon: FileSignature },
  { href: "/progress-payments", label: "Hakediş Hesaplama", icon: Calculator },
  { href: "/progress-tracking", label: "Hakediş Takip", icon: ClipboardList },
  { href: "/deductions", label: "Kesinti Yönetimi", icon: Gavel },
];


function ProjectSelector() {
  const { projects, selectedProject, selectProject, deleteProject, updateProjectName } = useProject();
  
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
                <DropdownMenuItem key={project.id} onSelect={(e) => e.preventDefault()} className="group/item flex justify-between items-center pr-1">
                    <button className="flex-1 text-left" onClick={() => selectProject(project.id)}>
                    {project.name}
                    </button>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 data-[state=open]:opacity-100">
                                <MoreHorizontal className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                            <RenameProjectDialog project={project} onSave={updateProjectName}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="mr-2 h-4 w-4"/>
                                    <span>Yeniden Adlandır</span>
                                </DropdownMenuItem>
                            </RenameProjectDialog>
                            <DropdownMenuItem onSelect={() => deleteProject(project.id)} className="text-destructive">
                                <Trash className="mr-2 h-4 w-4"/>
                                <span>Sil</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
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
            <div className="p-2 space-y-1">
              <ProjectSelector />
              <AddProjectDialog />
            </div>
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
