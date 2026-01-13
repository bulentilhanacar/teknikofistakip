"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProject } from '@/context/project-context';
import { Badge } from '@/components/ui/badge';
import type { ProgressPaymentStatus, Contract } from '@/context/types';
import { format, addMonths, lastDayOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  const { selectedProject, projectData, updateProgressPaymentStatus } = useProject();
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const monthOptions = useMemo(() => getMonthOptions(), []);

  useEffect(() => {
    // Reset to current month when project changes
    setSelectedMonth(format(new Date(), 'yyyy-MM'));
  }, [selectedProject]);


  const approvedContracts = useMemo(() => {
    if (!selectedProject || !projectData) return [];
    return (projectData.contracts[selectedProject.id]?.approved || []).sort((a,b) => a.id.localeCompare(b.id));
  }, [selectedProject, projectData]);

  const getContractProgressInfo = (contract: Contract) => {
    const history = selectedProject ? projectData.progressPayments[selectedProject.id]?.[contract.id] || [] : [];
    
    // Find the last payment made on or before the end of the selected month
    const selectedMonthEndDate = lastDayOfMonth(new Date(`${selectedMonth}-01T12:00:00`));
    const lastPaymentForMonth = history
        .filter(p => new Date(p.date) <= selectedMonthEndDate)
        .sort((a, b) => b.progressPaymentNumber - a.progressPaymentNumber)[0] || null;

    const projectStatusesForMonth = (selectedProject && projectData.progressStatuses[selectedProject.id]?.[selectedMonth]) || {};
    const currentStatus = projectStatusesForMonth[contract.id] || 'yok';

    return {
      lastPaymentNumber: lastPaymentForMonth?.progressPaymentNumber || 0,
      lastPaymentAmount: lastPaymentForMonth?.totalAmount || 0,
      nextPaymentNumber: (lastPaymentForMonth?.progressPaymentNumber || 0) + 1,
      status: currentStatus
    };
  };

  const handleStatusChange = (contractId: string, status: ProgressPaymentStatus) => {
      if(selectedProject) {
        updateProgressPaymentStatus(selectedMonth, contractId, status);
      }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };
  
  const getStatusBadgeVariant = (status: ProgressPaymentStatus) => {
    switch(status) {
        case 'sahada': return 'secondary';
        case 'imzada': return 'default';
        case 'onayda': return 'accent';
        case 'odendi': return 'destructive';
        case 'pas_gec': return 'outline';
        default: return 'outline';
    }
  }
  
  const statusLabels: Record<ProgressPaymentStatus, string> = {
      'yok': '(Durum Yok)',
      'sahada': 'Sahada',
      'imzada': 'İmzada',
      'onayda': 'Onayda',
      'odendi': 'Ödendi',
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Sözleşme No</TableHead>
              <TableHead>Sözleşme Adı</TableHead>
              <TableHead className="w-[220px]">{selectedMonthLabel} İtibarıyla Durum</TableHead>
              <TableHead className="w-[250px] text-center">{selectedMonthLabel} Süreç Durumu</TableHead>
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
                        <SelectTrigger className={cn(
                            "w-full",
                            progressInfo.status === 'sahada' && "bg-secondary/50 border-secondary-foreground/50",
                            progressInfo.status === 'imzada' && "bg-primary/80 text-primary-foreground border-primary-foreground/50",
                            progressInfo.status === 'onayda' && "bg-accent/80 text-accent-foreground border-accent-foreground/50",
                            progressInfo.status === 'odendi' && "bg-destructive/80 text-destructive-foreground border-destructive-foreground/50",
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
      </CardContent>
    </Card>
  );
}
