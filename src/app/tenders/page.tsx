import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";

const tenders = [
  { id: 'IHALE-001', name: 'Ankara Konut Projesi', status: 'Değerlendirmede', date: '2024-09-15', budget: '₺15,000,000' },
  { id: 'IHALE-002', name: 'İstanbul Ofis Binası', status: 'Kazanıldı', date: '2024-08-01', budget: '₺25,000,000' },
  { id: 'IHALE-003', name: 'İzmir AVM İnşaatı', status: 'Hazırlık', date: '2024-10-01', budget: '₺50,000,000' },
  { id: 'IHALE-004', name: 'Bursa Fabrika Genişletme', status: 'Kaybedildi', date: '2024-07-20', budget: '₺8,000,000' },
];

export default function TendersPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="font-headline">İhale Takibi</CardTitle>
            <CardDescription>Mevcut ve geçmiş tüm ihaleleri yönetin.</CardDescription>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni İhale Ekle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İhale Kodu</TableHead>
                <TableHead>Proje Adı</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İhale Tarihi</TableHead>
                <TableHead className="text-right">Bütçe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenders.map((tender) => (
                <TableRow key={tender.id}>
                  <TableCell className="font-medium">{tender.id}</TableCell>
                  <TableCell>{tender.name}</TableCell>
                  <TableCell>{tender.status}</TableCell>
                  <TableCell>{tender.date}</TableCell>
                  <TableCell className="text-right">{tender.budget}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
