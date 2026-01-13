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

interface Contract {
    id: string;
    name: string;
    group: ContractGroupKeys;
    subGroup: string;
    status: string;
    date: string;
    items: ContractItem[];
}

const initialDraftContracts: Contract[] = [
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

const initialApprovedContracts: Contract[] = [
    { id: 'SOZ-001', name: 'İstanbul Ofis Binası - Betonarme', group: 'kaba-isler', subGroup: 'Betonarme ve Çelik', status: 'Onaylandı', date: '2024-08-10', items: [
      { poz: '15.150.1005', description: 'Makine ile Kazı', unit: 'm³', quantity: 8000, unitPrice: 175 },
      { poz: '15.160.1002', description: 'Dolgu Serme ve Sıkıştırma', unit: 'm³', quantity: 4000, unitPrice: 230 },
      { poz: 'C30', description: 'C30 Beton', unit: 'm³', quantity: 2500, unitPrice: 3200 },
    ]},
    { id: 'SOZ-002', name: 'Eskişehir Villa Projesi - Lamine Parke', group: 'ince-isler', subGroup: 'Zemin Kaplamaları', status: 'Onaylandı', date: '2024-06-15', items: [
       { poz: '25.115.1402', description: 'Lamine Parke', unit: 'm²', quantity: 450, unitPrice: 1800 },
    ]},
];

const ContractRow = ({ contract, onApprove }: { contract: Contract, onApprove?: (contractId: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const budget = contract.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const formatCurrency = (amount: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    const isApproved = contract.status === 'Onaylandı';

    return (
        <Collapsible asChild>
            <>
                <TableRow className={cn("cursor-pointer", isOpen && "bg-muted/50")}>
                    <CollapsibleTrigger asChild className="w-full" onClick={() => setIsOpen(!isOpen)}>
                        <td colSpan={onApprove ? 5 : 6} className="p-0">
                            <div className="flex items-center p-4">
                                {isOpen ? <ChevronUp className="h-4 w-4 mr-2"/> : <ChevronDown className="h-4 w-4 mr-2" />}
                                <span className="font-medium w-28">{contract.id}</span>
                                <span className='flex-1'>{contract.name}</span>
                                <Badge variant={isApproved ? "default" : "secondary"} className="w-28 justify-center">{contract.status}</Badge>
                                <span className="w-28 text-center">{contract.date}</span>
                                <span className="w-32 text-right">{formatCurrency(budget)}</span>
                            </div>
                        </td>
                    </CollapsibleTrigger>
                    {onApprove && (
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onApprove(contract.id); }}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600"/>
                                Onayla
                            </Button>
                        </TableCell>
                    )}
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
                                        {contract.items.map(item => (
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

const ContractGroupAccordion = ({ title, contracts, onApprove }: { title: string, contracts: Record<string, Contract[]>, onApprove?: (contractId: string) => void}) => {
    const totalContractsInGroup = Object.values(contracts).reduce((sum, list) => sum + list.length, 0);
    if (totalContractsInGroup === 0) return null;

    return (
        <AccordionItem value={title}>
            <AccordionTrigger className="text-base font-headline hover:no-underline">
                <div className='flex justify-between items-center w-full pr-4'>
                    <span>{title} ({totalContractsInGroup})</span>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <Accordion type="multiple" className="w-full pl-4 border-l">
                {Object.entries(contracts).map(([subGroup, contractList]) => (
                    <AccordionItem value={subGroup} key={subGroup}>
                        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                            <div className='flex justify-between items-center w-full pr-4'>
                                <span>{subGroup} ({contractList.length})</span>
                                {onApprove && (
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); /* TODO: Add new contract logic */ }}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Yeni Taslak Ekle
                                    </Button>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <Table>
                                <TableBody>
                                    {contractList.map((contract) => (
                                        <ContractRow key={contract.id} contract={contract} onApprove={onApprove} />
                                    ))}
                                </TableBody>
                            </Table>
                        </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            </AccordionContent>
        </AccordionItem>
    );
};


export default function ContractsPage() {
    const [draftContracts, setDraftContracts] = useState<Contract[]>(initialDraftContracts);
    const [approvedContracts, setApprovedContracts] = useState<Contract[]>(initialApprovedContracts);

    const approveTender = (tenderId: string) => {
        const tenderToApprove = draftContracts.find(t => t.id === tenderId);
        if (!tenderToApprove) return;

        setDraftContracts(draftContracts.filter(t => t.id !== tenderId));
        
        const newContract = {
            ...tenderToApprove,
            id: `SOZ-${String(approvedContracts.length + 3).padStart(3, '0')}`,
            status: 'Onaylandı',
            date: new Date().toISOString().split('T')[0],
        };
        setApprovedContracts(prev => [...prev, newContract].sort((a, b) => a.id.localeCompare(b.id)));
    };
    
    const groupContracts = (contracts: Contract[]): Record<ContractGroupKeys, Record<string, Contract[]>> => {
      return (Object.keys(contractGroups) as ContractGroupKeys[]).reduce((acc, groupKey) => {
          const contractsInGroup = contracts.filter(c => c.group === groupKey);
          const subGroups = contractsInGroup.reduce((subAcc, contract) => {
              (subAcc[contract.subGroup] = subAcc[contract.subGroup] || []).push(contract);
              return subAcc;
          }, {} as Record<string, Contract[]>);
          acc[groupKey] = subGroups;
          return acc;
      }, {} as Record<ContractGroupKeys, Record<string, Contract[]>>);
    };
    
    const groupedDrafts = groupContracts(draftContracts);
    const groupedApproved = groupContracts(approvedContracts);


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
                {(Object.keys(groupedDrafts) as ContractGroupKeys[]).map((groupKey) => (
                    <ContractGroupAccordion 
                        key={groupKey} 
                        title={contractGroups[groupKey]} 
                        contracts={groupedDrafts[groupKey]}
                        onApprove={approveTender}
                    />
                ))}
             </Accordion>
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            <Accordion type="multiple" className="w-full">
                {(Object.keys(groupedApproved) as ContractGroupKeys[]).map((groupKey) => (
                    <ContractGroupAccordion 
                        key={groupKey} 
                        title={contractGroups[groupKey]} 
                        contracts={groupedApproved[groupKey]}
                    />
                ))}
            </Accordion>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}

