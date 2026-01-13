"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useProject } from '@/context/project-context';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Örnek veri setleri
const projectContractData: Record<string, any> = {
  "proje-istanbul": {
    "SOZ-001": { name: "İstanbul Ofis Binası - Betonarme" },
    "SOZ-002": { name: 'Eskişehir Villa Projesi - Lamine Parke' },
  },
  "proje-ankara": {}
};

const initialDeductionsData: Record<string, Deduction[]> = {
    "proje-istanbul": [
        { id: 'DED-001', contractId: 'SOZ-001', type: 'muhasebe', date: '2024-07-15', amount: 5000, description: 'Teminat Mektubu Komisyonu', appliedInPaymentNumber: null },
        { id: 'DED-002', contractId: 'SOZ-001', type: 'tutanakli', date: '2024-07-18', amount: 12500, description: 'Hatalı imalat tespiti', appliedInPaymentNumber: 1 },
        { id: 'DED-003', contractId: 'SOZ-002', type: 'muhasebe', date: '2024-07-25', amount: 2500, description: 'Damga Vergisi', appliedInPaymentNumber: null },
    ],
    "proje-ankara": []
};

interface Deduction {
    id: string;
    contractId: string;
    type: 'muhasebe' | 'tutanakli';
    date: string; 
    amount: number;
    description: string;
    appliedInPaymentNumber: number | null; 
}

const newDeductionInitialState = {
    contractId: '',
    type: 'muhasebe' as 'muhasebe' | 'tutanakli',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: ''
};

export default function DeductionsPage() {
    const { selectedProject } = useProject();
    const [deductions, setDeductions] = useState(initialDeductionsData);
    const [availableContracts, setAvailableContracts] = useState<Record<string, any>>({});
    const [newDeduction, setNewDeduction] = useState(newDeductionInitialState);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [filterContractId, setFilterContractId] = useState<string>('all');


    useEffect(() => {
        if (selectedProject) {
            setAvailableContracts(projectContractData[selectedProject.id] || {});
        } else {
            setAvailableContracts({});
        }
        // Proje değiştiğinde formu ve filtreyi sıfırla
        setNewDeduction({ ...newDeductionInitialState, contractId: '' });
        setFilterContractId('all');
    }, [selectedProject]);
    
    const projectDeductions = useMemo(() => {
        if (!selectedProject) return [];
        const allDeductions = (deductions[selectedProject.id] || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (filterContractId === 'all') {
            return allDeductions;
        }
        return allDeductions.filter(d => d.contractId === filterContractId);

    }, [selectedProject, deductions, filterContractId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string, field: keyof typeof newDeduction) => {
        const value = typeof e === 'string' ? e : e.target.value;
        setNewDeduction(prev => ({ ...prev, [field]: value }));
    };

    const handleAddDeduction = () => {
        if (!selectedProject || !newDeduction.contractId || !newDeduction.amount || !newDeduction.description || !date) {
            alert("Lütfen tüm alanları doldurun.");
            return;
        }

        const newEntry: Deduction = {
            id: `DED-${String(Date.now()).slice(-5)}`,
            contractId: newDeduction.contractId,
            type: newDeduction.type,
            date: format(date, 'yyyy-MM-dd'),
            amount: parseFloat(newDeduction.amount),
            description: newDeduction.description,
            appliedInPaymentNumber: null
        };
        
        setDeductions(prev => {
            const updatedProjectDeductions = [...(prev[selectedProject.id] || []), newEntry];
            return {
                ...prev,
                [selectedProject.id]: updatedProjectDeductions
            };
        });

        // Formu temizle
        setNewDeduction(newDeductionInitialState);
        setDate(new Date());
    };
    
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
                                        <SelectValue placeholder="Sözleşme seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(availableContracts).length > 0 ? Object.keys(availableContracts).map(contractId => (
                                            <SelectItem key={contractId} value={contractId}>{`${contractId}: ${availableContracts[contractId].name}`}</SelectItem>
                                        )) : (
                                            <div className="p-4 text-sm text-muted-foreground">Bu proje için sözleşme bulunmuyor.</div>
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
                            <Select value={newDeduction.type} onValueChange={(value) => handleInputChange(value, 'type')}>
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
                        <Button className="w-full" onClick={handleAddDeduction}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Kesintiyi Kaydet
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex-1">
                        <CardTitle className="font-headline">Mevcut Kesintiler</CardTitle>
                    </div>
                     <div className="w-full max-w-sm">
                        <Select value={filterContractId} onValueChange={setFilterContractId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sözleşmeye göre filtrele" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Sözleşmeler</SelectItem>
                                {Object.keys(availableContracts).map(contractId => (
                                    <SelectItem key={contractId} value={contractId}>{`${contractId}: ${availableContracts[contractId].name}`}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projectDeductions.length > 0 ? projectDeductions.map(d => (
                                <TableRow key={d.id}>
                                    <TableCell className="font-mono text-xs">{d.contractId}</TableCell>
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
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                       {filterContractId === 'all'
                                            ? "Bu proje için henüz kesinti eklenmemiş."
                                            : "Seçili sözleşme için kesinti bulunmuyor."}
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
