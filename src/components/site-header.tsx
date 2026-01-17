
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { getAuth } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, ChevronDown, PlusCircle, Trash2, Building2 } from "lucide-react";
import { useProject } from '@/context/project-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { AddProjectDialog } from "./add-project-dialog";


const breadcrumbNameMap: { [key: string]: string } = {
  '/': 'Finansal Özet',
  '/contracts': 'Sözleşme Yönetimi',
  '/progress-payments': 'Hakediş Hesaplama',
  '/progress-tracking': 'Hakediş Takip',
  '/deductions': 'Kesinti Yönetimi',
  '/admin': 'Admin Paneli',
};

const ProjectSelector = () => {
    const { projects, selectedProject, setSelectedProjectById, isAdmin, deleteProject } = useProject();

    const handleDelete = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        deleteProject(projectId);
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[220px] justify-between hidden md:flex">
                    {selectedProject ? <Building2 className="h-4 w-4 mr-2 text-primary" /> : null}
                    <span className="truncate flex-1 text-left">
                        {selectedProject ? selectedProject.name : "Proje Seçin..."}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[280px]" align="start">
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
    );
}

const UserMenu = () => {
    const { user } = useUser();
    const { isAdmin } = useProject();
    const auth = getAuth();

    const handleSignOut = () => {
        auth.signOut();
    }
    
    if (!user) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Kullanıcı"} />
                        <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        {isAdmin && <p className="text-xs font-bold text-primary leading-none pt-1">Admin</p>}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Çıkış Yap</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}


export function SiteHeader() {
  const pathname = usePathname();
  const { selectedProject } = useProject();
  const pathSegments = pathname.split('/').filter(x => x);
  const isHomePage = pathname === '/';

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <ProjectSelector />
      
      {selectedProject && (
        <Breadcrumb className="hidden md:flex ml-4">
            <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink asChild>
                <Link href="/">Ana Sayfa</Link>
                </BreadcrumbLink>
            </BreadcrumbItem>
            {!isHomePage && pathSegments.map((segment, index) => {
                const to = `/${pathSegments.slice(0, index + 1).join('/')}`;
                const isLast = index === pathSegments.length - 1;
                const name = breadcrumbNameMap[to] || segment.charAt(0).toUpperCase() + segment.slice(1);
                
                return (
                <React.Fragment key={to}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                    {isLast ? (
                        <BreadcrumbPage>{name}</BreadcrumbPage>
                    ) : (
                        <BreadcrumbLink asChild>
                        <Link href={to}>{name}</Link>
                        </BreadcrumbLink>
                    )}
                    </BreadcrumbItem>
                </React.Fragment>
                );
            })}
            </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  );
}
