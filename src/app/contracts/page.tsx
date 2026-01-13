"use client";

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, CheckCircle, ChevronDown } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useProject } from '@/context/project-context';

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

const initialContractsData: Record<string, {drafts: Contract[], approved: Contract[]}> = {
    "proje-istanbul": {
        drafts: [
            { id: 'IHALE-005', name: 'Tanıtım Filmi Çekimi', group: 'reklam', subGroup: 'Dijital Medya', status: 'Teklif Alındı', date: '2024-09-20', items: [
                { poz: 'RF-01', description: 'Prodüksiyon', unit: 'gün', quantity: 5, unitPrice: 15000 },
                { poz: 'RF-02', description: 'Post-Prodüksiyon', unit: 'gün', quantity: 10, unitPrice: 7500 },
            ]},
            { id: 'IHALE-006', name: 'Genel Vitrifiye Malzemeleri', group: 'tedarikler', subGroup: 'Sıhhi Tesisat Malzemeleri', status: 'Hazırlık', date: '2024-10-05', items: [
                { poz: 'VIT-01', description: 'Klozet Takımı', unit: 'adet', quantity: 120, unitPrice: 4500 },
                { poz: 'VIT-02', description: 'Lavabo ve Batarya', unit: 'adet', quantity: 150, unitPrice: 3500 },
            ]},
        ],
        approved: [
            { id: 'SOZ-001', name: 'İstanbul Ofis Binası - Betonarme', group: 'kaba-isler', subGroup: 'Betonarme ve Çelik', status: 'Onaylandı', date: '2024-08-10', items: [
              { poz: '15.150.1005', description: 'Makine ile Kazı', unit: 'm³', quantity: 8000, unitPrice: 175 },
              { poz: 'C30', description: 'C30 Beton', unit: 'm³', quantity: 2500, unitPrice: 3200 },
            ]},
            { id: 'SOZ-002', name: 'Eskişehir Villa Projesi - Lamine Parke', group: 'ince-isler', subGroup: 'Zemin Kaplamaları', status: 'Onaylandı', date: '2024-06-15', items: [
               { poz: '25.115.1402', description: 'Lamine Parke', unit: 'm²', quantity: 450, unitPrice: 1800 },
            ]},
        ]
    },
    "proje-ankara": {
        drafts: [
            { id: 'IHALE-001', name: 'Ankara Konut Projesi - Hafriyat', group: 'kaba-isler', subGroup: 'Hafriyat İşleri', status: 'Değerlendirmede', date: '2024-09-15', items: [
              { poz: '15.150.1005', description: 'Makine ile Kazı', unit: 'm³', quantity: 5000, unitPrice: 180 },
              { poz: '15.160.1002', description: 'Dolgu Serme ve Sıkıştırma', unit: 'm³', quantity: 2500, unitPrice: 240 },
            ]},
            { id: 'IHALE-003', name: 'İzmir AVM İnşaatı - Çelik Konstrüksiyon', group: 'kaba-isler', subGroup: 'Betonarme ve Çelik', status: 'Hazırlık', date: '2024-10-01', items: [
               { poz: '23.014', description: 'Çelik Kolon Montajı', unit: 'ton', quantity: 150, unitPrice: 45000 },
               { poz: '23.015', description: 'Çelik Kiriş Montajı', unit: 'ton', quantity: 200, unitPrice: 42000 },
            ]},
            { id: 'IHALE-007', name: 'Alçıpan ve Boya İşleri', group: 'ince-isler', subGroup: 'Boya ve Kaplama', status: 'Değerlendirmede', date: '2024-09-25', items: [] },
        ],
        approved: []
    }
}


const ContractRow = ({ contract, onApprove }: { contract: Contract, onApprove?: (contractId: string) => void }) => {
    const budget = contract.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const formatCurrency = (amount: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    const isApproved = contract.status === 'Onaylandı';

    return (
        <Collapsible asChild>
            <>
                <TableRow>
                    <td colSpan={onApprove ? 7 : 6} className="p-0">
                        <div className="flex items-center p-4 w-full group">
                            <CollapsibleTrigger asChild>
                                <button className='flex items-center flex-1 text-left'>
                                    <ChevronDown className="h-4 w-4 mr-2 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                    <span className="font-medium w-28">{contract.id}</span>
                                    <span className='flex-1'>{contract.name}</span>
                                </button>
                            </CollapsibleTrigger>
                            <Badge variant={isApproved ? "default" : "secondary"} className="w-28 justify-center">{contract.status}</Badge>
                            <span className="w-28 text-center">{contract.date}</span>
                            <span className="w-32 text-right">{formatCurrency(budget)}</span>
                            {onApprove && (
                                <div className="text-right w-28 pl-4">
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onApprove && onApprove(contract.id); }}>
                                        <CheckCircle className="mr-2 h-4 w-4 text-green-600"/>
                                        Onayla
                                    </Button>
                                </div>
                            )}
                        </div>
                    </td>
                </TableRow>
                <CollapsibleContent asChild>
                    <TableRow>
                        <TableCell colSpan={onApprove ? 7 : 6} className="p-0">
                            <div className="p-4 bg-background">
                                <h4 className='text-base font-semibold mb-2 pl-2'>Sözleşme Detayları</h4>
                                 {contract.items.length > 0 ? (
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
                                 ) : (
                                    <div className="text-center text-muted-foreground p-4">Bu sözleşme için kalem eklenmemiş.</div>
                                 )}
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
    const hasAnyContracts = totalContractsInGroup > 0;
    const hasSubgroups = Object.keys(contracts).length > 0 && Object.values(contracts).some(list => list.length > 0);

    return (
        <AccordionItem value={title}>
            <AccordionTrigger className="text-base font-headline hover:no-underline">
                <div className='flex justify-between items-center w-full pr-4'>
                    <span>{title} ({totalContractsInGroup})</span>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                {hasSubgroups ? (
                    <Accordion type="multiple" className="w-full pl-4 border-l">
                    {Object.entries(contracts).map(([subGroup, contractList]) => {
                        if (contractList.length === 0 && !onApprove) return null;
                        return (
                            <AccordionItem value={subGroup} key={subGroup}>
                                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                                    <div className='flex justify-between items-center w-full pr-4'>
                                        <span>{subGroup} ({contractList.length})</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                     {contractList.length > 0 ? (
                                        <Table>
                                            <TableBody>
                                                {contractList.map((contract) => (
                                                    <ContractRow key={contract.id} contract={contract} onApprove={onApprove} />
                                                ))}
                                            </TableBody>
                                        </Table>
                                     ) : (
                                        <div className="text-center text-muted-foreground p-4">Bu alt grupta sözleşme bulunmuyor.</div>
                                     )}
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                    </Accordion>
                ) : (
                     <div className="pl-4 text-muted-foreground py-4">Bu grupta alt başlık veya sözleşme bulunmuyor.</div>
                )}
                 {onApprove && (
                    <div className="pt-2 pl-6 mt-2 border-t">
                        <Button variant="ghost" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Yeni Taslak Ekle
                        </Button>
                    </div>
                 )}
            </AccordionContent>
        </AccordionItem>
    );
};


export default function ContractsPage() {
    const { selectedProject } = useProject();
    const [projectContracts, setProjectContracts] = useState(initialContractsData);

    const { draftContracts, approvedContracts } = useMemo(() => {
        if (!selectedProject || !projectContracts[selectedProject.id]) {
            return { draftContracts: [], approvedContracts: [] };
        }
        return {
            draftContracts: projectContracts[selectedProject.id].drafts,
            approvedContracts: projectContracts[selectedProject.id].approved
        };
    }, [selectedProject, projectContracts]);


    const approveTender = (tenderId: string) => {
        if (!selectedProject) return;

        const tenderToApprove = draftContracts.find(t => t.id === tenderId);
        if (!tenderToApprove) return;

        const newIdNumber = (approvedContracts.length + Object.keys(projectContracts).reduce((acc, key) => acc + projectContracts[key].approved.length, 0) + 1);
        const newContractId = `SOZ-${String(newIdNumber).padStart(3, '0')}`;

        const newApprovedContract = {
            ...tenderToApprove,
            id: newContractId,
            status: 'Onaylandı',
            date: new Date().toISOString().split('T')[0],
        };

        setProjectContracts(prevData => {
            const currentProjectData = prevData[selectedProject.id] || { drafts: [], approved: [] };
            const updatedDrafts = currentProjectData.drafts.filter(t => t.id !== tenderId);
            const updatedApproved = [...currentProjectData.approved, newApprovedContract].sort((a, b) => a.id.localeCompare(b.id));
            
            return {
                ...prevData,
                [selectedProject.id]: {
                    drafts: updatedDrafts,
                    approved: updatedApproved
                }
            }
        });
    };
    
    const groupContracts = (contracts: Contract[]): Record<ContractGroupKeys, Record<string, Contract[]>> => {
      const allGroups = (Object.keys(contractGroups) as ContractGroupKeys[]).reduce((acc, groupKey) => {
          acc[groupKey] = {};
          return acc;
      }, {} as Record<ContractGroupKeys, Record<string, Contract[]>>);

      contracts.forEach(contract => {
        if (allGroups[contract.group]) {
          if (!allGroups[contract.group][contract.subGroup]) {
            allGroups[contract.group][contract.subGroup] = [];
          }
          allGroups[contract.group][contract.subGroup].push(contract);
        }
      });

      // Alt grupları doldur
      for (const groupKey in allGroups) {
          const typedGroupKey = groupKey as ContractGroupKeys;
          const subGroups = Array.from(new Set(contracts.filter(c => c.group === typedGroupKey).map(c => c.subGroup)));
          subGroups.forEach(subGroup => {
              if (!allGroups[typedGroupKey][subGroup]) {
                  allGroups[typedGroupKey][subGroup] = [];
              }
          });
      }


      return allGroups;
    };
    
    const groupedDrafts = groupContracts(draftContracts);
    const groupedApproved = groupContracts(approvedContracts);

  if (!selectedProject) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Sözleşme Yönetimi</CardTitle>
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
    <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
            <div>
                <CardTitle className="font-headline">Sözleşme Yönetimi</CardTitle>
                <CardDescription>{selectedProject.name} | Taslak ve onaylı tüm proje sözleşmelerini yönetin.</CardDescription>
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
                {(Object.keys(contractGroups) as ContractGroupKeys[]).map((groupKey) => {
                    const contractsInGroup = groupedDrafts[groupKey];
                    return (
                        <ContractGroupAccordion 
                            key={groupKey} 
                            title={contractGroups[groupKey]} 
                            contracts={contractsInGroup || {}}
                            onApprove={approveTender}
                        />
                    );
                })}
             </Accordion>
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            <Accordion type="multiple" className="w-full">
                {(Object.keys(contractGroups) as ContractGroupKeys[]).map((groupKey) => {
                    const contractsInGroup = groupedApproved[groupKey];
                    return (
                        <ContractGroupAccordion 
                            key={groupKey} 
                            title={contractGroups[groupKey]} 
                            contracts={contractsInGroup || {}}
                        />
                    );
                })}
            </Accordion>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}
