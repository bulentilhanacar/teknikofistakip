"use client";

import { useState, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, CheckCircle, ChevronDown, Edit, Trash2, Undo2 } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useProject } from '@/context/project-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Contract, ContractGroupKeys, ContractItem, contractGroups } from '@/context/types';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, query, updateDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


const ItemDialog = ({ contractId, item, onSave, children, mode }: { contractId: string, item?: ContractItem, onSave: (contractId: string, item: ContractItem, originalPoz?: string) => void, children: React.ReactNode, mode: 'add' | 'edit' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState<Omit<ContractItem, 'quantity' | 'unitPrice'> & { quantity: string, unitPrice: string }>(
        item ? { ...item, quantity: String(item.quantity), unitPrice: String(item.unitPrice) } : { poz: '', description: '', unit: '', quantity: '', unitPrice: '' }
    );

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setFormData(item ? { ...item, quantity: String(item.quantity), unitPrice: String(item.unitPrice) } : { poz: '', description: '', unit: '', quantity: '', unitPrice: '' });
        }
        setIsOpen(open);
    };

    const handleSave = () => {
        const newItem: ContractItem = {
            ...formData,
            quantity: parseFloat(formData.quantity) || 0,
            unitPrice: parseFloat(formData.unitPrice) || 0,
        };
        onSave(contractId, newItem, item?.poz);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? 'Yeni Kalem Ekle' : 'Kalemi Düzenle'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="poz" className="text-right">Poz No</Label>
                        <Input id="poz" value={formData.poz} onChange={(e) => setFormData({ ...formData, poz: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Açıklama</Label>
                        <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unit" className="text-right">Birim</Label>
                        <Input id="unit" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">Miktar</Label>
                        <Input id="quantity" type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unitPrice" className="text-right">Birim Fiyat</Label>
                        <Input id="unitPrice" type="number" value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">İptal</Button></DialogClose>
                    <Button type="submit" onClick={handleSave}>Kaydet</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ContractRow = ({ contract, onApprove, onRevert, onAddItem, onUpdateItem, onDeleteItem, onRenameContract, onDeleteContract }: { contract: Contract, onApprove?: (contractId: string) => void, onRevert?: (contractId: string) => void, onAddItem?: (contractId: string, item: ContractItem) => void, onUpdateItem: (contractId: string, item: ContractItem, originalPoz: string) => void, onDeleteItem: (contractId: string, itemPoz: string) => void, onRenameContract?: (id: string, newName: string) => void, onDeleteContract?: (id: string) => void }) => {
    const budget = contract.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const formatCurrency = (amount: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    const isApproved = !contract.isDraft;

    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [newName, setNewName] = useState(contract.name);

    const handleRename = () => {
        if (onRenameContract) {
            onRenameContract(contract.id, newName);
            setIsRenameOpen(false);
        }
    };
    
    return (
        <Collapsible asChild>
            <tbody className='bg-background'>
                <TableRow>
                    <td colSpan={7} className="p-0">
                        <div className="flex items-center p-4 w-full group">
                            <CollapsibleTrigger asChild>
                                <button className='flex items-center flex-1 text-left'>
                                    <ChevronDown className="h-4 w-4 mr-2 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                    <span className="font-medium w-28">{contract.id.substring(0,10)}...</span>
                                    <span className='flex-1'>{contract.name}</span>
                                </button>
                            </CollapsibleTrigger>
                            <Badge variant={isApproved ? "default" : "secondary"} className="w-28 justify-center">{contract.status}</Badge>
                            <span className="w-28 text-center">{contract.date}</span>
                            <span className="w-32 text-right">{formatCurrency(budget)}</span>
                            <div className="w-48 flex justify-end items-center gap-1">
                                {onApprove && !isApproved && (
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onApprove(contract.id); }}>
                                        <CheckCircle className="mr-2 h-4 w-4 text-green-600"/>
                                        Onayla
                                    </Button>
                                )}
                                 {onRevert && isApproved && (
                                     <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onRevert(contract.id); }}>
                                        <Undo2 className="mr-2 h-4 w-4 text-muted-foreground"/>
                                        Geri Al
                                    </Button>
                                )}
                                {!isApproved && onRenameContract && onDeleteContract && (
                                   <>
                                        <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                                            <DialogTrigger asChild>
                                                 <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Taslağı Yeniden Adlandır</DialogTitle>
                                                </DialogHeader>
                                                <div className="py-4">
                                                    <Label htmlFor="contract-name">Yeni Ad</Label>
                                                    <Input id="contract-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild><Button variant="secondary">İptal</Button></DialogClose>
                                                    <Button onClick={handleRename}>Kaydet</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        "{contract.name}" taslağını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDeleteContract(contract.id)}>Evet, Sil</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                   </>
                                )}
                            </div>
                        </div>
                    </td>
                </TableRow>
                <CollapsibleContent asChild>
                    <TableRow>
                        <TableCell colSpan={7} className="p-0">
                            <div className="p-4 bg-muted/50">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className='text-base font-semibold pl-2'>Sözleşme Detayları</h4>
                                    {!isApproved && onAddItem && (
                                       <ItemDialog contractId={contract.id} onSave={(id, item) => onAddItem(id, item)} mode="add">
                                            <Button variant="outline" size="sm">
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Yeni Kalem Ekle
                                            </Button>
                                       </ItemDialog>
                                    )}
                                </div>
                                 {contract.items.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Poz No</TableHead>
                                                <TableHead>Açıklama</TableHead>
                                                <TableHead>Birim</TableHead>
                                                <TableHead className='text-right'>Miktar</TableHead>
                                                <TableHead className='text-right'>Birim Fiyat</TableHead>
                                                <TableHead className="text-right">Tutar</TableHead>
                                                {!isApproved && <TableHead className="w-[100px] text-center">İşlemler</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {contract.items.map((item) => (
                                                <TableRow key={item.poz}>
                                                    <TableCell>{item.poz}</TableCell>
                                                    <TableCell>{item.description}</TableCell>
                                                    <TableCell>{item.unit}</TableCell>
                                                    <TableCell className='text-right'>{item.quantity.toLocaleString('tr-TR')}</TableCell>
                                                    <TableCell className='text-right'>{formatCurrency(item.unitPrice)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                                                    {!isApproved && (
                                                        <TableCell className="text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <ItemDialog contractId={contract.id} item={item} onSave={(id, updatedItem, originalPoz) => onUpdateItem(id, updatedItem, originalPoz!)} mode="edit">
                                                                     <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <Edit className="h-4 w-4" />
                                                                     </Button>
                                                                </ItemDialog>

                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                "{item.description}" kalemini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => onDeleteItem(contract.id, item.poz)}>Sil</AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                            <TableRow className="font-bold bg-muted">
                                                <TableCell colSpan={isApproved ? 5 : 6} className="text-right">Toplam Tutar</TableCell>
                                                <TableCell className="text-right">{formatCurrency(budget)}</TableCell>
                                                {!isApproved && <TableCell></TableCell>}
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                 ) : (
                                    <div className="text-center text-muted-foreground p-4">Bu sözleşme için kalem eklenmemiş.</div>
                                 )}
                            </div>
                        </TableCell>
                    </TableRow>
                </CollapsibleContent>
            </tbody>
        </Collapsible>
    )
}

const ContractGroupAccordion = ({ title, contracts, onApprove, onRevert, onAddDraft, groupKey, onAddItem, onUpdateItem, onDeleteItem, onRenameContract, onDeleteContract }: { title: string, contracts: Record<string, Contract[]>, onApprove?: (contractId: string) => void, onRevert?: (contractId: string) => void, onAddDraft?: (group: ContractGroupKeys, name: string, subGroup: string) => void, groupKey: ContractGroupKeys, onAddItem?: (contractId: string, item: ContractItem) => void, onUpdateItem: (contractId: string, item: ContractItem, originalPoz: string) => void, onDeleteItem: (contractId: string, itemPoz: string) => void, onRenameContract?: (id: string, newName: string) => void, onDeleteContract?: (id: string) => void }) => {
    const totalContractsInGroup = Object.values(contracts).reduce((sum, list) => sum + list.length, 0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [draftSubGroup, setDraftSubGroup] = useState('');

    const handleAddDraft = () => {
        if (onAddDraft && draftName && draftSubGroup) {
            onAddDraft(groupKey, draftName, draftSubGroup);
            setDraftName('');
            setDraftSubGroup('');
            setIsDialogOpen(false);
        }
    };
    
    const hasAnyContracts = Object.values(contracts).some(subgroup => subgroup.length > 0);

    return (
        <AccordionItem value={title}>
            <AccordionTrigger className="text-base font-headline hover:no-underline">
                <div className='flex justify-between items-center w-full pr-4'>
                    <span>{title} ({totalContractsInGroup})</span>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                {hasAnyContracts ? (
                    <Accordion type="multiple" className="w-full pl-4 border-l">
                    {Object.entries(contracts).map(([subGroup, contractList]) => {
                        return (
                            <AccordionItem value={subGroup} key={subGroup}>
                                <div className="flex items-center justify-between hover:bg-muted/50 rounded-md">
                                    <AccordionTrigger className="text-sm font-semibold hover:no-underline flex-1 py-3 px-4">
                                        <span>{subGroup} ({contractList.length})</span>
                                    </AccordionTrigger>
                                </div>
                                <AccordionContent>
                                     {contractList.length > 0 ? (
                                        <Table>
                                            {contractList.map((contract) => (
                                                <ContractRow key={contract.id} contract={contract} onApprove={onApprove} onRevert={onRevert} onAddItem={onAddItem} onUpdateItem={onUpdateItem} onDeleteItem={onDeleteItem} onRenameContract={onRenameContract} onDeleteContract={onDeleteContract} />
                                            ))}
                                        </Table>
                                     ) : (
                                        <div className="text-center text-muted-foreground p-4">Bu alt grupta taslak sözleşme bulunmuyor.</div>
                                     )}
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                    </Accordion>
                ) : (
                     <div className="pl-4 text-muted-foreground py-4">Bu grupta alt başlık veya sözleşme bulunmuyor.</div>
                )}
                 {onAddDraft && (
                    <div className="pt-2 pl-6 mt-2 border-t">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                 <Button variant="ghost" size="sm">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Yeni Taslak Ekle
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{title} Grubuna Yeni Taslak Ekle</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">Sözleşme Adı</Label>
                                        <Input id="name" value={draftName} onChange={(e) => setDraftName(e.target.value)} className="col-span-3" />
                                    </div>
                                     <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="subgroup" className="text-right">Alt Grup</Label>
                                        <Input id="subgroup" value={draftSubGroup} onChange={(e) => setDraftSubGroup(e.target.value)} className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary">İptal</Button>
                                    </DialogClose>
                                    <Button type="submit" onClick={handleAddDraft}>Kaydet</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                    </div>
                 )}
            </AccordionContent>
        </AccordionItem>
    );
};


export default function ContractsPage() {
    const { selectedProject } = useProject();
    const firestore = useFirestore();
    const { toast } = useToast();

    const contractsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedProject) return null;
        return query(collection(firestore, 'projects', selectedProject.id, 'contracts'));
    }, [firestore, selectedProject]);
    
    const { data: contracts } = useCollection<Contract>(contractsQuery);

    const { draftContracts, approvedContracts } = useMemo(() => {
        if (!contracts) {
            return { draftContracts: [], approvedContracts: [] };
        }
        const drafts = contracts.filter(c => c.isDraft);
        const approved = contracts.filter(c => !c.isDraft);
        return { draftContracts: drafts, approvedContracts: approved };
    }, [contracts]);

    const addDraftTender = useCallback(async (group: ContractGroupKeys, name: string, subGroup: string) => {
        if (!firestore || !selectedProject) return;

        try {
            await addDoc(collection(firestore, 'projects', selectedProject.id, 'contracts'), {
                name,
                group,
                subGroup,
                status: 'Hazırlık',
                date: new Date().toISOString().split('T')[0],
                items: [],
                isDraft: true
            });
            toast({ title: "Taslak eklendi." });
        } catch (error) {
            console.error("Error adding draft tender:", error);
            toast({ title: "Hata", description: "Taslak eklenemedi.", variant: "destructive" });
        }
    }, [firestore, selectedProject, toast]);

    const addItemToContract = useCallback(async (contractId: string, item: ContractItem) => {
        if (!firestore || !selectedProject || !contracts) return;
        const contract = contracts.find(c => c.id === contractId);
        if (!contract) return;
        
        try {
            const contractRef = doc(firestore, 'projects', selectedProject.id, 'contracts', contractId);
            const newItems = [...contract.items, item];
            await updateDoc(contractRef, { items: newItems });
            toast({ title: "Kalem eklendi." });
        } catch (error) {
            console.error("Error adding item:", error);
            toast({ title: "Hata", description: "Kalem eklenemedi.", variant: "destructive" });
        }
    }, [firestore, selectedProject, contracts, toast]);
    
    const updateContractItem = useCallback(async (contractId: string, updatedItem: ContractItem, originalPoz: string) => {
        if (!firestore || !selectedProject || !contracts) return;
        const contract = contracts.find(c => c.id === contractId);
        if (!contract) return;

        try {
            const contractRef = doc(firestore, 'projects', selectedProject.id, 'contracts', contractId);
            const newItems = contract.items.map(item => item.poz === originalPoz ? updatedItem : item);
            await updateDoc(contractRef, { items: newItems });
            toast({ title: "Kalem güncellendi." });
        } catch (error) {
             console.error("Error updating item:", error);
            toast({ title: "Hata", description: "Kalem güncellenemedi.", variant: "destructive" });
        }
    }, [firestore, selectedProject, contracts, toast]);

    const deleteContractItem = useCallback(async (contractId: string, itemPoz: string) => {
        if (!firestore || !selectedProject || !contracts) return;
        const contract = contracts.find(c => c.id === contractId);
        if (!contract) return;

        try {
            const contractRef = doc(firestore, 'projects', selectedProject.id, 'contracts', contractId);
            const newItems = contract.items.filter(item => item.poz !== itemPoz);
            await updateDoc(contractRef, { items: newItems });
            toast({ title: "Kalem silindi." });
        } catch (error) {
             console.error("Error deleting item:", error);
            toast({ title: "Hata", description: "Kalem silinemedi.", variant: "destructive" });
        }
    }, [firestore, selectedProject, contracts, toast]);

    const updateDraftContractName = useCallback(async (contractId: string, newName: string) => {
        if (!firestore || !selectedProject) return;
        try {
            const contractRef = doc(firestore, 'projects', selectedProject.id, 'contracts', contractId);
            await updateDoc(contractRef, { name: newName });
            toast({ title: "Taslak adı güncellendi." });
        } catch (error) {
            console.error("Error updating draft name:", error);
            toast({ title: "Hata", description: "Taslak adı güncellenemedi.", variant: "destructive" });
        }
    }, [firestore, selectedProject, toast]);
    
    const deleteDraftContract = useCallback(async (contractId: string) => {
        if (!firestore || !selectedProject) return;
        try {
            await deleteDoc(doc(firestore, 'projects', selectedProject.id, 'contracts', contractId));
            toast({ title: "Taslak silindi." });
        } catch (error) {
            console.error("Error deleting draft:", error);
            toast({ title: "Hata", description: "Taslak silinemedi.", variant: "destructive" });
        }
    }, [firestore, selectedProject, toast]);
    
     const approveTender = useCallback(async (tenderId: string) => {
        if (!firestore || !selectedProject) return;
        try {
            const contractRef = doc(firestore, 'projects', selectedProject.id, 'contracts', tenderId);
            await updateDoc(contractRef, { 
                isDraft: false,
                status: 'Onaylandı',
                date: new Date().toISOString().split('T')[0],
            });
            toast({ title: "Sözleşme onaylandı." });
        } catch(e) {
            console.error(e);
            toast({ title: "Hata", description: "Sözleşme onaylanamadı.", variant: "destructive" });
        }
     }, [firestore, selectedProject, toast]);

    const revertContractToDraft = useCallback(async (contractId: string) => {
        if (!firestore || !selectedProject) return;

        // TODO: Check for progress payments before reverting
        
        try {
            const contractRef = doc(firestore, 'projects', selectedProject.id, 'contracts', contractId);
            await updateDoc(contractRef, { 
                isDraft: true,
                status: 'Hazırlık',
            });
            toast({ title: "Sözleşme taslaklara geri alındı." });
        } catch(e) {
            console.error(e);
            toast({ title: "Hata", description: "Sözleşme geri alınamadı.", variant: "destructive" });
        }
    }, [firestore, selectedProject, toast]);


    const groupContracts = (contracts: Contract[]): Record<ContractGroupKeys, Record<string, Contract[]>> => {
      const allGroups = (Object.keys(contractGroups) as ContractGroupKeys[]).reduce((acc, groupKey) => {
          acc[groupKey] = {};
          return acc;
      }, {} as Record<ContractGroupKeys, Record<string, Contract[]>>);

      contracts.forEach(contract => {
        if (allGroups[contract.group]) {
          if (!allGroups[contract.group][contract.subGroup]) {
            allGroups[contract.group][contract.subGroup] = [];
          }
          allGroups[contract.group][contract.subGroup].push(contract);
        }
      });

      for (const groupKey in allGroups) {
          const typedGroupKey = groupKey as ContractGroupKeys;
          const subGroups = Array.from(new Set(contracts.filter(c => c.group === typedGroupKey).map(c => c.subGroup)));
          subGroups.forEach(subGroup => {
              if (!allGroups[typedGroupKey][subGroup]) {
                  allGroups[typedGroupKey][subGroup] = [];
              }
          });
      }

      return allGroups;
    };
    
    const groupedDrafts = groupContracts(draftContracts);
    const groupedApproved = groupContracts(approvedContracts);

  return (
    <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
            <div>
                <CardTitle className="font-headline">Sözleşme Yönetimi</CardTitle>
                <CardDescription>{selectedProject!.name} | Taslak ve onaylı tüm proje sözleşmelerini yönetin.</CardDescription>
            </div>
            </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="drafts">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="drafts">Taslak Sözleşmeler ({draftContracts.length})</TabsTrigger>
            <TabsTrigger value="approved">Onaylı Sözleşmeler ({approvedContracts.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="drafts" className="mt-4">
             <Accordion type="multiple" className="w-full">
                {(Object.keys(contractGroups) as ContractGroupKeys[]).map((groupKey) => {
                    const contractsInGroup = groupedDrafts[groupKey];
                    return (
                        <ContractGroupAccordion 
                            key={groupKey} 
                            title={contractGroups[groupKey]} 
                            contracts={contractsInGroup || {}}
                            onApprove={approveTender}
                            onAddDraft={addDraftTender}
                            onAddItem={addItemToContract}
                            onUpdateItem={updateContractItem}
                            onDeleteItem={deleteContractItem}
                            onRenameContract={updateDraftContractName}
                            onDeleteContract={deleteDraftContract}
                            groupKey={groupKey}
                        />
                    );
                })}
             </Accordion>
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            <Accordion type="multiple" className="w-full">
                {(Object.keys(contractGroups) as ContractGroupKeys[]).map((groupKey) => {
                    const contractsInGroup = groupedApproved[groupKey];
                    const hasContracts = Object.values(contractsInGroup || {}).some(list => list.length > 0);
                    if (!hasContracts) return null;

                    return (
                        <ContractGroupAccordion 
                            key={groupKey} 
                            title={contractGroups[groupKey]} 
                            contracts={contractsInGroup || {}}
                            onRevert={revertContractToDraft}
                            groupKey={groupKey}
                            onUpdateItem={() => {}}
                            onDeleteItem={() => {}}
                        />
                    );
                })}
            </Accordion>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}
