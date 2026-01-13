"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calculator,
  FileSignature,
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  ChevronsUpDown,
  Gavel,
  MoreHorizontal,
  Edit,
  Trash
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { SiteHeader } from "./site-header";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "./ui/button";
import { useProject } from "@/context/project-context";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const projectMenuItems = [
  { href: "/", label: "Finansal Özet", icon: LayoutDashboard },
  { href: "/contracts", label: "Sözleşme Yönetimi", icon: FileSignature },
  { href: "/progress-payments", label: "Hakediş Hesaplama", icon: Calculator },
  { href: "/deductions", label: "Kesinti Yönetimi", icon: Gavel },
];


function AddProjectDialog({ isOpen, onOpenChange, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (name: string) => void }) {
    const [name, setName] = React.useState("");

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
            setName("");
            onOpenChange(false);
        }
    };
    
    // Reset name when dialog is closed
    React.useEffect(() => {
        if (!isOpen) {
            setName("");
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yeni Proje Ekle</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Proje Adı</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">İptal</Button></DialogClose>
                    <Button type="submit" onClick={handleSave}>Kaydet</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function RenameProjectDialog({ project, isOpen, onOpenChange, onSave }: { project: {id: string, name: string} | null, isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (id: string, newName: string) => void }) {
    const [name, setName] = React.useState("");

    React.useEffect(() => {
        if (project && isOpen) {
            setName(project.name);
        } else if (!isOpen) {
            setName("");
        }
    }, [project, isOpen]);

    const handleSave = () => {
        if (name.trim() && project) {
            onSave(project.id, name.trim());
            onOpenChange(false);
        }
    };
    
    if (!project) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Proje Adını Değiştir</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Yeni Proje Adı</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">İptal</Button></DialogClose>
                    <Button type="submit" onClick={handleSave}>Kaydet</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ProjectSelector() {
  const { projects, selectedProject, selectProject, deleteProject, addProject, updateProjectName } = useProject();
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [projectToRename, setProjectToRename] = React.useState<{id: string, name: string} | null>(null);

  const handleRenameClick = (project: {id: string, name: string}) => {
    setProjectToRename(project);
    setIsRenameOpen(true);
  }
  
  const handleSaveRename = (id: string, newName: string) => {
      updateProjectName(id, newName);
      setProjectToRename(null);
  }

  const handleSaveAdd = (name: string) => {
      addProject(name);
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
                            <DropdownMenuItem onSelect={() => handleRenameClick(project)}>
                                <Edit className="mr-2 h-4 w-4"/>
                                <span>Yeniden Adlandır</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => deleteProject(project.id)} className="text-destructive">
                                <Trash className="mr-2 h-4 w-4"/>
                                <span>Sil</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsAddOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>Yeni Proje Ekle</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        
        <AddProjectDialog isOpen={isAddOpen} onOpenChange={setIsAddOpen} onSave={handleSaveAdd} />
        <RenameProjectDialog project={projectToRename} isOpen={isRenameOpen} onOpenChange={setIsRenameOpen} onSave={handleSaveRename} />
    </>
  );
}


export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const userAvatar = PlaceHolderImages.find((p) => p.id === "user-avatar");
  const { selectedProject } = useProject();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);


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
          <div className="p-2">
            {isClient ? <ProjectSelector /> : <Skeleton className="h-10 w-full" />}
          </div>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2">
                <Avatar className="h-8 w-8">
                  {userAvatar && (
                    <AvatarImage
                      src={userAvatar.imageUrl}
                      data-ai-hint={userAvatar.imageHint}
                    />
                  )}
                  <AvatarFallback>TO</AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                  <span className="font-semibold">Teknik Ofis</span>
                  <span className="text-xs text-sidebar-foreground/70">
                    info@insaat.com
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Ayarlar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Çıkış Yap</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
