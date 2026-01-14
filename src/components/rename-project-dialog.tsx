
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Project } from '@/context/types';

interface RenameProjectDialogProps {
  project: Project;
  onSave: (projectId: string, newName: string) => void;
  children: React.ReactNode;
}

export function RenameProjectDialog({ project, onSave, children }: RenameProjectDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState(project.name);

  // When the dialog opens, reset the name to the current project name.
  React.useEffect(() => {
    if (isOpen) {
      setName(project.name);
    }
  }, [isOpen, project.name]);

  const handleSave = async () => {
    if (name.trim() && project) {
      await onSave(project.id, name.trim());
      setIsOpen(false);
    }
  };
  
  const child = React.Children.only(children) as React.ReactElement;
  const trigger = React.cloneElement(child, {
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      setIsOpen(true);
      child.props.onClick?.(e);
    },
    onSelect: (e: Event) => {
        e.preventDefault();
        setIsOpen(true);
        child.props.onSelect?.(e);
    }
  });


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger}
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
