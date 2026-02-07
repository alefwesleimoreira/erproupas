import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingCart, DollarSign, Clock } from "lucide-react";
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
    { title: "Total de Produtos", value: analytics?.totalProducts || 0, icon: Package, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-950", testId: "stat-products" },
    { title: "Total de Pedidos", value: analytics?.totalOrders || 0, icon: ShoppingCart, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-950", testId: "stat-orders" },
    { title: "Faturamento", value: formatCurrency(analytics?.totalRevenue || 0), icon: DollarSign, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-950", testId: "stat-revenue" },
    { title: "Pedidos Hoje", value: analytics?.todayOrders || 0, icon: Clock, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-950", testId: "stat-today" },
  ];

  const chartData = {
    labels: analytics?.salesTrend.map((item) => format(new Date(item.date), "dd/MM")) || [],
    datasets: [{ label: "Faturamento", data: analytics?.salesTrend.map((item) => item.revenue) || [], borderColor: "rgb(33, 150, 243)", backgroundColor: "rgba(33, 150, 243, 0.1)", fill: true, tension: 0.4 }],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-dashboard-title">Painel</h1>
        <p className="text-muted-foreground">Resumo operacional da sua loja de roupas</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {analyticsLoading ? [...Array(4)].map((_, i) => <Card key={i}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-10 rounded-lg" /></CardHeader><CardContent><Skeleton className="h-8 w-20" /></CardContent></Card>) : stats.map((stat) => (
          <Card key={stat.title} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-foreground" data-testid={stat.testId}>{stat.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Tendência de Vendas</CardTitle><CardDescription>Faturamento dos últimos 7 dias</CardDescription></CardHeader>
          <CardContent>{analyticsLoading ? <Skeleton className="h-64 w-full" /> : <div className="h-64"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pedidos Recentes</CardTitle><CardDescription>Últimos pedidos cadastrados</CardDescription></CardHeader>
          <CardContent><div className="space-y-4">{ordersLoading ? [...Array(5)].map((_, i) => <div key={i} className="flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div><Skeleton className="h-6 w-20 rounded-full" /></div>) : recentOrders?.slice(0, 5).map((order) => <div key={order.id} className="flex items-center justify-between"><div><p className="text-sm font-medium text-foreground">{order.customerName}</p><p className="text-xs text-muted-foreground">{formatCurrency(order.totalAmount)}</p></div><Badge className={`${statusConfig[order.status].bgClass} ${statusConfig[order.status].textClass}`}>{statusConfig[order.status].label}</Badge></div>)}</div></CardContent>
        </Card>
      </div>
    </div>
  );
}
