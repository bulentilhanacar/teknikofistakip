"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useProject } from '@/context/project-context';
import { Badge } from '@/components/ui/badge';

// Projelerin sözleşme verilerini simüle ediyoruz
const projectContractData: Record<string, any> = {
  "proje-istanbul": {
    "SOZ-001": {
        name: "İstanbul Ofis Binası - Betonarme",
        items: [
          { id: 'Y.16.050/01', description: 'Betonarme Kalıbı', unit: 'm²', unitPrice: 350, contractQuantity: 1200 },
          { id: '15.140.1001', description: 'C30/37 Hazır Beton', unit: 'm³', unitPrice: 2800, contractQuantity: 800 },
          { id: '23.215.1105', description: 'İç Duvar Boyası', unit: 'm²', unitPrice: 120, contractQuantity: 2500 },
          { id: '18.195.1101', description: 'Seramik Yer Karosu', unit: 'm²', unitPrice: 450, contractQuantity: 600 },
        ]
    },
    "SOZ-002": {
        name: 'Eskişehir Villa Projesi - Lamine Parke',
        items: [
           { id: '25.115.1402', description: 'Lamine Parke', unit: 'm²', unitPrice: 1800, contractQuantity: 450 },
        ]
    },
  },
  "proje-ankara": {
      // Ankara projesi için henüz onaylı sözleşme yok
  }
};

// Hakediş geçmişini saklamak için yeni veri yapısı
const initialProgressHistory: Record<string, Record<string, ProgressPayment[]>> = {
    "proje-istanbul": {
        "SOZ-001": [
            {
                progressPaymentNumber: 1,
                date: "2024-07-20",
                totalAmount: 227500,
                items: [
                    { id: 'Y.16.050/01', cumulativeQuantity: 500 },
                    { id: '15.140.1001', cumulativeQuantity: 200 },
                    { id: '23.215.1105', cumulativeQuantity: 0 },
                    { id: '18.195.1101', cumulativeQuantity: 0 },
                ]
            }
        ]
    }
}


interface ProgressItem {
  id: string;
  description: string;
  unit: string;
  unitPrice: number;
  contractQuantity: number;
  previousCumulativeQuantity: number;
  currentCumulativeQuantity: number;
  currentCumulativePercentage: string; // Yüzde girişi için string
}

interface ProgressPayment {
    progressPaymentNumber: number;
    date: string;
    totalAmount: number;
    items: {
        id: string;
        cumulativeQuantity: number;
    }[];
}


export default function ProgressPaymentsPage() {
  const { selectedProject } = useProject();
  const [availableContracts, setAvailableContracts] = useState<Record<string, any>>({});
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [deductions, setDeductions] = useState({ stampDuty: 0.00948, ssi: 0.03 });
  const [progressHistory, setProgressHistory] = useState(initialProgressHistory);
  
  const contractProgressHistory = useMemo(() => {
    if (selectedProject && selectedContract && progressHistory[selectedProject.id]) {
        return progressHistory[selectedProject.id][selectedContract] || [];
    }
    return [];
  }, [selectedProject, selectedContract, progressHistory]);

  const lastProgressPayment = useMemo(() => {
    return contractProgressHistory.length > 0 ? contractProgressHistory[contractProgressHistory.length - 1] : null;
  }, [contractProgressHistory]);


  useEffect(() => {
    if (selectedProject && projectContractData[selectedProject.id]) {
        setAvailableContracts(projectContractData[selectedProject.id]);
    } else {
        setAvailableContracts({});
    }
    setSelectedContract(null);
    setProgressItems([]);
  }, [selectedProject]);


  const handleContractChange = (contractId: string) => {
    setSelectedContract(contractId);
    const contract = availableContracts[contractId];
    
    if (contract) {
       const history = (selectedProject && progressHistory[selectedProject.id]?.[contractId]) || [];
       const lastPayment = history.length > 0 ? history[history.length - 1] : null;

       setProgressItems(contract.items.map((item: any) => {
         const previousItem = lastPayment?.items.find(pi => pi.id === item.id);
         const previousCumulativeQuantity = previousItem?.cumulativeQuantity || 0;
         const percentage = item.contractQuantity > 0 ? (previousCumulativeQuantity / item.contractQuantity * 100).toFixed(2) : "0.00";
         
         return { 
            ...item, 
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
  
  const summary = useMemo(() => {
    const totalPreviousAmount = lastProgressPayment?.totalAmount || 0;

    const cumulativeSubTotal = progressItems.reduce((acc, item) => acc + (item.currentCumulativeQuantity * item.unitPrice), 0);
    const currentSubTotal = progressItems.reduce((acc, item) => acc + ((item.currentCumulativeQuantity - item.previousCumulativeQuantity) * item.unitPrice), 0);

    const vat = currentSubTotal * 0.20;
    const grossTotal = currentSubTotal + vat;
    
    // Kesintiler bu hakedişin brüt tutarı üzerinden hesaplanır
    const stampDutyAmount = grossTotal * deductions.stampDuty;
    const ssiAmount = currentSubTotal * deductions.ssi;
    
    const currentPaymentTotal = grossTotal - stampDutyAmount - ssiAmount;

    return {
      cumulativeSubTotal,
      totalPreviousAmount,
      currentSubTotal,
      vat,
      stampDutyAmount,
      ssiAmount,
      currentPaymentTotal
    };
  }, [progressItems, deductions, lastProgressPayment]);

  const saveProgressPayment = () => {
    if (!selectedProject || !selectedContract) return;

    const newPaymentNumber = (lastProgressPayment?.progressPaymentNumber || 0) + 1;

    const newPayment: ProgressPayment = {
        progressPaymentNumber: newPaymentNumber,
        date: new Date().toISOString().split('T')[0],
        totalAmount: summary.cumulativeSubTotal,
        items: progressItems.map(item => ({
            id: item.id,
            cumulativeQuantity: item.currentCumulativeQuantity,
        }))
    };
    
    setProgressHistory(prev => {
        const newProjectHistory = { ...(prev[selectedProject.id] || {}) };
        const newContractHistory = [...(newProjectHistory[selectedContract] || []), newPayment];
        newProjectHistory[selectedContract] = newContractHistory;
        
        return {
            ...prev,
            [selectedProject.id]: newProjectHistory
        };
    });
    
    // Reset the form for the next payment
    handleContractChange(selectedContract);
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
            <Select onValueChange={handleContractChange} value={selectedContract || ""}>
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
      
      {selectedContract && (
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
                                    max="100"
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
                <CardTitle className="font-headline">Kesintiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center gap-4">
                    <label htmlFor="stamp-duty" className="text-sm font-medium">Damga Vergisi (%)</label>
                    <Input id="stamp-duty" type="number" value={deductions.stampDuty * 100} onChange={e => setDeductions(d => ({...d, stampDuty: parseFloat(e.target.value)/100 || 0}))} className="w-24" />
                 </div>
                 <div className="flex items-center gap-4">
                    <label htmlFor="ssi" className="text-sm font-medium">SGK Kesintisi (%)</label>
                    <Input id="ssi" type="number" value={deductions.ssi * 100} onChange={e => setDeductions(d => ({...d, ssi: parseFloat(e.target.value)/100 || 0}))} className="w-24" />
                 </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Hakediş Özeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Toplam Tutar (Kümülatif):</span><span className='font-semibold'>{formatCurrency(summary.cumulativeSubTotal)}</span></div>
                <div className="flex justify-between"><span>Önceki Hakedişler Toplamı:</span><span>- {formatCurrency(summary.totalPreviousAmount)}</span></div>
                <div className="flex justify-between border-t mt-2 pt-2"><span>Bu Ayki İmalat Toplamı:</span><span className='font-semibold'>{formatCurrency(summary.currentSubTotal)}</span></div>
                <div className="flex justify-between"><span>KDV (%20):</span><span>+ {formatCurrency(summary.vat)}</span></div>
                <div className="flex justify-between text-destructive"><span>Damga Vergisi (%{deductions.stampDuty * 100}):</span><span>- {formatCurrency(summary.stampDutyAmount)}</span></div>
                <div className="flex justify-between text-destructive"><span>SGK Kesintisi (%{deductions.ssi * 100}):</span><span>- {formatCurrency(summary.ssiAmount)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span className="font-headline">Bu Ay Ödenecek Tutar:</span><span className='text-xl'>{formatCurrency(summary.currentPaymentTotal)}</span></div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button size="lg" onClick={saveProgressPayment}>Hakedişi Kaydet ve Raporla</Button>
          </div>
        </>
      )}
    </div>
  );
}
