"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { FileClock, Gavel, FileSignature, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProject } from "@/context/project-context";
import { useMemo } from "react";
import { useUser } from "@/firebase";

const chartConfig = {
  income: {
    label: "Gelir",
    color: "hsl(var(--chart-1))",
  },
  expense: {
    label: "Gider",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const emptyDashboardData = { stats: { totalProgressPayment: 0, activeContracts: 0, pendingTenders: 0, upcomingPayments: 0, upcomingPaymentsTotal: 0 }, chartData: [], reminders: [] };

export default function Home() {
  // const { user, loading } = useUser();
  const { selectedProject } = useProject();
  const loading = false; // temp
  const user = true; // temp
  
  // const data = useMemo(() => {
  //   return getDashboardData();
  // }, [selectedProject, getDashboardData]);
  const data = emptyDashboardData; // Placeholder until dashboard data is also moved to Firestore

  if (loading) {
    return (
      <Card>
          <CardHeader>
              <CardTitle className="font-headline">Finansal Özet</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                  Yükleniyor...
              </div>
          </CardContent>
      </Card>
    )
  }

  // if (!user) {
  //    return (
  //     <Card>
  //         <CardHeader>
  //             <CardTitle className="font-headline">Hoş Geldiniz!</CardTitle>
  //         </CardHeader>
  //         <CardContent>
  //             <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
  //                 <LogIn className="w-12 h-12 mb-4" />
  //                 <p>Uygulamayı kullanmak için lütfen giriş yapın.</p>
  //                 <p className="text-xs mt-2">Sol alttaki menüden Google hesabınızla giriş yapabilirsiniz.</p>
  //             </div>
  //         </CardContent>
  //     </Card>
  //   )
  // }
  
  if (!selectedProject) {
     return (
      <Card>
          <CardHeader>
              <CardTitle className="font-headline">Proje Seçin</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <p>Devam etmek için lütfen sol menüden bir proje seçin veya yeni bir proje oluşturun.</p>
              </div>
          </CardContent>
      </Card>
    )
  }


  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Hakediş
            </CardTitle>
            <span className="text-muted-foreground">₺</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{data.stats.totalProgressPayment.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">+20.1% geçen aydan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktif Sözleşmeler
            </CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.activeContracts}</div>
            <p className="text-xs text-muted-foreground">+2 geçen aydan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bekleyen İhaleler
            </CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.pendingTenders}</div>
            <p className="text-xs text-muted-foreground">Bu hafta 1 yeni</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yaklaşan Ödemeler</CardTitle>
            <FileClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.upcomingPayments}</div>
            <p className="text-xs text-muted-foreground">Toplam ₺{data.stats.upcomingPaymentsTotal.toLocaleString('tr-TR')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline">Nakit Akışı</CardTitle>
            <CardDescription>Son 6 Aylık Gelir ve Giderler</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={data.chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `₺${Number(value) / 1000}k`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Yaklaşan Hatırlatıcılar</CardTitle>
          </CardHeader>
          <CardContent>
             {data.reminders.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead className="text-right">Tarih</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.reminders.map((reminder) => (
                    <TableRow key={reminder.id}>
                        <TableCell className="font-medium">{reminder.title}</TableCell>
                        <TableCell>
                        <Badge variant={reminder.type === 'İhale' ? 'default' : reminder.type === 'Sözleşme' ? 'secondary' : 'outline'}>
                            {reminder.type}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right">{reminder.date}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
             ) : (
                <div className="flex items-center justify-center h-24 text-muted-foreground">
                    Yaklaşan hatırlatıcı bulunmuyor.
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
