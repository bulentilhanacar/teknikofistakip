"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, CheckCircle } from "lucide-react";
import { Badge } from '@/components/ui/badge';

const initialDraftContracts = [
  { id: 'IHALE-001', name: 'Ankara Konut Projesi', status: 'Değerlendirmede', date: '2024-09-15', budget: '₺15,000,000' },
  { id: 'IHALE-003', name: 'İzmir AVM İnşaatı', status: 'Hazırlık', date: '2024-10-01', budget: '₺50,000,000' },
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


  return (
    <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
            <div>
                <CardTitle className="font-headline">Sözleşme Yönetimi</CardTitle>
                <CardDescription>Taslak ve onaylı tüm proje sözleşmelerini yönetin.</CardDescription>
            </div>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Yeni Taslak Ekle
            </Button>
            </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="drafts">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="drafts">Taslak Sözleşmeler ({draftContracts.length})</TabsTrigger>
            <TabsTrigger value="approved">Onaylı Sözleşmeler ({approvedContracts.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="drafts" className="mt-4">
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
                {draftContracts.map((tender) => (
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
