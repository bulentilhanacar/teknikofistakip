import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";

const contracts = [
  { id: 'SOZ-001', project: 'İstanbul Ofis Binası', client: 'ABC Holding', startDate: '2024-08-10', value: '₺24,500,000' },
  { id: 'SOZ-002', project: 'Eskişehir Villa Projesi', client: 'Yılmaz Ailesi', startDate: '2024-06-15', value: '₺3,200,000' },
];

export default function ContractsPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-headline">Sözleşme Yönetimi</CardTitle>
            <CardDescription>Tüm proje sözleşmelerini görüntüleyin ve yönetin.</CardDescription>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Sözleşme Ekle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
            {contracts.map((contract) => (
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
      </CardContent>
    </Card>
  );
}
