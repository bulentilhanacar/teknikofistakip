"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useProject } from '@/context/project-context';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Calendar as CalendarIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ProgressPayment, ProgressItem, Deduction } from '@/context/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';


export default function ProgressPaymentsPage() {
  const { selectedProject, projectData, saveProgressPayment, getContractsByProject } = useProject();
  
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
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

  const lastProgressPayment = useMemo(() => {
    return contractProgressHistory.length > 0 ? contractProgressHistory.sort((a, b) => b.progressPaymentNumber - a.progressPaymentNumber)[0] : null;
  }, [contractProgressHistory]);
  
  const availableDeductions = useMemo(() => {
      if (!selectedProject || !selectedContractId) return [];
      const allDeductions = projectData.deductions[selectedProject.id] || [];
      return allDeductions.filter(d => (d.contractId === selectedContractId || d.contractId === "all") && d.appliedInPaymentNumber === null);
  }, [selectedProject, selectedContractId, projectData]);


  useEffect(() => {
    setSelectedContractId(null);
    setProgressItems([]);
    setSelectedDeductionIds([]);
    setProgressDate(new Date());
  }, [selectedProject]);


  const handleContractChange = (contractId: string) => {
    setSelectedContractId(contractId);
    setSelectedDeductionIds([]);
    setProgressDate(new Date());
    const projectContracts = getContractsByProject();
    const contract = projectContracts.find(c => c.id === contractId);
    
    if (contract) {
       const history = (selectedProject && projectData.progressPayments[selectedProject.id]?.[contractId]) || [];
       const lastPayment = history.length > 0 ? history.sort((a,b) => b.progressPaymentNumber - a.progressPaymentNumber)[0] : null;

       setProgressItems(contract.items.map((item: any) => {
         const previousItem = lastPayment?.items.find(pi => pi.id === item.poz);
         const previousCumulativeQuantity = previousItem?.cumulativeQuantity || 0;
         const percentage = item.quantity > 0 ? (previousCumulativeQuantity / item.quantity * 100).toFixed(2) : "0.00";
         
         return { 
            id: item.poz,
            description: item.description,
            unit: item.unit,
            unitPrice: item.unitPrice,
            contractQuantity: item.quantity,
            previousCumulativeQuantity: previousCumulativeQuantity,
            currentCumulativeQuantity: previousCumulativeQuantity,
            currentCumulativePercentage: isNaN(parseFloat(percentage)) ? "0.00" : percentage,
         };
       }));
    } else {
      setProgressItems([]);
    }
  };

  const handlePercentageChange = (itemId: string, percentageStr: string) => {
    const percentage = parseFloat(percentageStr);
    if (percentage > 100) return;

    setProgressItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const newCumulativeQuantity = isNaN(percentage) ? item.previousCumulativeQuantity : (item.contractQuantity * percentage) / 100;
          return { ...item, currentCumulativePercentage: percentageStr, currentCumulativeQuantity: newCumulativeQuantity };
        }
        return item;
      })
    );
  };
  
    const handleQuantityChange = (itemId: string, quantityStr: string) => {
      const quantity = parseFloat(quantityStr);
      
      setProgressItems(items =>
        items.map(item => {
          if (item.id === itemId) {
            const newCumulativeQuantity = isNaN(quantity) ? item.previousCumulativeQuantity : quantity;
            if (newCumulativeQuantity > item.contractQuantity) return item; // Don't allow more than contract quantity
            if (newCumulativeQuantity < item.previousCumulativeQuantity) return item; // Don't allow less than previous

            const newPercentage = item.contractQuantity > 0 ? ((newCumulativeQuantity / item.contractQuantity) * 100).toFixed(2) : "0.00";
            return { ...item, currentCumulativePercentage: newPercentage, currentCumulativeQuantity: newCumulativeQuantity };
          }
          return item;
        })
      );
    };

  const handleDeductionSelectionChange = (deductionId: string, isSelected: boolean) => {
      setSelectedDeductionIds(prev => 
        isSelected ? [...prev, deductionId] : prev.filter(id => id !== deductionId)
      );
  }
  
  const summary = useMemo(() => {
    const totalPreviousAmount = lastProgressPayment?.totalAmount || 0;

    const cumulativeSubTotal = progressItems.reduce((acc, item) => acc + (item.currentCumulativeQuantity * item.unitPrice), 0);
    const currentSubTotal = progressItems.reduce((acc, item) => acc + ((item.currentCumulativeQuantity - item.previousCumulativeQuantity) * item.unitPrice), 0);

    const vat = currentSubTotal * 0.20;
    const currentPaymentGross = currentSubTotal + vat;
    
    const totalSelectedDeductions = availableDeductions
        .filter(d => selectedDeductionIds.includes(d.id))
        .reduce((sum, d) => sum + d.amount, 0);

    const finalPaymentAmount = currentPaymentGross - totalSelectedDeductions;
    
    const hasProgress = progressItems.some(item => item.currentCumulativeQuantity > item.previousCumulativeQuantity);


    return {
      cumulativeSubTotal,
      totalPreviousAmount,
      currentSubTotal,
      vat,
      currentPaymentGross,
      totalSelectedDeductions,
      finalPaymentAmount,
      hasProgress,
    };
  }, [progressItems, lastProgressPayment, selectedDeductionIds, availableDeductions]);

  const handleSaveProgressPayment = () => {
    if (!selectedProject || !selectedContractId || !progressDate) return;
    saveProgressPayment(selectedContractId, summary.cumulativeSubTotal, progressItems, selectedDeductionIds, progressDate);
    // Formu sıfırla
    handleContractChange(selectedContractId);
    setSelectedDeductionIds([]);
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
          <CardDescription>{selectedProject.name} | Sözleşme seçerek yeni bir hakediş raporu oluşturun.</CardDescription>
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
            <div>
                <Label>Hakediş No</Label>
                <Input value={`Hakediş No: ${(lastProgressPayment?.progressPaymentNumber || 0) + 1}`} disabled />
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
          </div>
        </CardContent>
      </Card>
      
      {selectedContractId && (
        <>
          {contractProgressHistory.length > 0 && (
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
                        <TableCell>{item.previousCumulativeQuantity.toLocaleString('tr-TR')}</TableCell>
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
                <div className="flex justify-between"><span>Toplam Tutar (Kümülatif):</span><span className='font-semibold'>{formatCurrency(summary.cumulativeSubTotal)}</span></div>
                <div className="flex justify-between"><span>Önceki Hakedişler Toplamı:</span><span>- {formatCurrency(summary.totalPreviousAmount)}</span></div>
                <div className="flex justify-between border-t mt-2 pt-2"><span>Bu Ayki İmalat Toplamı (KDV Hariç):</span><span className='font-semibold'>{formatCurrency(summary.currentSubTotal)}</span></div>
                <div className="flex justify-between"><span>KDV (%20):</span><span>+ {formatCurrency(summary.vat)}</span></div>
                <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Ara Toplam (KDV Dahil):</span><span>{formatCurrency(summary.currentPaymentGross)}</span></div>
                <div className="flex justify-between text-destructive"><span>Uygulanan Kesintiler Toplamı:</span><span>- {formatCurrency(summary.totalSelectedDeductions)}</span></div>
                 <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span className="font-headline">Yükleniciye Ödenecek Net Tutar:</span><span className='text-xl'>{formatCurrency(summary.finalPaymentAmount)}</span></div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button size="lg" onClick={handleSaveProgressPayment} disabled={!summary.hasProgress}>Hakedişi Kaydet ve Raporla</Button>
          </div>
        </>
      )}
    </div>
  );
}
