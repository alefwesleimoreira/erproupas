import { useQuery } from "@tanstack/react-query";
import { Users, ShoppingCart, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Customer } from "@shared/schema";
import { format } from "date-fns";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function Customers() {
  const { data: customers, isLoading } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-foreground">Clientes</h1><p className="text-muted-foreground">Histórico de compras e recorrência</p></div>
      {isLoading ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-6 w-32" /></CardHeader></Card>)}</div> : customers?.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{customers.map((customer, index) => <Card key={`${customer.phone}-${index}`} className="hover-elevate"><CardHeader><div className="flex items-start justify-between"><div><CardTitle className="text-lg truncate">{customer.name}</CardTitle><CardDescription>{customer.phone}</CardDescription></div><Users className="h-5 w-5 text-blue-600" /></div></CardHeader><CardContent className="space-y-2"><div className="flex justify-between"><span className="text-muted-foreground">Pedidos</span><Badge variant="secondary"><ShoppingCart className="mr-1 h-3 w-3" />{customer.totalOrders}</Badge></div><div className="flex justify-between"><span className="text-muted-foreground">Gasto total</span><span className="font-semibold"><DollarSign className="inline h-3 w-3" />{formatCurrency(customer.totalSpent)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Última compra</span><span>{format(new Date(customer.lastOrderDate), "dd/MM/yyyy")}</span></div><p className="pt-2 border-t text-xs text-muted-foreground">{customer.address}</p></CardContent></Card>)}</div> : <Card><CardContent className="py-16 text-center">Nenhum cliente encontrado</CardContent></Card>}
    </div>
  );
}
