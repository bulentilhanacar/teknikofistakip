"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useProject } from '@/context/project-context';
import { PlusCircle, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Deduction, Contract } from '@/context/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


const newDeductionInitialState = {
    contractId: 'all',
    type: 'muhasebe' as 'muhasebe' | 'tutanakli',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: ''
};

export default function DeductionsPage() {
    const { selectedProject } = useProject();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [newDeduction, setNewDeduction] = useState(newDeductionInitialState);
    const [date, setDate] = useState<Date | undefined>(new Date());

    const contractsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedProject) return null;
        return query(
            collection(firestore, 'projects', selectedProject.id, 'contracts'),
            where('isDraft', '==', false)
        );
    }, [firestore, selectedProject]);
    const { data: approvedContracts, isLoading: contractsLoading } = useCollection<Contract>(contractsQuery);

    const deductionsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedProject) return null;
        return collection(firestore, 'projects', selectedProject.id, 'deductions');
    }, [firestore, selectedProject]);
    const { data: allDeductions, isLoading: deductionsLoading } = useCollection<Deduction>(deductionsQuery);
    
    useEffect(() => {
        if (selectedProject) {
            setNewDeduction(prev => ({ ...prev, contractId: 'all' }));
        } else {
            setNewDeduction(newDeductionInitialState);
        }
    }, [selectedProject]);
    
    const projectDeductions = useMemo(() => {
        if (!allDeductions) return [];
        const sortedDeductions = [...allDeductions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (newDeduction.contractId === 'all') {
            return sortedDeductions;
        }
        return sortedDeductions.filter(d => d.contractId === newDeduction.contractId);

    }, [allDeductions, newDeduction.contractId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string, field: keyof typeof newDeduction) => {
        const value = typeof e === 'string' ? e : e.target.value;
        setNewDeduction(prev => ({ ...prev, [field]: value }));
    };

    const handleAddDeduction = useCallback(async () => {
        if (!firestore || !selectedProject || !newDeduction.contractId || newDeduction.contractId === 'all' || !newDeduction.amount || !newDeduction.description || !date) {
            alert("Lütfen bir sözleşme seçin ve tüm alanları doldurun.");
            return;
        }

        try {
            await addDoc(collection(firestore, 'projects', selectedProject.id, 'deductions'), {
                contractId: newDeduction.contractId,
                type: newDeduction.type,
                date: format(date, 'yyyy-MM-dd'),
                amount: parseFloat(newDeduction.amount),
                description: newDeduction.description,
                appliedInPaymentNumber: null,
            });
            
            toast({ title: "Kesinti eklendi." });
            setNewDeduction(prev => ({
                ...newDeductionInitialState,
                contractId: prev.contractId 
            }));
            setDate(new Date());

        } catch (error) {
            console.error("Error adding deduction:", error);
            toast({ title: "Hata", description: "Kesinti eklenemedi.", variant: "destructive" });
        }
    }, [firestore, selectedProject, newDeduction, date, toast]);

    const deleteDeduction = useCallback(async (deduction: Deduction) => {
        if (!firestore || !selectedProject) return;

        if (deduction.appliedInPaymentNumber !== null) {
            toast({
                variant: "destructive",
                title: "İşlem Başarısız",
                description: "Bu kesinti bir hakedişe uygulandığı için silinemez.",
            });
            return;
        }

        try {
            await deleteDoc(doc(firestore, 'projects', selectedProject.id, 'deductions', deduction.id));
            toast({ title: "Kesinti Silindi" });
        } catch (error) {
             console.error("Error deleting deduction:", error);
            toast({ title: "Hata", description: "Kesinti silinemedi.", variant: "destructive" });
        }
    }, [firestore, selectedProject, toast]);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    if (!selectedProject) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Kesinti Yönetimi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        Lütfen devam etmek için bir proje seçin.
                    </div>
                </CardContent>
            </Card>
        );
    }
    
     if (contractsLoading || deductionsLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Kesinti Yönetimi</CardTitle>
                    <CardDescription>{selectedProject.name} | Bu proje kapsamındaki sözleşmelere yeni kesinti ekleyin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        Yükleniyor...
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Yeni Kesinti Ekle</CardTitle>
                    <CardDescription>{selectedProject.name} | Bu proje kapsamındaki sözleşmelere yeni kesinti ekleyin.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 grid gap-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="contractId">İlgili Sözleşme</Label>
                                <Select value={newDeduction.contractId} onValueChange={(value) => handleInputChange(value, 'contractId')}>
                                    <SelectTrigger id="contractId">
                                        <SelectValue placeholder="Sözleşme seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tüm Sözleşmeler</SelectItem>
                                        {(approvedContracts && approvedContracts.length > 0) ? approvedContracts.map(contract => (
                                            <SelectItem key={contract.id} value={contract.id}>{`${contract.id.substring(0,5)}...: ${contract.name}`}</SelectItem>
                                        )) : (
                                            <div className="p-4 text-sm text-muted-foreground">Onaylı sözleşme bulunmuyor.</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                               <Label htmlFor="date">Kesinti Tarihi</Label>
                               <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Tarih seçin</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="description">Açıklama</Label>
                            <Textarea id="description" placeholder="Kesinti açıklamasını girin..." value={newDeduction.description} onChange={(e) => handleInputChange(e, 'description')} />
                        </div>
                    </div>
                     <div className="grid gap-4 content-start">
                         <div>
                            <Label htmlFor="type">Kesinti Türü</Label>
                            <Select value={newDeduction.type} onValueChange={(value) => handleInputChange(value as 'muhasebe' | 'tutanakli', 'type')}>
                                <SelectTrigger id="type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="muhasebe">Muhasebe Kesintisi</SelectItem>
                                    <SelectItem value="tutanakli">Tutanaklı Kesinti</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="amount">Tutar (TRY)</Label>
                            <Input id="amount" type="number" placeholder="Örn: 5000" value={newDeduction.amount} onChange={(e) => handleInputChange(e, 'amount')} />
                        </div>
                        <Button className="w-full" onClick={handleAddDeduction} disabled={!newDeduction.contractId || newDeduction.contractId === 'all'}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Kesintiyi Kaydet
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Mevcut Kesintiler</CardTitle>
                    <CardDescription>
                        {newDeduction.contractId !== 'all' ? `Sözleşmeye ait kesintiler.` : `Projedeki tüm kesintiler.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sözleşme</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Tür</TableHead>
                                <TableHead>Açıklama</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right">Tutar</TableHead>
                                <TableHead className="w-[100px] text-center">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projectDeductions.length > 0 ? projectDeductions.map(d => (
                                <TableRow key={d.id}>
                                    <TableCell className="font-mono text-xs">{d.contractId.substring(0,5)}...</TableCell>
                                    <TableCell>{d.date}</TableCell>
                                    <TableCell>
                                       <Badge variant={d.type === 'muhasebe' ? 'secondary' : 'outline'}>
                                            {d.type === 'muhasebe' ? 'Muhasebe' : 'Tutanaklı'}
                                       </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{d.description}</TableCell>
                                    <TableCell>
                                        {d.appliedInPaymentNumber ? (
                                            <Badge variant="default">Hakediş #{d.appliedInPaymentNumber} uygulandı</Badge>
                                        ) : (
                                            <Badge variant="outline">Bekliyor</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(d.amount)}</TableCell>
                                    <TableCell className="text-center">
                                        {!d.appliedInPaymentNumber && (
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
                                                            Bu kesintiyi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteDeduction(d)}>Sil</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                       {newDeduction.contractId !== 'all'
                                            ? "Seçili sözleşme için kesinti bulunmuyor."
                                            : "Bu proje için henüz kesinti eklenmemiş."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
