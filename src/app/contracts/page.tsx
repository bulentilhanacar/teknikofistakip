"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';

const contractGroups = {
  "reklam": "Reklam ve Tanıtım",
  "tedarikler": "Tedarikler",
  "kaba-isler": "Kaba İşler",
  "ince-isler": "İnce İşler",
  "elektrik": "Elektrik İşleri",
  "mekanik": "Mekanik İşleri",
  "yalitim": "Yalıtım İşleri",
  "peyzaj": "Peyzaj İşleri",
  "sosyal-tesisler": "Sosyal Tesisler"
};

type ContractGroupKeys = keyof typeof contractGroups;

interface ContractItem {
    poz: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
}

interface DraftContract {
    id: string;
    name: string;
    group: ContractGroupKeys;
    subGroup: string;
    status: string;
    date: string;
    items: ContractItem[];
}

const initialDraftContracts: DraftContract[] = [
  { id: 'IHALE-001', name: 'Ankara Konut Projesi - Hafriyat', group: 'kaba-isler', subGroup: 'Hafriyat İşleri', status: 'Değerlendirmede', date: '2024-09-15', items: [
    { poz: '15.150.1005', description: 'Makine ile Kazı', unit: 'm³', quantity: 5000, unitPrice: 180 },
    { poz: '15.160.1002', description: 'Dolgu Serme ve Sıkıştırma', unit: 'm³', quantity: 2500, unitPrice: 240 },
  ]},
  { id: 'IHALE-003', name: 'İzmir AVM İnşaatı - Çelik Konstrüksiyon', group: 'kaba-isler', subGroup: 'Betonarme ve Çelik', status: 'Hazırlık', date: '2024-10-01', items: [
     { poz: '23.014', description: 'Çelik Kolon Montajı', unit: 'ton', quantity: 150, unitPrice: 45000 },
     { poz: '23.015', description: 'Çelik Kiriş Montajı', unit: 'ton', quantity: 200, unitPrice: 42000 },
  ]},
  { id: 'IHALE-005', name: 'Tanıtım Filmi Çekimi', group: 'reklam', subGroup: 'Dijital Medya', status: 'Teklif Alındı', date: '2024-09-20', items: [
      { poz: 'RF-01', description: 'Prodüksiyon', unit: 'gün', quantity: 5, unitPrice: 15000 },
      { poz: 'RF-02', description: 'Post-Prodüksiyon', unit: 'gün', quantity: 10, unitPrice: 7500 },
  ]},
  { id: 'IHALE-006', name: 'Genel Vitrifiye Malzemeleri', group: 'tedarikler', subGroup: 'Sıhhi Tesisat Malzemeleri', status: 'Hazırlık', date: '2024-10-05', items: [
      { poz: 'VIT-01', description: 'Klozet Takımı', unit: 'adet', quantity: 120, unitPrice: 4500 },
      { poz: 'VIT-02', description: 'Lavabo ve Batarya', unit: 'adet', quantity: 150, unitPrice: 3500 },
  ]},
  { id: 'IHALE-007', name: 'Alçıpan ve Boya İşleri', group: 'ince-isler', subGroup: 'Boya ve Kaplama', status: 'Değerlendirmede', date: '2024-09-25', items: [] },
  { id: 'IHALE-008', name: 'Tüm Elektrik Altyapısı', group: 'elektrik', subGroup: 'Altyapı ve Tesisat', status: 'Keşif Aşamasında', date: '2024-10-10', items: [] },
  { id: 'IHALE-009', name: 'Isıtma-Soğutma Sistemleri', group: 'mekanik', subGroup: 'HVAC', status: 'Hazırlık', date: '2024-10-15', items: [] },
  { id: 'IHALE-010', name: 'Dış Cephe Mantolama', group: 'yalitim', subGroup: 'Isı Yalıtımı', status: 'Teklif Alındı', date: '2024-09-28', items: [] },
  { id: 'IHALE-011', name: 'Bahçe ve Çevre Düzenlemesi', group: 'peyzaj', subGroup: 'Bitkilendirme', status: 'Hazırlık', date: '2024-10-20', items: [] },
  { id: 'IHALE-012', name: 'Havuz ve Spor Alanları Ekipmanları', group: 'sosyal-tesisler', subGroup: 'Ekipman Tedariği', status: 'Değerlendirmede', date: '2024-10-02', items: [] },
];

const initialApprovedContracts = [
    { id: 'SOZ-001', project: 'İstanbul Ofis Binası', client: 'ABC Holding', startDate: '2024-08-10', value: '₺24,500,000', originalTenderId: 'IHALE-002' },
    { id: 'SOZ-002', project: 'Eskişehir Villa Projesi', client: 'Yılmaz Ailesi', startDate: '2024-06-15', value: '₺3,200,000' },
];

const TenderRow = ({ tender }: { tender: DraftContract }) => {
    const [isOpen, setIsOpen] = useState(false);
    const budget = tender.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const formatCurrency = (amount: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

    return (
        <Collapsible asChild>
            <>
                <TableRow className={cn("cursor-pointer", isOpen && "bg-muted/50")}>
                    <CollapsibleTrigger asChild>
                        <TableCell className="font-medium" colSpan={5}>
                             <div className="flex items-center">
                                {isOpen ? <ChevronUp className="h-4 w-4 mr-2"/> : <ChevronDown className="h-4 w-4 mr-2" />}
                                <span className="font-medium w-28">{tender.id}</span>
                                <span className='flex-1'>{tender.name}</span>
                                <Badge variant="secondary" className="w-28 justify-center">{tender.status}</Badge>
                                <span className="w-28 text-center">{tender.date}</span>
                                <span className="w-32 text-right">{formatCurrency(budget)}</span>
                            </div>
                        </TableCell>
                    </CollapsibleTrigger>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600"/>
                            Onayla
                        </Button>
                    </TableCell>
                </TableRow>
                <CollapsibleContent asChild>
                    <TableRow>
                        <TableCell colSpan={6} className="p-0">
                            <div className="p-4 bg-background">
                                <h4 className='text-base font-semibold mb-2 pl-2'>Sözleşme Detayları</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Poz No</TableHead>
                                            <TableHead>Açıklama</TableHead>
                                            <TableHead>Birim</TableHead>
                                            <TableHead className='text-right'>Miktar</TableHead>
                                            <TableHead className='text-right'>Birim Fiyat</TableHead>
                                            <TableHead className="text-right">Tutar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tender.items.map(item => (
                                            <TableRow key={item.poz}>
                                                <TableCell>{item.poz}</TableCell>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell>{item.unit}</TableCell>
                                                <TableCell className='text-right'>{item.quantity.toLocaleString('tr-TR')}</TableCell>
                                                <TableCell className='text-right'>{formatCurrency(item.unitPrice)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="font-bold bg-muted">
                                            <TableCell colSpan={5} className="text-right">Toplam Tutar</TableCell>
                                            <TableCell className="text-right">{formatCurrency(budget)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </TableCell>
                    </TableRow>
                </CollapsibleContent>
             </>
        </Collapsible>
    )
}


export default function ContractsPage() {
    const [draftContracts, setDraftContracts] = useState(initialDraftContracts);
    const [approvedContracts, setApprovedContracts] = useState(initialApprovedContracts);

    const approveTender = (tenderId: string) => {
        const tenderToApprove = draftContracts.find(t => t.id === tenderId);
        if (!tenderToApprove) return;

        setDraftContracts(draftContracts.filter(t => t.id !== tenderId));
        
        const budget = tenderToApprove.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const newContract = {
            id: `SOZ-${String(approvedContracts.length + 3).padStart(3, '0')}`,
            project: tenderToApprove.name,
            client: 'Belirlenecek',
            startDate: new Date().toISOString().split('T')[0],
            value: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(budget),
            originalTenderId: tenderToApprove.id
        };
        setApprovedContracts([...approvedContracts, newContract]);
    };
    
    const groupedDrafts = (Object.keys(contractGroups) as ContractGroupKeys[]).reduce((acc, groupKey) => {
        const contractsInGroup = draftContracts.filter(c => c.group === groupKey);
        const subGroups = contractsInGroup.reduce((subAcc, contract) => {
            (subAcc[contract.subGroup] = subAcc[contract.subGroup] || []).push(contract);
            return subAcc;
        }, {} as Record<string, DraftContract[]>);
        acc[groupKey] = subGroups;
        return acc;
    }, {} as Record<ContractGroupKeys, Record<string, DraftContract[]>>);


  return (
    <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
            <div>
                <CardTitle className="font-headline">Sözleşme Yönetimi</CardTitle>
                <CardDescription>Taslak ve onaylı tüm proje sözleşmelerini yönetin.</CardDescription>
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
                {(Object.keys(groupedDrafts) as ContractGroupKeys[]).map((groupKey) => {
                    const subGroups = groupedDrafts[groupKey];
                    const groupName = contractGroups[groupKey];
                    const totalContractsInGroup = Object.values(subGroups).reduce((sum, contracts) => sum + contracts.length, 0);
                    
                    if (totalContractsInGroup === 0) return null;

                    return (
                        <AccordionItem value={groupKey} key={groupKey}>
                            <AccordionTrigger className="text-base font-headline hover:no-underline">
                                <div className='flex justify-between items-center w-full pr-4'>
                                    <span>{groupName} ({totalContractsInGroup})</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                {Object.keys(subGroups).length > 0 ? (
                                    <Accordion type="multiple" className="w-full pl-4 border-l">
                                    {Object.entries(subGroups).map(([subGroup, contracts]) => (
                                        <AccordionItem value={subGroup} key={subGroup}>
                                             <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                                                <div className='flex justify-between items-center w-full pr-4'>
                                                    <span>{subGroup} ({contracts.length})</span>
                                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); /* TODO: Add new contract logic */ }}>
                                                        <PlusCircle className="mr-2 h-4 w-4" />
                                                        Yeni Taslak Ekle
                                                    </Button>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className='w-28'>İhale Kodu</TableHead>
                                                            <TableHead>Proje Adı</TableHead>
                                                            <TableHead className='w-28 text-center'>Durum</TableHead>
                                                            <TableHead className='w-28 text-center'>İhale Tarihi</TableHead>
                                                            <TableHead className='w-32 text-right'>Bütçe</TableHead>
                                                            <TableHead className="w-24 text-right">İşlemler</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {contracts.map((tender) => (
                                                            <TenderRow key={tender.id} tender={tender} />
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                    </Accordion>
                                ) : (
                                    <div className="text-center text-muted-foreground p-4">
                                        Bu grup için henüz taslak sözleşme yok.
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
             </Accordion>
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Sözleşme Kodu</TableHead>
                    <TableHead>Proje</TableHead>
                    <TableHead>İşveren</TableHead>
                    <TableHead>Başlangıç Tarihi</TableHead>
                    <TableHead className="text-right">Sözleşme Bedeli</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {approvedContracts.map((contract) => (
                    <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.id}</TableCell>
                        <TableCell>{contract.project}</TableCell>
                        <TableCell>{contract.client}</TableCell>
                        <TableCell>{contract.startDate}</TableCell>
                        <TableCell className="text-right">{contract.value}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
