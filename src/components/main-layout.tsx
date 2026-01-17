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
  ChevronDown,
  PlusCircle,
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SiteHeader } from "./site-header";
import { useProject } from "@/context/project-context";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { AddProjectDialog } from "./add-project-dialog";

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
    const { isAdmin } = useProject();
    return (
        <div className="flex flex-col gap-4 items-center justify-center h-full text-muted-foreground text-center">
            <Building2 className="w-12 h-12" />
            <h3 className="text-xl font-semibold text-foreground">Başlamak için bir proje seçin</h3>
            <p className="text-base max-w-md">
                {isAdmin 
                    ? "Yukarıdaki açılır menüden mevcut bir projeyi seçin veya yeni bir proje oluşturun."
                    : "Lütfen yukarıdaki proje seçim menüsünden üzerinde çalışmak istediğiniz projeyi seçin."
                }
            </p>
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
        <div className="p-2 group-data-[collapsible=icon]:p-0">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
                        <div className="flex items-center gap-2 truncate">
                            {selectedProject ? <Building2 className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5" />}
                            <span className="truncate group-data-[collapsible=icon]:hidden">
                                {selectedProject ? selectedProject.name : "Proje Seçin..."}
                            </span>
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50 group-data-[collapsible=icon]:hidden" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[240px]" align="start">
                    <DropdownMenuLabel>Mevcut Projeler</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {projects && projects.length > 0 ? (
                        projects.map((project) => (
                            <DropdownMenuItem key={project.id} onSelect={() => setSelectedProjectById(project.id)} className="group/item flex justify-between items-center pr-1">
                                <span className="flex-1 truncate">{project.name}</span>
                                {isAdmin && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover/item:opacity-100" onClick={(e) => e.stopPropagation()}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
                                )}
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <DropdownMenuItem disabled>Proje bulunmuyor</DropdownMenuItem>
                    )}
                    {isAdmin && (
                        <>
                            <DropdownMenuSeparator />
                            <AddProjectDialog>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <span>Yeni Proje Ekle</span>
                                </DropdownMenuItem>
                            </AddProjectDialog>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
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
       
       {isAdmin && (
         <>
            <SidebarSeparator/>
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
         </>
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
                    <ProjectSelector />
                    <SidebarSeparator />
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
