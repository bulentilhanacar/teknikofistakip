
"use client";

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Project } from '@/context/types';

interface RenameProjectDialogProps {
  project: Project;
  onSave: (projectId: string, newName: string) => void;
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function RenameProjectDialog({ project, onSave, children, isOpen, onOpenChange }: RenameProjectDialogProps) {
  const [name, setName] = React.useState(project.name);

  useEffect(() => {
    if (isOpen) {
        setName(project.name);
    }
  }, [isOpen, project.name]);
  
  const handleSave = () => {
    if (name.trim() && name.trim() !== project.name) {
      onSave(project.id, name.trim());
    }
    onOpenChange(false);
  };

  return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
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
  );
}
