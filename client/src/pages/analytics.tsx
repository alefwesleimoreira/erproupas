import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Package, DollarSign, Users, AlertTriangle, Repeat, Scissors } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from "chart.js";
import type { Analytics } from "@shared/schema";
import { statusConfig } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);
const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<Analytics>({ queryKey: ["/api/analytics"] });

  const monthlyData = {
    labels: analytics?.monthlyRevenueTrend.map((i) => format(new Date(i.month), "MMM/yy", { locale: ptBR })) || [],
    datasets: [
      { label: "Faturamento", data: analytics?.monthlyRevenueTrend.map((i) => i.revenue) || [], borderColor: "rgb(59,130,246)", backgroundColor: "rgba(59,130,246,.15)", fill: true },
      { label: "Pedidos", data: analytics?.monthlyRevenueTrend.map((i) => i.orders) || [], borderColor: "rgb(34,197,94)", backgroundColor: "rgba(34,197,94,.15)", fill: true },
    ],
  };

  const categoryData = {
    labels: analytics?.categoryDistribution.map((i) => i.category) || [],
    datasets: [{ data: analytics?.categoryDistribution.map((i) => i.revenue) || [] }],
  };

  const statusData = {
    labels: analytics?.revenueByStatus.map((i) => statusConfig[i.status].label) || [],
    datasets: [{ label: "Pedidos", data: analytics?.revenueByStatus.map((i) => i.orders) || [], backgroundColor: "rgba(99,102,241,.8)" }],
  };

  const topProductsData = {
    labels: analytics?.topProducts.slice(0, 5).map((i) => i.productName) || [],
    datasets: [{ label: "Qtd. vendida", data: analytics?.topProducts.slice(0, 5).map((i) => i.totalSold) || [], backgroundColor: "rgba(14,165,233,.8)" }],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">BI e Relatórios</h1>
        <p className="text-muted-foreground">Indicadores fundamentais para decisão comercial e operacional</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-8">
        {isLoading ? [...Array(8)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-4 w-24" /></CardHeader></Card>) : <>
          <Card><CardHeader className="flex flex-row justify-between"><CardTitle className="text-sm">Faturamento líquido</CardTitle><DollarSign className="h-4 w-4" /></CardHeader><CardContent><p className="text-xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row justify-between"><CardTitle className="text-sm">Faturamento bruto</CardTitle><TrendingUp className="h-4 w-4" /></CardHeader><CardContent><p className="text-xl font-bold">{formatCurrency(analytics?.grossRevenue || 0)}</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row justify-between"><CardTitle className="text-sm">Descontos</CardTitle><Scissors className="h-4 w-4" /></CardHeader><CardContent><p className="text-xl font-bold">{formatCurrency(analytics?.totalDiscount || 0)}</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row justify-between"><CardTitle className="text-sm">Ticket Médio</CardTitle><TrendingUp className="h-4 w-4" /></CardHeader><CardContent><p className="text-xl font-bold">{formatCurrency(analytics?.averageTicket || 0)}</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row justify-between"><CardTitle className="text-sm">Clientes</CardTitle><Users className="h-4 w-4" /></CardHeader><CardContent><p className="text-xl font-bold">{analytics?.totalCustomers || 0}</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row justify-between"><CardTitle className="text-sm">Recorrência</CardTitle><Repeat className="h-4 w-4" /></CardHeader><CardContent><p className="text-xl font-bold">{(analytics?.repeatRate || 0).toFixed(1)}%</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row justify-between"><CardTitle className="text-sm">Pedidos em aberto</CardTitle><Package className="h-4 w-4" /></CardHeader><CardContent><p className="text-xl font-bold">{analytics?.pendingOrders || 0}</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row justify-between"><CardTitle className="text-sm">Cancelamento</CardTitle><AlertTriangle className="h-4 w-4" /></CardHeader><CardContent><p className="text-xl font-bold">{(analytics?.cancellationRate || 0).toFixed(1)}%</p></CardContent></Card>
        </>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Evolução Mensal</CardTitle><CardDescription>Faturamento e volume de pedidos (6 meses)</CardDescription></CardHeader><CardContent>{isLoading ? <Skeleton className="h-80 w-full" /> : <div className="h-80"><Line data={monthlyData} options={{ responsive: true, maintainAspectRatio: false }} /></div>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Pedidos por Status</CardTitle><CardDescription>Distribuição operacional dos pedidos</CardDescription></CardHeader><CardContent>{isLoading ? <Skeleton className="h-80 w-full" /> : <div className="h-80"><Bar data={statusData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Faturamento por Categoria</CardTitle><CardDescription>Mix de receita por departamento</CardDescription></CardHeader><CardContent>{isLoading ? <Skeleton className="h-80 w-full" /> : <div className="h-80"><Doughnut data={categoryData} options={{ responsive: true, maintainAspectRatio: false }} /></div>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Top Produtos</CardTitle><CardDescription>Itens mais vendidos (quantidade)</CardDescription></CardHeader><CardContent>{isLoading ? <Skeleton className="h-80 w-full" /> : <div className="h-80"><Bar data={topProductsData} options={{ responsive: true, maintainAspectRatio: false, indexAxis: "y" as const, plugins: { legend: { display: false } } }} /></div>}</CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Curva ABC</CardTitle><CardDescription>Classificação de produtos por receita acumulada</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <Skeleton className="h-40 w-full" /> : analytics?.abcCurve.slice(0, 8).map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="truncate max-w-[160px]">{item.productName}</span>
                <Badge variant={item.classType === "A" ? "default" : item.classType === "B" ? "secondary" : "outline"}>{item.classType}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Segmentação RFM</CardTitle><CardDescription>Recência, frequência e valor monetário</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <Skeleton className="h-40 w-full" /> : analytics?.rfmSegments.map((segment) => (
              <div key={segment.segment} className="flex justify-between text-sm">
                <span>{segment.segment}</span>
                <span>{segment.customers} clientes</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Reabastecimento sugerido</CardTitle><CardDescription>Produtos abaixo do ponto de reposição</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <Skeleton className="h-40 w-full" /> : analytics?.reorderSuggestions.slice(0, 6).map((item) => (
              <div key={item.productId} className="rounded border p-2 text-sm">
                <p className="font-medium truncate">{item.productName}</p>
                <p>Estoque: {item.currentStock} | Repor: {item.suggestedOrderQty}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
