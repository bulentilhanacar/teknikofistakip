
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Project } from '@/context/types';
import { MoreHorizontal, Edit, Trash } from 'lucide-react';

interface RenameProjectDialogProps {
  project: Project;
  onSave: (projectId: string, newName: string) => void;
  onDelete: () => void;
}

export function RenameProjectDialog({ project, onSave, onDelete }: RenameProjectDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [name, setName] = React.useState(project.name);

  // Ensure the name in the dialog is reset when it's opened for a different project
  React.useEffect(() => {
    if (isDialogOpen) {
      setName(project.name);
    }
  }, [isDialogOpen, project.name]);

  const handleSave = async () => {
    if (name.trim() && project) {
      await onSave(project.id, name.trim());
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 data-[state=open]:opacity-100">
            <MoreHorizontal className="h-4 w-4"/>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem onSelect={() => setIsDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4"/>
            <span>Yeniden Adlandır</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onDelete} className="text-destructive">
            <Trash className="mr-2 h-4 w-4"/>
            <span>Sil</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proje Adını Değiştir</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Yeni Proje Adı
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                İptal
              </Button>
            </DialogClose>
            <Button type="submit" onClick={handleSave}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
