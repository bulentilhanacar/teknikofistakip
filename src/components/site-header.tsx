"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const breadcrumbNameMap: { [key: string]: string } = {
  '/': 'Finansal Özet',
  '/contracts': 'Sözleşme Yönetimi',
  '/progress-payments': 'Hakediş Hesaplama',
};


export function SiteHeader() {
  const pathname = usePathname();
  // Simplified logic for breadcrumbs. In a real app with dynamic project routes,
  // this would need to be more sophisticated to handle /projects/[id]/...
  const pathnames = pathname === '/' ? [] : pathname.split('/').filter(x => x);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Finansal Özet</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathnames.map((value, index) => {
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
        {/* Can add actions here later */}
      </div>
    </header>
  );
}
