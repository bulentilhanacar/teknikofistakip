"use client";

import React from 'react';
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
import { useProject } from '@/context/project-context';
import { PlusCircle } from 'lucide-react';

export function AddProjectDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const { addProject } = useProject();

  const handleSave = async () => {
    if (name.trim()) {
      await addProject(name.trim());
      setIsOpen(false);
    }
  };

  // Reset name when dialog is closed
  React.useEffect(() => {
    if (!isOpen) {
      setName('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
            <PlusCircle className="mr-2" />
            <span className="group-data-[collapsible=icon]:hidden">Yeni Proje Ekle</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Proje Ekle</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Proje Adı
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
