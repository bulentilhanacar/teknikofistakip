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
  FolderOpen,
  Trash2,
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SiteHeader } from "./site-header";
import { useProject } from "@/context/project-context";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { AddProjectDialog } from "./add-project-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Project } from "@/context/types";


// Component for the Login Screen
const LoginScreen = () => {
    const auth = useAuth();
    const handleSignIn = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider).catch(error => {
            console.error("Giriş sırasında hata oluştu", error);
        });
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground text-center p-4">
            <Building2 className="w-16 h-16 mb-4 text-primary" />
            <h2 className="text-3xl font-bold font-headline mb-2">İnşaat Takip Uygulamasına Hoş Geldiniz</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-md">Erişim istemek ve başlamak için lütfen giriş yapın.</p>
            <Button size="lg" onClick={handleSignIn}>
                <UserCheck className="mr-2" />
                Google ile Giriş Yap / Kayıt Ol
            </Button>
        </div>
    );
};

// Component for the Pending Approval Screen
const PendingScreen = () => {
    const auth = useAuth();
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground text-center p-4">
            <Clock className="w-16 h-16 mb-4 text-accent" />
            <h2 className="text-3xl font-bold font-headline mb-2">Hesabınız Onay Bekliyor</h2>
            <p className="text-lg text-muted-foreground mb-6">Erişim talebiniz alındı. Hesabınız bir admin tarafından onaylandığında sisteme erişebileceksiniz.</p>
            <Button variant="outline" onClick={() => auth.signOut()}>Çıkış Yap</Button>
        </div>
    );
};

// Component for the Loading Screen
const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <Building2 className="w-16 h-16 mb-4 text-primary animate-pulse" />
        <p className="text-lg text-muted-foreground">Veriler yükleniyor, lütfen bekleyin...</p>
    </div>
);

// Component for a generic error state
const ErrorScreen = () => (
     <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground text-center p-4">
        <Building2 className="w-16 h-16 mb-4 text-destructive" />
        <h2 className="text-3xl font-bold font-headline mb-2">Bir Hata Oluştu</h2>
        <p className="text-lg text-muted-foreground">Bilinmeyen bir durum oluştu. Lütfen daha sonra tekrar deneyin veya sistem yöneticinize başvurun.</p>
    </div>
);

// Component to show when no project is selected
const NoProjectSelected = () => {
    return (
        <div className="flex flex-col gap-4 items-center justify-center h-full text-muted-foreground">
            <FolderOpen className="w-12 h-12" />
            <p className="text-lg">Lütfen çalışmak için bir proje seçin.</p>
            <p className="text-sm">Kenar çubuğundaki proje listesinden bir proje seçebilir veya yeni bir tane oluşturabilirsiniz.</p>
        </div>
    )
}

// This component will render the main content area when a project is selected
const ProjectContent = ({ children }: { children: React.ReactNode }) => {
    const { selectedProject } = useProject();

    if (!selectedProject) {
        return <NoProjectSelected />
    }

    return <>{children}</>;
}


const ProjectSelector = () => {
    const { projects, selectedProject, setSelectedProjectById, isAdmin, deleteProject } = useProject();

    const handleDelete = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        deleteProject(projectId);
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Projeler</SidebarGroupLabel>
            {isAdmin && <AddProjectDialog />}
             <SidebarGroupContent>
                {projects && projects.length > 0 ? (
                    projects.map((project: Project) => (
                        <div key={project.id} className="relative group/item">
                             <SidebarMenuButton
                                onClick={() => setSelectedProjectById(project.id)}
                                isActive={selectedProject?.id === project.id}
                                tooltip={project.name}
                            >
                                <span className="truncate flex-1">{project.name}</span>
                            </SidebarMenuButton>
                             {isAdmin && (
                                <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    "{project.name}" projesini ve tüm içeriğini (sözleşmeler, hakedişler vb.) kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                <AlertDialogAction onClick={(e) => handleDelete(e, project.id)}>Evet, Sil</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                             )}
                        </div>
                    ))
                ) : (
                    <div className="text-xs text-sidebar-foreground/70 px-2 py-1 group-data-[collapsible=icon]:hidden">
                        {isAdmin ? "Henüz proje oluşturulmadı." : "Görüntülenecek proje yok."}
                    </div>
                )}
             </SidebarGroupContent>
        </SidebarGroup>
    )
}

function MainNavigation() {
  const pathname = usePathname();
  const { isAdmin } = useProject();

  const mainMenuItems = [
    { href: "/", label: "Finansal Özet", icon: LayoutDashboard },
    { href: "/contracts", label: "Sözleşme Yönetimi", icon: FileSignature },
    { href: "/progress-payments", label: "Hakediş Hesaplama", icon: Calculator },
    { href: "/progress-tracking", label: "Hakediş Takip", icon: ClipboardList },
    { href: "/deductions", label: "Kesinti Yönetimi", icon: Gavel },
  ];

  return (
    <>
       <SidebarMenu>
        {mainMenuItems.map((item) => {
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
       <SidebarSeparator/>
       <ProjectSelector />
       <SidebarSeparator/>
       {isAdmin && (
             <SidebarMenu>
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
             </SidebarMenu>
        )}
    </>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
    const { loading, user, userAppStatus } = useProject();

    if (loading) {
        return <LoadingScreen />;
    }
    
    if (!user) {
        return <LoginScreen />;
    }
    
    if (userAppStatus === 'pending') {
       return <PendingScreen />;
    }

    if (userAppStatus === 'error') {
        return <ErrorScreen />;
    }
    
    if (userAppStatus === 'approved' || userAppStatus === 'admin') {
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
                    <MainNavigation />
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <SiteHeader />
                <main className="flex-1 p-4 sm:p-6">
                    <ProjectContent>{children}</ProjectContent>
                </main>
            </SidebarInset>
        </SidebarProvider>
       );
    }

    // Fallback error screen
    return <ErrorScreen />;
}
