
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { signInWithPopup, GoogleAuthProvider, getAuth } from "firebase/auth";
import { useFirebaseApp } from "@/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

const breadcrumbNameMap: { [key: string]: string } = {
  '/': 'Finansal Özet',
  '/contracts': 'Sözleşme Yönetimi',
  '/progress-payments': 'Hakediş Hesaplama',
  '/progress-tracking': 'Hakediş Takip',
  '/deductions': 'Kesinti Yönetimi',
};

const UserMenu = () => {
    const { user, loading } = useUser();
    const app = useFirebaseApp();
    const auth = getAuth(app);

    const handleSignIn = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider).catch(error => {
            console.error("Giriş sırasında hata oluştu", error);
        });
    }

    const handleSignOut = () => {
        auth.signOut();
    }

    if (loading) {
        return <div className="w-24 h-8 bg-muted rounded animate-pulse" />
    }

    if (!user) {
        return (
            <Button onClick={handleSignIn}>Google ile Giriş Yap</Button>
        )
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
  
  const pathnames = pathname === '/' ? ['/'] : pathname.split('/').filter(x => x);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Ana Sayfa</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathnames.map((value, index) => {
            if (value === '/') return null;
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            const name = breadcrumbNameMap[to] || value.charAt(0).toUpperCase() + value.slice(1);
            
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
      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  );
}
