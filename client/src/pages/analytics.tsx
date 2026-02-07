import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Package, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from "chart.js";
import type { Analytics } from "@shared/schema";
import { format } from "date-fns";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);
const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<Analytics>({ queryKey: ["/api/analytics"] });
  const average = analytics && analytics.totalOrders > 0 ? analytics.totalRevenue / analytics.totalOrders : 0;

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-foreground">Relatórios</h1><p className="text-muted-foreground">Desempenho de vendas da loja</p></div>
      <div className="grid gap-6 md:grid-cols-3">
        {isLoading ? [...Array(3)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-4 w-24" /></CardHeader></Card>) : <>
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Faturamento Total</CardTitle><DollarSign className="h-5 w-5 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Pedidos</CardTitle><TrendingUp className="h-5 w-5 text-blue-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Ticket Médio</CardTitle><Package className="h-5 w-5 text-orange-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(average)}</div></CardContent></Card>
        </>}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Tendência de Vendas</CardTitle><CardDescription>Últimos 7 dias</CardDescription></CardHeader><CardContent>{isLoading ? <Skeleton className="h-80 w-full" /> : <div className="h-80"><Line data={{ labels: analytics?.salesTrend.map((i) => format(new Date(i.date), "dd/MM")) || [], datasets: [{ label: "Faturamento", data: analytics?.salesTrend.map((i) => i.revenue) || [], borderColor: "rgb(33,150,243)" }, { label: "Pedidos", data: analytics?.salesTrend.map((i) => i.orders) || [], borderColor: "rgb(76,175,80)" }] }} options={{ responsive: true, maintainAspectRatio: false }} /></div>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Produtos Mais Vendidos</CardTitle></CardHeader><CardContent>{isLoading ? <Skeleton className="h-80 w-full" /> : <div className="h-80"><Bar data={{ labels: analytics?.topProducts.slice(0, 5).map((i) => i.productName) || [], datasets: [{ label: "Qtd vendida", data: analytics?.topProducts.slice(0, 5).map((i) => i.totalSold) || [], backgroundColor: "rgba(33,150,243,.8)" }] }} options={{ responsive: true, maintainAspectRatio: false }} /></div>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Participação por Categoria</CardTitle></CardHeader><CardContent>{isLoading ? <Skeleton className="h-80 w-full" /> : <div className="h-80"><Doughnut data={{ labels: analytics?.categoryDistribution.map((i) => i.category) || [], datasets: [{ label: "Faturamento", data: analytics?.categoryDistribution.map((i) => i.revenue) || [] }] }} options={{ responsive: true, maintainAspectRatio: false }} /></div>}</CardContent></Card>
      </div>
    </div>
  );
}
