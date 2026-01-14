
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

interface RenameProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  name: string;
  setName: (name: string) => void;
  onSave: () => void;
}

export function RenameProjectDialog({ isOpen, onOpenChange, name, setName, onSave }: RenameProjectDialogProps) {
  
  const handleSave = () => {
    if (name.trim()) {
      onSave();
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
