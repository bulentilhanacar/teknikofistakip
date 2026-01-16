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
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";


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

// This component will render the main content area when a project is selected
const ProjectContent = ({ children }: { children: React.ReactNode }) => {
    const { selectedProject } = useProject();

    if (!selectedProject) {
        return (
            <div className="flex flex-col gap-4 items-center justify-center h-full text-muted-foreground">
                <Building2 className="w-12 h-12" />
                <p className="text-lg">Başlamak için bir sayfa seçin.</p>
            </div>
        )
    }

    return <>{children}</>;
}


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
        <p className="mb-4">Proje yükleniyor...</p>
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
                    <ProjectNav />
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
