"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useProject } from '@/context/project-context';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Calendar as CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ProgressPayment, ProgressItem, Deduction, ExtraWorkItem, Contract } from '@/context/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


export default function ProgressPaymentsPage() {
  const { selectedProject, projectData, saveProgressPayment, getContractsByProject } = useProject();
  
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [editingPaymentNumber, setEditingPaymentNumber] = useState<number | null>(null); // null for new, number for editing

  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [extraWorkItems, setExtraWorkItems] = useState<ExtraWorkItem[]>([]);
  const [selectedDeductionIds, setSelectedDeductionIds] = useState<string[]>([]);
  const [progressDate, setProgressDate] = useState<Date | undefined>(new Date());

  const availableContracts = useMemo(() => {
    return getContractsByProject()
        .filter(c => c.status === 'Onaylandı')
        .reduce((acc, c) => {
            acc[c.id] = { name: c.name };
            return acc;
        }, {} as Record<string, {name: string}>);
  }, [selectedProject, projectData, getContractsByProject]);
  
  const contractProgressHistory = useMemo(() => {
    if (selectedProject && selectedContractId && projectData.progressPayments[selectedProject.id]) {
        return projectData.progressPayments[selectedProject.id][selectedContractId] || [];
    }
    return [];
  }, [selectedProject, selectedContractId, projectData]);
  
  const selectedContract = useMemo(() => {
    if (!selectedContractId) return null;
    const projectContracts = getContractsByProject();
    return projectContracts.find(c => c.id === selectedContractId) as Contract | null;
  }, [selectedContractId, getContractsByProject]);

  const paymentToEdit = useMemo(() => {
      if (editingPaymentNumber === null) return null;
      return contractProgressHistory.find(p => p.progressPaymentNumber === editingPaymentNumber) || null;
  }, [editingPaymentNumber, contractProgressHistory]);

  const previousCumulativeState = useMemo(() => {
    const historyToConsider = contractProgressHistory.filter(p => 
        editingPaymentNumber === null || p.progressPaymentNumber < editingPaymentNumber
    );

    const lastRelevantPayment = historyToConsider.length > 0 ? historyToConsider[historyToConsider.length - 1] : null;

    if (!lastRelevantPayment) {
        return { totalAmount: 0, itemQuantities: {} };
    }

    const itemQuantities: Record<string, number> = {};
    lastRelevantPayment.items.forEach(item => {
        itemQuantities[item.id] = item.cumulativeQuantity;
    });

    return { totalAmount: lastRelevantPayment.totalAmount, itemQuantities };
}, [editingPaymentNumber, contractProgressHistory]);


  const availableDeductions = useMemo(() => {
      if (!selectedProject || !selectedContractId) return [];
      const allDeductions = projectData.deductions[selectedProject.id] || [];
      // When editing, show deductions linked to this payment OR unlinked ones.
      // When creating, show only unlinked ones.
      return allDeductions.filter(d => 
        (d.contractId === selectedContractId || d.contractId === "all") && 
        (d.appliedInPaymentNumber === null || d.appliedInPaymentNumber === editingPaymentNumber)
      );
  }, [selectedProject, selectedContractId, projectData, editingPaymentNumber]);


  const loadStateForPayment = useCallback((contract: Contract | null, payment: ProgressPayment | null, prevQtys: Record<string, number>) => {
    if (!contract) {
        setProgressItems([]);
        setExtraWorkItems([]);
        setSelectedDeductionIds([]);
        return;
    };
    
    setExtraWorkItems(payment?.extraWorkItems || []);
    setProgressDate(payment ? new Date(payment.date) : new Date());
    setSelectedDeductionIds(payment?.appliedDeductionIds || []);

    const loadedItems = contract.items.map((item: any) => {
        const previousCumulativeQuantity = prevQtys[item.poz] || 0;
        
        // If editing an existing payment, use its quantities. Otherwise (for a new payment), start with the previous quantities.
        const currentItemState = payment?.items.find(pi => pi.id === item.poz);
        const currentCumulativeQuantity = currentItemState?.cumulativeQuantity ?? previousCumulativeQuantity;
        
        const percentage = item.quantity > 0 ? (currentCumulativeQuantity / item.quantity * 100) : 0;
        
        return { 
            id: item.poz,
            description: item.description,
            unit: item.unit,
            unitPrice: item.unitPrice,
            contractQuantity: item.quantity,
            previousCumulativeQuantity: previousCumulativeQuantity,
            currentCumulativeQuantity: currentCumulativeQuantity,
            currentCumulativePercentage: isNaN(percentage) ? "0.00" : percentage.toFixed(2),
        };
    });
    setProgressItems(loadedItems);
  }, []);

  useEffect(() => {
    // Reset everything when the project changes
    setSelectedContractId(null);
    setEditingPaymentNumber(null);
  }, [selectedProject]);

  useEffect(() => {
    // This effect runs when contract or editing number changes
    // It finds the correct previous state and loads the form accordingly.
     if (!selectedContract) {
         loadStateForPayment(null, null, {});
         return;
     }
     loadStateForPayment(selectedContract, paymentToEdit, previousCumulativeState.itemQuantities);
  }, [selectedContract, paymentToEdit, previousCumulativeState, loadStateForPayment]);


  const handleContractChange = (contractId: string) => {
    setSelectedContractId(contractId);
    setEditingPaymentNumber(null); // Always default to new payment mode when contract changes
  };
  
  const handlePaymentSelectionChange = (paymentNumberStr: string) => {
    setEditingPaymentNumber(paymentNumberStr === "new" ? null : parseInt(paymentNumberStr, 10));
  }


  const handlePercentageChange = (itemId: string, percentageStr: string) => {
    const percentage = parseFloat(percentageStr);
    if (isNaN(percentage)) { // Handle empty input
       setProgressItems(items => items.map(item => item.id === itemId ? { ...item, currentCumulativePercentage: '', currentCumulativeQuantity: item.previousCumulativeQuantity } : item));
       return;
    }
    if (percentage > 100) return;

    setProgressItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const newCumulativeQuantity = (item.contractQuantity * percentage) / 100;
          return { ...item, currentCumulativePercentage: percentageStr, currentCumulativeQuantity: newCumulativeQuantity };
        }
        return item;
      })
    );
  };
  
    const handleQuantityChange = (itemId: string, quantityStr: string) => {
      const quantity = parseFloat(quantityStr);
       if (isNaN(quantity)) { // Handle empty input
            setProgressItems(items => items.map(item => item.id === itemId ? { ...item, currentCumulativePercentage: (item.previousCumulativeQuantity / item.contractQuantity * 100).toFixed(2), currentCumulativeQuantity: item.previousCumulativeQuantity } : item));
            return;
        }
      
      setProgressItems(items =>
        items.map(item => {
          if (item.id === itemId) {
            const newCumulativeQuantity = quantity;
            if (newCumulativeQuantity > item.contractQuantity) return item; // Don't allow more than contract quantity
            if (newCumulativeQuantity < item.previousCumulativeQuantity) return item; // Don't allow less than previous

            const newPercentage = item.contractQuantity > 0 ? ((newCumulativeQuantity / item.contractQuantity) * 100).toFixed(2) : "0.00";
            return { ...item, currentCumulativePercentage: newPercentage, currentCumulativeQuantity: newCumulativeQuantity };
          }
          return item;
        })
      );
    };

    const handleExtraWorkItemChange = (index: number, field: keyof Omit<ExtraWorkItem, 'id'>, value: string) => {
        const newItems = [...extraWorkItems];
        const item = { ...newItems[index] };
        if (field === 'quantity' || field === 'unitPrice') {
            (item[field] as number) = parseFloat(value) || 0;
        } else {
            (item[field] as string) = value;
        }
        newItems[index] = item;
        setExtraWorkItems(newItems);
    };
    
    const addExtraWorkItem = () => {
        setExtraWorkItems(prev => [...prev, {
            id: `extra-${Date.now()}`,
            description: '',
            unit: '',
            quantity: 0,
            unitPrice: 0,
        }]);
    };

    const deleteExtraWorkItem = (index: number) => {
        setExtraWorkItems(prev => prev.filter((_, i) => i !== index));
    };


  const handleDeductionSelectionChange = (deductionId: string, isSelected: boolean) => {
      setSelectedDeductionIds(prev => 
        isSelected ? [...prev, deductionId] : prev.filter(id => id !== deductionId)
      );
  }
  
  const summary = useMemo(() => {
    const totalPreviousAmount = previousCumulativeState.totalAmount;

    const cumulativeSubTotal = progressItems.reduce((acc, item) => acc + (item.currentCumulativeQuantity * item.unitPrice), 0);
    const currentSubTotal = cumulativeSubTotal - totalPreviousAmount;
    
    const extraWorkTotal = extraWorkItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

    const totalCurrentWork = currentSubTotal + extraWorkTotal;
    const vat = totalCurrentWork * 0.20;
    const currentPaymentGross = totalCurrentWork + vat;
    
    const totalSelectedDeductions = availableDeductions
        .filter(d => selectedDeductionIds.includes(d.id))
        .reduce((sum, d) => sum + d.amount, 0);

    const finalPaymentAmount = currentPaymentGross - totalSelectedDeductions;
    
    const hasProgress = progressItems.some(item => item.currentCumulativeQuantity > item.previousCumulativeQuantity) || extraWorkItems.length > 0;


    return {
      cumulativeSubTotal,
      totalPreviousAmount,
      currentSubTotal,
      extraWorkTotal,
      totalCurrentWork,
      vat,
      currentPaymentGross,
      totalSelectedDeductions,
      finalPaymentAmount,
      hasProgress,
    };
  }, [progressItems, extraWorkItems, previousCumulativeState, selectedDeductionIds, availableDeductions]);

  const handleSaveProgressPayment = () => {
    if (!selectedProject || !selectedContractId || !progressDate || !selectedContract) return;
    
    const paymentData: Omit<ProgressPayment, 'progressPaymentNumber'> = {
        date: format(progressDate, 'yyyy-MM-dd'),
        totalAmount: summary.cumulativeSubTotal,
        items: progressItems.map(item => ({
            id: item.id,
            cumulativeQuantity: item.currentCumulativeQuantity,
        })),
        extraWorkItems,
        appliedDeductionIds: selectedDeductionIds,
    };
    
    saveProgressPayment(selectedContractId, paymentData, editingPaymentNumber);
    setEditingPaymentNumber(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  }
  
  if (!selectedProject) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Hakediş Hesaplama</CardTitle>
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
          <CardTitle className="font-headline">Hakediş Hesaplama</CardTitle>
          <CardDescription>{selectedProject.name} | Sözleşme seçerek yeni bir hakediş raporu oluşturun veya eskisini düzenleyin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <div className='md:col-span-1'>
                <Label htmlFor='contract'>Sözleşme</Label>
                <Select onValueChange={handleContractChange} value={selectedContractId || ""} name="contract">
                <SelectTrigger>
                    <SelectValue placeholder="Hakediş yapılacak sözleşmeyi seçin" />
                </SelectTrigger>
                <SelectContent>
                    {Object.keys(availableContracts).length > 0 ? Object.keys(availableContracts).map(contractId => (
                        <SelectItem key={contractId} value={contractId}>{`${contractId}: ${availableContracts[contractId].name}`}</SelectItem>
                    )) : (
                        <div className="p-4 text-sm text-muted-foreground">Bu proje için onaylı sözleşme bulunmuyor.</div>
                    )}
                </SelectContent>
                </Select>
            </div>
            {selectedContractId && (
              <>
                <div>
                  <Label>Hakediş No</Label>
                  <Select 
                      value={editingPaymentNumber === null ? "new" : String(editingPaymentNumber)}
                      onValueChange={handlePaymentSelectionChange}
                  >
                      <SelectTrigger>
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="new">Yeni Hakediş Oluştur (#{(contractProgressHistory.at(-1)?.progressPaymentNumber || 0) + 1})</SelectItem>
                          {contractProgressHistory.map(p => (
                              <SelectItem key={p.progressPaymentNumber} value={String(p.progressPaymentNumber)}>
                                  Hakediş #{p.progressPaymentNumber} Düzenle
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
                <div>
                    <Label>Hakediş Tarihi</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !progressDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {progressDate ? format(progressDate, "PPP") : <span>Tarih seçin</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={progressDate}
                                onSelect={setProgressDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {selectedContractId && (
        <>
          {contractProgressHistory.length > 0 && editingPaymentNumber === null && (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Önceki Hakedişler</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hakediş No</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead className="text-right">Kümülatif Tutar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contractProgressHistory.map(p => (
                                <TableRow key={p.progressPaymentNumber}>
                                    <TableCell><Badge variant="secondary">#{p.progressPaymentNumber}</Badge></TableCell>
                                    <TableCell>{p.date}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(p.totalAmount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">İmalat Miktarları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Poz No</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Söz. Miktarı</TableHead>
                      <TableHead>Önceki Miktar</TableHead>
                      <TableHead>% İlerleme</TableHead>
                      <TableHead>Toplam Miktar</TableHead>
                      <TableHead>Bu Ayki Miktar</TableHead>
                      <TableHead className="text-right">Bu Ayki Tutar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {progressItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.contractQuantity.toLocaleString('tr-TR')} {item.unit}</TableCell>
                        <TableCell>{item.previousCumulativeQuantity.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                            <div className="flex items-center">
                                <Input 
                                    className="w-20" 
                                    type="number"
                                    value={item.currentCumulativePercentage}
                                    onChange={(e) => handlePercentageChange(item.id, e.target.value)}
                                    min={item.contractQuantity > 0 ? (item.previousCumulativeQuantity / item.contractQuantity * 100).toFixed(2) : "0"}
                                    max="100"
                                    step="0.01"
                                />
                                <span className="ml-1">%</span>
                            </div>
                        </TableCell>
                        <TableCell>
                           <Input 
                                className="w-24"
                                type="number"
                                value={item.currentCumulativeQuantity.toFixed(2)}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                min={item.previousCumulativeQuantity}
                                max={item.contractQuantity}
                                step="0.01"
                           />
                        </TableCell>
                        <TableCell className='font-semibold'>{(item.currentCumulativeQuantity - item.previousCumulativeQuantity).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency((item.currentCumulativeQuantity - item.previousCumulativeQuantity) * item.unitPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
           <Card>
                <CardHeader>
                    <div className='flex justify-between items-center'>
                         <CardTitle className="font-headline">Sözleşme Dışı İmalatlar</CardTitle>
                         <Button variant="outline" size="sm" onClick={addExtraWorkItem}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Yeni Kalem Ekle
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                     {extraWorkItems.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className='w-[50px]'>Sıra</TableHead>
                                    <TableHead>Açıklama</TableHead>
                                    <TableHead className='w-[100px]'>Birim</TableHead>
                                    <TableHead className='w-[120px] text-right'>Miktar</TableHead>
                                    <TableHead className='w-[150px] text-right'>Birim Fiyat</TableHead>
                                    <TableHead className='w-[150px] text-right'>Tutar</TableHead>
                                    <TableHead className="w-[80px] text-center">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {extraWorkItems.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>
                                            <Input value={item.description} onChange={(e) => handleExtraWorkItemChange(index, 'description', e.target.value)} placeholder="Yeni imalat açıklaması" />
                                        </TableCell>
                                        <TableCell>
                                            <Input value={item.unit} onChange={(e) => handleExtraWorkItemChange(index, 'unit', e.target.value)} placeholder="m²" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" value={item.quantity} onChange={(e) => handleExtraWorkItemChange(index, 'quantity', e.target.value)} className="text-right" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" value={item.unitPrice} onChange={(e) => handleExtraWorkItemChange(index, 'unitPrice', e.target.value)} className="text-right" />
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                                        <TableCell className="text-center">
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
                                                            Bu sözleşme dışı kalemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteExtraWorkItem(index)}>Sil</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="font-bold bg-muted">
                                    <TableCell colSpan={5} className="text-right">Sözleşme Dışı İmalatlar Toplamı</TableCell>
                                    <TableCell className="text-right">{formatCurrency(summary.extraWorkTotal)}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                     ) : (
                         <div className="text-center text-muted-foreground p-4">Bu hakediş için sözleşme dışı imalat eklenmemiş.</div>
                     )}
                </CardContent>
            </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                    Uygulanacak Kesintiler
                  </CardTitle>
                  <CardDescription>Bu hakedişten düşülecek kesintileri seçin.</CardDescription>
              </CardHeader>
              <CardContent>
                  {availableDeductions.length > 0 ? (
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-[50px]"></TableHead>
                                  <TableHead>Açıklama</TableHead>
                                  <TableHead>Sözleşme</TableHead>
                                  <TableHead>Tür</TableHead>
                                  <TableHead className="text-right">Tutar</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {availableDeductions.map(deduction => (
                                  <TableRow key={deduction.id} className={selectedDeductionIds.includes(deduction.id) ? "bg-muted/50" : ""}>
                                      <TableCell>
                                          <Checkbox
                                              id={`ded-${deduction.id}`}
                                              checked={selectedDeductionIds.includes(deduction.id)}
                                              onCheckedChange={(checked) => handleDeductionSelectionChange(deduction.id, !!checked)}
                                          />
                                      </TableCell>
                                      <TableCell className="font-medium">{deduction.description}</TableCell>
                                       <TableCell>{deduction.contractId === "all" ? "Proje Geneli" : deduction.contractId}</TableCell>
                                      <TableCell>
                                          <Badge variant={deduction.type === 'muhasebe' ? 'secondary' : 'outline'}>
                                              {deduction.type === 'muhasebe' ? 'Muhasebe' : 'Tutanaklı'}
                                          </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">{formatCurrency(deduction.amount)}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  ) : (
                      <div className="flex items-center justify-center h-24 text-muted-foreground">
                          Bu sözleşme için uygulanabilir kesinti bulunmuyor.
                      </div>
                  )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Hakediş Özeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Kümülatif Sözleşme Tutarı:</span><span className='font-semibold'>{formatCurrency(summary.cumulativeSubTotal)}</span></div>
                <div className="flex justify-between"><span>Önceki Hakedişler Toplamı:</span><span>- {formatCurrency(summary.totalPreviousAmount)}</span></div>
                <div className="flex justify-between border-t mt-2 pt-2">
                    <span>Bu Ayki Sözleşme İmalat Tutarı:</span><span className='font-semibold'>{formatCurrency(summary.currentSubTotal)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Bu Ayki Sözleşme Dışı İmalat Tutarı:</span><span className='font-semibold'>+ {formatCurrency(summary.extraWorkTotal)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Ara Toplam (KDV Hariç):</span><span>{formatCurrency(summary.totalCurrentWork)}</span>
                </div>
                <div className="flex justify-between"><span>KDV (%20):</span><span>+ {formatCurrency(summary.vat)}</span></div>
                <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Genel Toplam (KDV Dahil):</span><span>{formatCurrency(summary.currentPaymentGross)}</span></div>
                <div className="flex justify-between text-destructive"><span>Uygulanan Kesintiler Toplamı:</span><span>- {formatCurrency(summary.totalSelectedDeductions)}</span></div>
                 <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span className="font-headline">Yükleniciye Ödenecek Net Tutar:</span><span className='text-xl'>{formatCurrency(summary.finalPaymentAmount)}</span></div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button size="lg" onClick={handleSaveProgressPayment} disabled={!summary.hasProgress}>
                {editingPaymentNumber === null ? 'Hakedişi Kaydet ve Raporla' : 'Değişiklikleri Kaydet'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
