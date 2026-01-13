"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useProject } from '@/context/project-context';

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

interface ProgressItem {
  id: string;
  description: string;
  unit: string;
  unitPrice: number;
  contractQuantity: number;
  currentQuantity: number;
}

export default function ProgressPaymentsPage() {
  const { selectedProject } = useProject();
  const [availableContracts, setAvailableContracts] = useState<Record<string, any>>({});
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [deductions, setDeductions] = useState({ stampDuty: 0.00948, ssi: 0.03 });

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
      setProgressItems(contract.items.map((item: any) => ({ ...item, currentQuantity: 0 })));
    } else {
      setProgressItems([]);
    }
  };

  const handleQuantityChange = (itemId: string, quantity: string) => {
    const newQuantity = parseFloat(quantity) || 0;
    setProgressItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, currentQuantity: newQuantity } : item
      )
    );
  };
  
  const summary = useMemo(() => {
    const subTotal = progressItems.reduce((acc, item) => acc + (item.currentQuantity * item.unitPrice), 0);
    const vat = subTotal * 0.20;
    const stampDutyAmount = (subTotal + vat) * deductions.stampDuty;
    const ssiAmount = subTotal * deductions.ssi;
    const total = subTotal + vat - stampDutyAmount - ssiAmount;

    return {
      subTotal,
      vat,
      stampDutyAmount,
      ssiAmount,
      total
    };
  }, [progressItems, deductions]);

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
            <Input placeholder="Hakediş No (örn: 3)" className="w-full sm:w-[200px]" disabled={!selectedContract} />
          </div>
        </CardContent>
      </Card>
      
      {selectedContract && (
        <>
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
                      <TableHead>Birim</TableHead>
                      <TableHead>Birim Fiyat</TableHead>
                      <TableHead>Sözleşme Miktarı</TableHead>
                      <TableHead>Bu Ayki Miktar</TableHead>
                      <TableHead className="text-right">Bu Ayki Tutar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {progressItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>{item.contractQuantity}</TableCell>
                        <TableCell>
                            <Input 
                                className="w-24" 
                                type="number"
                                value={item.currentQuantity}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            />
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.currentQuantity * item.unitPrice)}</TableCell>
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
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span>İmalat Toplamı:</span><span>{formatCurrency(summary.subTotal)}</span></div>
                <div className="flex justify-between"><span>KDV (%20):</span><span>{formatCurrency(summary.vat)}</span></div>
                <div className="flex justify-between text-destructive"><span>Damga Vergisi (%{deductions.stampDuty * 100}):</span><span>- {formatCurrency(summary.stampDutyAmount)}</span></div>
                <div className="flex justify-between text-destructive"><span>SGK Kesintisi (%{deductions.ssi * 100}):</span><span>- {formatCurrency(summary.ssiAmount)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span className="font-headline">Ödenecek Tutar:</span><span>{formatCurrency(summary.total)}</span></div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button size="lg">Hakedişi Kaydet ve Raporla</Button>
          </div>
        </>
      )}
    </div>
  );
}
