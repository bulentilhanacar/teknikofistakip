"use client";

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProject } from '@/context/project-context';
import { Badge } from '@/components/ui/badge';
import type { ProgressPaymentStatus, Contract, ProgressPayment } from '@/context/types';
import { format, addMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, setDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Helper to generate month options
const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = -6; i <= 6; i++) {
        const date = addMonths(now, i);
        options.push({
            value: format(date, 'yyyy-MM'),
            label: format(date, 'MMMM yyyy', { locale: tr }),
        });
    }
    return options.reverse();
};

export default function ProgressTrackingPage() {
  const { selectedProject } = useProject();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const monthOptions = useMemo(() => getMonthOptions(), []);

  const contractsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedProject) return null;
    return query(collection(firestore, `projects/${selectedProject.id}/contracts`), where('isDraft', '==', false));
  }, [firestore, selectedProject]);
  const { data: approvedContracts, loading: contractsLoading } = useCollection<Contract>(contractsQuery);

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedProject) return null;
    return collection(firestore, `projects/${selectedProject.id}/progressPayments`);
  }, [firestore, selectedProject]);
  const { data: allPayments, loading: paymentsLoading } = useCollection<ProgressPayment>(paymentsQuery);

  const statusesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedProject || !selectedMonth) return null;
    return query(
        collection(firestore, `projects/${selectedProject.id}/progressStatuses`),
        where('id', '>=', `${selectedMonth}_`),
        where('id', '<=', `${selectedMonth}_\uf8ff`)
    );
  }, [firestore, selectedProject, selectedMonth]);
  // This query is tricky. Firestore doesn't support substring matches well.
  // A better structure might be projects/{pid}/statuses/{month}/contracts/{cid}
  // For now, we fetch all and filter client side.
   const allStatusesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedProject) return null;
    return collection(firestore, `projects/${selectedProject.id}/progressStatuses`);
  }, [firestore, selectedProject]);
  const { data: allStatuses, loading: statusesLoading } = useCollection<{id: string, status: ProgressPaymentStatus}>(allStatusesQuery);


  const getContractProgressInfo = useCallback((contract: Contract) => {
    const paymentInSelectedMonth = (allPayments || [])
        .find(p => p.id.startsWith(`${contract.id}_`) && format(new Date(p.date), 'yyyy-MM') === selectedMonth) || null;

    const statusDocId = `${selectedMonth}_${contract.id}`;
    const currentStatusDoc = (allStatuses || []).find(s => s.id === statusDocId);

    return {
      paymentNumberInMonth: paymentInSelectedMonth?.progressPaymentNumber || 0,
      paymentAmountInMonth: paymentInSelectedMonth?.totalAmount || 0, // Note: this is cumulative amount from payment object
      status: currentStatusDoc?.status || 'yok'
    };
  }, [allPayments, allStatuses, selectedMonth]);

  const handleStatusChange = useCallback(async (contractId: string, status: ProgressPaymentStatus) => {
      if(!selectedProject || !firestore) return;
      const statusDocId = `${selectedMonth}_${contractId}`;
      try {
        await setDoc(doc(firestore, `projects/${selectedProject.id}/progressStatuses`, statusDocId), { status }, { merge: true });
        toast({title: "Durum güncellendi."})
      } catch (error) {
        console.error("Error updating status: ", error);
        toast({title: "Hata", description: "Durum güncellenemedi.", variant: "destructive"});
      }
  }, [selectedProject, firestore, selectedMonth, toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };
  
  const getStatusBadgeVariant = (status: ProgressPaymentStatus) => {
    switch(status) {
        case 'sahada': return 'secondary';
        case 'imzada': return 'default';
        case 'onayda': return 'accent';
        case 'pas_gec': return 'outline';
        default: return 'outline';
    }
  }
  
  const statusLabels: Record<ProgressPaymentStatus, string> = {
      'yok': '(Durum Yok)',
      'sahada': 'Sahada',
      'imzada': 'İmzada',
      'onayda': 'Onayda',
      'pas_gec': 'Bu Ay Pas Geçildi'
  };


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

  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label;
  const loading = contractsLoading || paymentsLoading || statusesLoading;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
            <CardTitle className="font-headline">Hakediş Takip</CardTitle>
            <CardDescription>{selectedProject.name} | Sözleşmelerin aylık hakediş durumlarını takip edin.</CardDescription>
        </div>
         <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Ay Seçin..." />
            </SelectTrigger>
            <SelectContent>
                {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
             <div className="flex items-center justify-center h-48 text-muted-foreground">Yükleniyor...</div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Sözleşme No</TableHead>
              <TableHead>Sözleşme Adı</TableHead>
              <TableHead className="w-[220px]">{selectedMonthLabel} Ayı Hakedişi</TableHead>
              <TableHead className="w-[250px] text-center">{selectedMonthLabel} Süreç Durumu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(approvedContracts && approvedContracts.length > 0) ? approvedContracts.map(contract => {
              const progressInfo = getContractProgressInfo(contract);
              return (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.id.substring(0,5)}...</TableCell>
                  <TableCell>{contract.name}</TableCell>
                  <TableCell>
                    {progressInfo.paymentNumberInMonth > 0 ? (
                      <div className='flex flex-col'>
                         <Badge variant="secondary" className='mb-1 w-fit'>Hakediş #{progressInfo.paymentNumberInMonth} yapıldı</Badge>
                         <span className='text-xs text-muted-foreground'>{formatCurrency(progressInfo.paymentAmountInMonth)}</span>
                      </div>
                    ) : (
                      <span className='text-sm text-muted-foreground'>Bu ay hakediş yapılmadı</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                     <Select value={progressInfo.status} onValueChange={(value) => handleStatusChange(contract.id, value as ProgressPaymentStatus)}>
                        <SelectTrigger className={cn(
                            "w-full",
                            progressInfo.status === 'sahada' && "bg-secondary/50 border-secondary-foreground/50",
                            progressInfo.status === 'imzada' && "bg-primary/80 text-primary-foreground border-primary-foreground/50",
                            progressInfo.status === 'onayda' && "bg-accent/80 text-accent-foreground border-accent-foreground/50",
                        )}>
                            <SelectValue placeholder="Durum Seçin..." />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(statusLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
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
        )}
      </CardContent>
    </Card>
  );
}
