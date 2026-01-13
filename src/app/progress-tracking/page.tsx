"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProject } from '@/context/project-context';
import { Badge } from '@/components/ui/badge';
import type { ProgressPaymentStatus, Contract } from '@/context/types';

export default function ProgressTrackingPage() {
  const { selectedProject, projectData, updateProgressPaymentStatus } = useProject();

  const approvedContracts = useMemo(() => {
    if (!selectedProject || !projectData) return [];
    return (projectData.contracts[selectedProject.id]?.approved || []).sort((a,b) => a.id.localeCompare(b.id));
  }, [selectedProject, projectData]);

  const getContractProgressInfo = (contract: Contract) => {
    const history = selectedProject ? projectData.progressPayments[selectedProject.id]?.[contract.id] : [];
    const lastPayment = history && history.length > 0 ? history[history.length - 1] : null;
    const currentStatus = selectedProject ? projectData.progressStatuses[selectedProject.id]?.[contract.id] : 'yok';

    return {
      lastPaymentNumber: lastPayment?.progressPaymentNumber || 0,
      lastPaymentAmount: lastPayment?.totalAmount || 0,
      nextPaymentNumber: (lastPayment?.progressPaymentNumber || 0) + 1,
      status: currentStatus || 'yok'
    };
  };

  const handleStatusChange = (contractId: string, status: ProgressPaymentStatus) => {
      if(selectedProject) {
        updateProgressPaymentStatus(contractId, status);
      }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };
  
  const getStatusBadgeVariant = (status: ProgressPaymentStatus) => {
    switch(status) {
        case 'sahada': return 'secondary';
        case 'imzada': return 'default';
        case 'onayda': return 'destructive';
        case 'pas_gec': return 'outline';
        default: return 'outline';
    }
  }

  if (!selectedProject) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Hakediş Takip</CardTitle>
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
        <CardTitle className="font-headline">Hakediş Takip</CardTitle>
        <CardDescription>{selectedProject.name} | Onaylı sözleşmelerin hakediş durumlarını ve ilerlemelerini takip edin.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Sözleşme No</TableHead>
              <TableHead>Sözleşme Adı</TableHead>
              <TableHead className="w-[200px]">Son Hakediş Durumu</TableHead>
              <TableHead className="w-[250px] text-center">Sonraki Hakediş Durumu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvedContracts.length > 0 ? approvedContracts.map(contract => {
              const progressInfo = getContractProgressInfo(contract);
              return (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.id}</TableCell>
                  <TableCell>{contract.name}</TableCell>
                  <TableCell>
                    {progressInfo.lastPaymentNumber > 0 ? (
                      <div className='flex flex-col'>
                         <Badge variant="secondary" className='mb-1 w-fit'>Hakediş #{progressInfo.lastPaymentNumber} yapıldı</Badge>
                         <span className='text-xs text-muted-foreground'>{formatCurrency(progressInfo.lastPaymentAmount)}</span>
                      </div>
                    ) : (
                      <span className='text-muted-foreground'>Hakediş yapılmadı</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                     <Select value={progressInfo.status} onValueChange={(value) => handleStatusChange(contract.id, value as ProgressPaymentStatus)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Durum Seçin..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="yok">(Durum Yok)</SelectItem>
                            <SelectItem value="sahada">Sahada</SelectItem>
                            <SelectItem value="imzada">İmzada</SelectItem>
                            <SelectItem value="onayda">Onayda</Oreal>
                            <SelectItem value="pas_gec">Bu Ay Hakediş Yok</SelectItem>
                        </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              )
            }) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Bu proje için onaylı sözleşme bulunmuyor.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
