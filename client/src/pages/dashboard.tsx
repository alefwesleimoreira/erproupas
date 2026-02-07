import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingCart, DollarSign, Clock, AlertTriangle, Repeat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import type { Analytics, Order } from "@shared/schema";
import { statusConfig } from "@shared/schema";
import { format } from "date-fns";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function Dashboard() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({ queryKey: ["/api/analytics"] });
  const { data: recentOrders, isLoading: ordersLoading } = useQuery<Order[]>({ queryKey: ["/api/orders/recent"] });

  const stats = [
    { title: "Faturamento", value: formatCurrency(analytics?.totalRevenue || 0), icon: DollarSign, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-950" },
    { title: "Ticket médio", value: formatCurrency(analytics?.averageTicket || 0), icon: ShoppingCart, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-950" },
    { title: "Pedidos hoje", value: analytics?.todayOrders || 0, icon: Clock, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-950" },
    { title: "Em aberto", value: analytics?.pendingOrders || 0, icon: Package, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-950" },
    { title: "Recorrência", value: `${(analytics?.repeatRate || 0).toFixed(1)}%`, icon: Repeat, color: "text-cyan-600", bgColor: "bg-cyan-100 dark:bg-cyan-950" },
    { title: "Cancelamento", value: `${(analytics?.cancellationRate || 0).toFixed(1)}%`, icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-950" },
  ];

  const chartData = {
    labels: analytics?.salesTrend.map((item) => format(new Date(item.date), "dd/MM")) || [],
    datasets: [{ label: "Faturamento", data: analytics?.salesTrend.map((item) => item.revenue) || [], borderColor: "rgb(33, 150, 243)", backgroundColor: "rgba(33, 150, 243, 0.1)", fill: true, tension: 0.4 }],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-dashboard-title">Painel Executivo</h1>
        <p className="text-muted-foreground">Visão rápida de vendas, operação e risco de estoque</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {analyticsLoading ? [...Array(6)].map((_, i) => <Card key={i}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-10 rounded-lg" /></CardHeader><CardContent><Skeleton className="h-8 w-20" /></CardContent></Card>) : stats.map((stat) => (
          <Card key={stat.title} className="hover-elevate"><CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stat.value}</div></CardContent></Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Tendência Semanal</CardTitle><CardDescription>Faturamento dos últimos 7 dias</CardDescription></CardHeader>
          <CardContent>{analyticsLoading ? <Skeleton className="h-64 w-full" /> : <div className="h-64"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pedidos Recentes</CardTitle><CardDescription>Últimos pedidos cadastrados</CardDescription></CardHeader>
          <CardContent><div className="space-y-4">{ordersLoading ? [...Array(5)].map((_, i) => <div key={i} className="flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div><Skeleton className="h-6 w-20 rounded-full" /></div>) : recentOrders?.slice(0, 5).map((order) => <div key={order.id} className="flex items-center justify-between"><div><p className="text-sm font-medium text-foreground">{order.customerName}</p><p className="text-xs text-muted-foreground">{formatCurrency(order.totalAmount)}</p></div><Badge className={`${statusConfig[order.status].bgClass} ${statusConfig[order.status].textClass}`}>{statusConfig[order.status].label}</Badge></div>)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Alerta de Estoque Crítico</CardTitle><CardDescription>Produtos que exigem reposição imediata</CardDescription></CardHeader>
        <CardContent>
          {analyticsLoading ? <Skeleton className="h-20 w-full" /> : analytics?.lowStockProducts.length ? (
            <div className="flex flex-wrap gap-2">
              {analytics.lowStockProducts.slice(0, 6).map((item) => (
                <Badge key={item.productId} variant={item.stock <= 3 ? "destructive" : "secondary"}>
                  {item.productName}: {item.stock}
                </Badge>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">Sem produtos em nível crítico de estoque.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
