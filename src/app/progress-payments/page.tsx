"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useProject } from '@/context/project-context';
import { Badge } from '@/components/ui/badge';
import { Paperclip } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ProgressPayment, ProgressItem, Deduction } from '@/context/types';


export default function ProgressPaymentsPage() {
  const { selectedProject, projectData, saveProgressPayment, getContractsByProject } = useProject();
  
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [selectedDeductionIds, setSelectedDeductionIds] = useState<string[]>([]);

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
    return contractProgressHistory.length > 0 ? contractProgressHistory[contractProgressHistory.length - 1] : null;
  }, [contractProgressHistory]);
  
  const availableDeductions = useMemo(() => {
      if (!selectedProject || !selectedContractId) return [];
      const allDeductions = projectData.deductions[selectedProject.id] || [];
      return allDeductions.filter(d => d.contractId === selectedContractId && d.appliedInPaymentNumber === null);
  }, [selectedProject, selectedContractId, projectData]);


  useEffect(() => {
    setSelectedContractId(null);
    setProgressItems([]);
    setSelectedDeductionIds([]);
  }, [selectedProject]);


  const handleContractChange = (contractId: string) => {
    setSelectedContractId(contractId);
    setSelectedDeductionIds([]);
    const projectContracts = getContractsByProject();
    const contract = projectContracts.find(c => c.id === contractId);
    
    if (contract) {
       const history = (selectedProject && projectData.progressPayments[selectedProject.id]?.[contractId]) || [];
       const lastPayment = history.length > 0 ? history[history.length - 1] : null;

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
            currentCumulativePercentage: percentage
         };
       }));
    } else {
      setProgressItems([]);
    }
  };

  const handlePercentageChange = (itemId: string, percentageStr: string) => {
    const percentage = parseFloat(percentageStr);
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

    return {
      cumulativeSubTotal,
      totalPreviousAmount,
      currentSubTotal,
      vat,
      currentPaymentGross,
      totalSelectedDeductions,
      finalPaymentAmount
    };
  }, [progressItems, lastProgressPayment, selectedDeductionIds, availableDeductions]);

  const handleSaveProgressPayment = () => {
    if (!selectedProject || !selectedContractId) return;
    saveProgressPayment(selectedContractId, summary.cumulativeSubTotal, progressItems, selectedDeductionIds);
    // Formu sıfırla
    handleContractChange(selectedContractId);
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
          <div className="flex flex-wrap items-center gap-4">
            <Select onValueChange={handleContractChange} value={selectedContractId || ""}>
              <SelectTrigger className="w-full sm:w-[400px]">
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
            <div className="flex items-center gap-2">
                <Input value={`Hakediş No: ${(lastProgressPayment?.progressPaymentNumber || 0) + 1}`} className="w-full sm:w-[200px]" disabled />
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
                                    min="0"
                                    step="0.01"
                                />
                                <span className="ml-1">%</span>
                            </div>
                        </TableCell>
                        <TableCell>{item.currentCumulativeQuantity.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</TableCell>
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
                                  <TableHead>Tarih</TableHead>
                                  <TableHead>Açıklama</TableHead>
                                  <TableHead>Tür</TableHead>
                                  <TableHead className="text-right">Tutar</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {availableDeductions.map(deduction => (
                                  <TableRow key={deduction.id}>
                                      <TableCell>
                                          <Checkbox
                                              id={`ded-${deduction.id}`}
                                              checked={selectedDeductionIds.includes(deduction.id)}
                                              onCheckedChange={(checked) => handleDeductionSelectionChange(deduction.id, !!checked)}
                                          />
                                      </TableCell>
                                      <TableCell>{deduction.date}</TableCell>
                                      <TableCell className="font-medium">{deduction.description}</TableCell>
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
            <Button size="lg" onClick={handleSaveProgressPayment}>Hakedişi Kaydet ve Raporla</Button>
          </div>
        </>
      )}
    </div>
  );
}
