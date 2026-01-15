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
  Trash2,
  Edit,
  FolderKanban as ProjectIcon,
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
import { useUser } from "@/firebase/provider";
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
import { RenameProjectDialog } from "./rename-project-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Project } from "@/context/types";


function ProjectNav() {
  const pathname = usePathname();
  const { 
    projects, 
    selectedProject, 
    selectProject, 
    deleteProject, 
    renameProject
  } = useProject();
  const { user } = useUser();
  
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [projectToRename, setProjectToRename] = React.useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = React.useState("");

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
            Projelerinizi görmek için lütfen giriş yapın.
        </div>
    )
  }

  if (!selectedProject) {
    return (
      <div className="p-4 text-sm text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
        <p className="mb-4">Henüz bir projeniz yok veya seçilmedi.</p>
        <AddProjectDialog />
      </div>
    );
  }

  const handleRenameClick = (project: Project) => {
    setProjectToRename(project);
    setNewProjectName(project.name);
    setIsRenameOpen(true);
  };

  const handleRenameSave = () => {
    if (projectToRename && newProjectName) {
      renameProject(projectToRename.id, newProjectName);
      setIsRenameOpen(false);
      setProjectToRename(null);
    }
  };


  return (
    <>
      <div className="p-2 group-data-[collapsible=icon]:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start items-center gap-2 px-2">
                <ProjectIcon className="h-5 w-5 text-primary"/>
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
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); handleRenameClick(project)}}>
                        <Edit className="h-4 w-4"/>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    "{project.name}" projesini ve içindeki tüm verileri kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteProject(project.id)}>Evet, Sil</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 </div>
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
       </SidebarMenu>
       {projectToRename && (
         <RenameProjectDialog 
            project={projectToRename}
            name={newProjectName}
            setName={setNewProjectName}
            onSave={handleRenameSave}
            isOpen={isRenameOpen}
            onOpenChange={setIsRenameOpen}
         />
       )}
    </>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { loading: projectLoading } = useProject();
  const { user, loading: authLoading } = useUser();
  
  const loading = projectLoading || authLoading;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-screen text-muted-foreground text-center">
          <ProjectIcon className="w-16 h-16 mb-4 animate-pulse" />
          <p className="text-lg">Proje verileri yükleniyor, lütfen bekleyin...</p>
        </div>
      );
    }
    
    if (!user) {
        return (
             <div className="flex flex-col items-center justify-center h-screen text-muted-foreground text-center">
                <ProjectIcon className="w-16 h-16 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">İnşaat Takip Uygulamasına Hoş Geldiniz</h2>
                <p className="text-lg">Projelerinizi yönetmek için lütfen giriş yapın.</p>
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
