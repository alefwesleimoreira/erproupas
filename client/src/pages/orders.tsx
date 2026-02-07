import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order, OrderStatus } from "@shared/schema";
import { statusConfig, orderStatuses } from "@shared/schema";
import { format } from "date-fns";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const transitionMap: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export default function Orders() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const { data: orders, isLoading } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => apiRequest("PUT", `/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Sucesso", description: "Status atualizado" });
    },
    onError: (error: any) => toast({ title: "Erro", description: error?.message || "Falha ao atualizar status", variant: "destructive" }),
  });

  const filteredOrders = orders?.filter((order) => filterStatus === "all" || order.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Pedidos</h1><p className="text-muted-foreground">Acompanhe e atualize os pedidos da loja</p></div>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{orderStatuses.map((status) => <SelectItem key={status} value={status}>{statusConfig[status].label}</SelectItem>)}</SelectContent></Select>
      </div>

      {isLoading ? <div className="space-y-4">{[...Array(4)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-6 w-48" /></CardHeader></Card>)}</div> : filteredOrders?.length ? <div className="space-y-4">{filteredOrders.map((order) => {
        const availableStatuses = [order.status, ...transitionMap[order.status]];
        return <Card key={order.id}><CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="flex items-center gap-3"><span>{order.customerName}</span><Badge className={`${statusConfig[order.status].bgClass} ${statusConfig[order.status].textClass}`}>{statusConfig[order.status].label}</Badge></CardTitle><CardDescription>Pedido #{order.id.slice(0, 8)} • {format(new Date(order.orderDate), "dd/MM/yyyy HH:mm")}</CardDescription></div><div className="flex items-center gap-2"><span className="text-lg font-bold">{formatCurrency(order.totalAmount)}</span><Select value={order.status} onValueChange={(value) => updateStatusMutation.mutate({ id: order.id, status: value as OrderStatus })}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{availableStatuses.map((status) => <SelectItem key={status} value={status}>{statusConfig[status].label}</SelectItem>)}</SelectContent></Select><Dialog><DialogTrigger asChild><Button variant="outline" size="icon"><Eye className="h-4 w-4" /></Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Detalhes do Pedido</DialogTitle><DialogDescription>Pedido #{order.id.slice(0, 8)}</DialogDescription></DialogHeader><div className="space-y-2 text-sm"><p><strong>Cliente:</strong> {order.customerName}</p><p><strong>Telefone:</strong> {order.customerPhone}</p><p><strong>Endereço:</strong> {order.customerAddress}</p><p><strong>Subtotal:</strong> {formatCurrency(order.subtotalAmount)}</p><p><strong>Desconto:</strong> {formatCurrency(order.discountAmount)}</p><p><strong>Total:</strong> {formatCurrency(order.totalAmount)}</p><div className="pt-2 border-t">{order.items.map((item) => <div key={item.id} className="flex justify-between"><span>{item.productName} x {item.quantity}</span><span>{formatCurrency(item.quantity * item.unitPrice)}</span></div>)}</div></div></DialogContent></Dialog></div></div></CardHeader></Card>;
      })}</div> : <Card><CardContent className="py-16 text-center"><ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum pedido encontrado</h3></CardContent></Card>}
    </div>
  );
}
