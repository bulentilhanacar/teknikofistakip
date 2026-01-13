import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function ProgressPaymentsPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Hakediş Hesaplama</CardTitle>
          <CardDescription>Proje seçerek yeni bir hakediş raporu oluşturun.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Proje Seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOZ-001">SOZ-001: İstanbul Ofis Binası</SelectItem>
                <SelectItem value="SOZ-002">SOZ-002: Eskişehir Villa Projesi</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Hakediş No (örn: 3)" className="w-full sm:w-[200px]" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">İmalat Miktarları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Poz No</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead>Birim Fiyat</TableHead>
                  <TableHead>Sözleşme Miktarı</TableHead>
                  <TableHead>Bu Ayki Miktar</TableHead>
                  <TableHead className="text-right">Bu Ayki Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Y.16.050/01</TableCell>
                  <TableCell>Betonarme Kalıbı</TableCell>
                  <TableCell>m²</TableCell>
                  <TableCell>₺350</TableCell>
                  <TableCell>1200</TableCell>
                  <TableCell><Input className="w-24" defaultValue="150" /></TableCell>
                  <TableCell className="text-right">₺52,500</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell>15.140.1001</TableCell>
                  <TableCell>C30/37 Hazır Beton</TableCell>
                  <TableCell>m³</TableCell>
                  <TableCell>₺2,800</TableCell>
                  <TableCell>800</TableCell>
                  <TableCell><Input className="w-24" defaultValue="80" /></TableCell>
                  <TableCell className="text-right">₺224,000</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Kesintiler</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Deduction form will be here */}
            <p className="text-muted-foreground">Yakında eklenecek.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Hakediş Özeti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>İmalat Toplamı:</span><span>₺276,500</span></div>
            <div className="flex justify-between"><span>KDV (%20):</span><span>₺55,300</span></div>
            <div className="flex justify-between text-destructive"><span>Damga Vergisi:</span><span>- ₺2,621</span></div>
            <div className="flex justify-between text-destructive"><span>SGK Kesintisi:</span><span>- ₺8,295</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span className="font-headline">Ödenecek Tutar:</span><span>₺320,884</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button size="lg">Hakedişi Kaydet ve Raporla</Button>
      </div>
    </div>
  );
}
