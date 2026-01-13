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
import { FileClock, Gavel, FileSignature } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProject } from "@/context/project-context";
import { useMemo } from "react";

// Proje bazlı verileri simüle ediyoruz
const projectDashboardData: Record<string, any> = {
  "proje-istanbul": {
    stats: {
      totalProgressPayment: 1324000,
      activeContracts: 12,
      pendingTenders: 5,
      upcomingPayments: 3,
      upcomingPaymentsTotal: 175000,
    },
    chartData: [
      { month: "Ocak", income: 186000, expense: 80000 },
      { month: "Şubat", income: 305000, expense: 200000 },
      { month: "Mart", income: 237000, expense: 120000 },
      { month: "Nisan", income: 173000, expense: 190000 },
      { month: "Mayıs", income: 209000, expense: 130000 },
      { month: "Haziran", income: 214000, expense: 140000 },
    ],
    reminders: [
      { id: 1, title: "Proje A İhale Tarihi", date: "2024-08-15", type: "İhale" },
      { id: 2, title: "Sözleşme B İmza", date: "2024-08-20", type: "Sözleşme" },
      { id: 3, title: "Proje C Hakediş Ödemesi", date: "2024-09-01", type: "Hakediş" },
    ],
  },
  "proje-ankara": {
    stats: {
      totalProgressPayment: 850000,
      activeContracts: 8,
      pendingTenders: 2,
      upcomingPayments: 1,
      upcomingPaymentsTotal: 95000,
    },
    chartData: [
      { month: "Ocak", income: 120000, expense: 50000 },
      { month: "Şubat", income: 210000, expense: 150000 },
      { month: "Mart", income: 180000, expense: 90000 },
      { month: "Nisan", income: 150000, expense: 110000 },
      { month: "Mayıs", income: 110000, expense: 80000 },
      { month: "Haziran", income: 190000, expense: 120000 },
    ],
    reminders: [
      { id: 1, title: "Ankara Hafriyat İhalesi", date: "2024-09-10", type: "İhale" },
      { id: 2, title: "Ankara Zemin Etüdü Ödemesi", date: "2024-09-15", type: "Hakediş" },
    ],
  }
};

const emptyData = {
  stats: { totalProgressPayment: 0, activeContracts: 0, pendingTenders: 0, upcomingPayments: 0, upcomingPaymentsTotal: 0 },
  chartData: [],
  reminders: [],
};


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


export default function Home() {
  const { selectedProject } = useProject();
  
  const data = useMemo(() => {
    if (!selectedProject || !projectDashboardData[selectedProject.id]) {
      return emptyData;
    }
    return projectDashboardData[selectedProject.id];
  }, [selectedProject]);


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
