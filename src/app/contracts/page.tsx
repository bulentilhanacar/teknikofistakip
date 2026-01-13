"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, CheckCircle } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

interface DraftContract {
    id: string;
    name: string;
    group: ContractGroupKeys;
    subGroup: string;
    status: string;
    date: string;
    budget: string;
}

const initialDraftContracts: DraftContract[] = [
  { id: 'IHALE-001', name: 'Ankara Konut Projesi - Hafriyat', group: 'kaba-isler', subGroup: 'Hafriyat İşleri', status: 'Değerlendirmede', date: '2024-09-15', budget: '₺1,500,000' },
  { id: 'IHALE-003', name: 'İzmir AVM İnşaatı - Çelik Konstrüksiyon', group: 'kaba-isler', subGroup: 'Betonarme ve Çelik', status: 'Hazırlık', date: '2024-10-01', budget: '₺8,000,000' },
  { id: 'IHALE-005', name: 'Tanıtım Filmi Çekimi', group: 'reklam', subGroup: 'Dijital Medya', status: 'Teklif Alındı', date: '2024-09-20', budget: '₺150,000' },
  { id: 'IHALE-006', name: 'Genel Vitrifiye Malzemeleri', group: 'tedarikler', subGroup: 'Sıhhi Tesisat Malzemeleri', status: 'Hazırlık', date: '2024-10-05', budget: '₺2,500,000' },
  { id: 'IHALE-007', name: 'Alçıpan ve Boya İşleri', group: 'ince-isler', subGroup: 'Boya ve Kaplama', status: 'Değerlendirmede', date: '2024-09-25', budget: '₺1,800,000' },
  { id: 'IHALE-008', name: 'Tüm Elektrik Altyapısı', group: 'elektrik', subGroup: 'Altyapı ve Tesisat', status: 'Keşif Aşamasında', date: '2024-10-10', budget: '₺4,200,000' },
  { id: 'IHALE-009', name: 'Isıtma-Soğutma Sistemleri', group: 'mekanik', subGroup: 'HVAC', status: 'Hazırlık', date: '2024-10-15', budget: '₺5,100,000' },
  { id: 'IHALE-010', name: 'Dış Cephe Mantolama', group: 'yalitim', subGroup: 'Isı Yalıtımı', status: 'Teklif Alındı', date: '2024-09-28', budget: '₺2,100,000' },
  { id: 'IHALE-011', name: 'Bahçe ve Çevre Düzenlemesi', group: 'peyzaj', subGroup: 'Bitkilendirme', status: 'Hazırlık', date: '2024-10-20', budget: '₺950,000' },
  { id: 'IHALE-012', name: 'Havuz ve Spor Alanları Ekipmanları', group: 'sosyal-tesisler', subGroup: 'Ekipman Tedariği', status: 'Değerlendirmede', date: '2024-10-02', budget: '₺1,300,000' },
];

const initialApprovedContracts = [
    { id: 'SOZ-001', project: 'İstanbul Ofis Binası', client: 'ABC Holding', startDate: '2024-08-10', value: '₺24,500,000', originalTenderId: 'IHALE-002' },
    { id: 'SOZ-002', project: 'Eskişehir Villa Projesi', client: 'Yılmaz Ailesi', startDate: '2024-06-15', value: '₺3,200,000' },
];


export default function ContractsPage() {
    const [draftContracts, setDraftContracts] = useState(initialDraftContracts);
    const [approvedContracts, setApprovedContracts] = useState(initialApprovedContracts);

    const approveTender = (tenderId: string) => {
        const tenderToApprove = draftContracts.find(t => t.id === tenderId);
        if (!tenderToApprove) return;

        // Move from draft to approved
        setDraftContracts(draftContracts.filter(t => t.id !== tenderId));

        const newContract = {
            id: `SOZ-${String(approvedContracts.length + 3).padStart(3, '0')}`,
            project: tenderToApprove.name,
            client: 'Belirlenecek',
            startDate: new Date().toISOString().split('T')[0],
            value: tenderToApprove.budget,
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

                    return (
                        <AccordionItem value={groupKey} key={groupKey}>
                            <AccordionTrigger className="text-base font-headline hover:no-underline">
                                <div className='flex justify-between items-center w-full pr-4'>
                                    <span>{groupName} ({totalContractsInGroup})</span>
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); /* TODO: Add new sub-group logic */ }}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Yeni Alt Grup Ekle
                                    </Button>
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
                                                        <TableHead>İhale Kodu</TableHead>
                                                        <TableHead>Proje Adı</TableHead>
                                                        <TableHead>Durum</TableHead>
                                                        <TableHead>İhale Tarihi</TableHead>
                                                        <TableHead>Bütçe</TableHead>
                                                        <TableHead className="text-right">İşlemler</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {contracts.map((tender) => (
                                                        <TableRow key={tender.id}>
                                                            <TableCell className="font-medium">{tender.id}</TableCell>
                                                            <TableCell>{tender.name}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="secondary">{tender.status}</Badge>
                                                            </TableCell>
                                                            <TableCell>{tender.date}</TableCell>
                                                            <TableCell>{tender.budget}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="sm" onClick={() => approveTender(tender.id)}>
                                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600"/>
                                                                    Onayla
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
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
