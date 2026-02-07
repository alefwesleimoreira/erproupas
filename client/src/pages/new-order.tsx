import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Minus, ShoppingCart, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, InsertOrder } from "@shared/schema";
import { categories, insertOrderSchema } from "@shared/schema";

interface CartItem { productId: string; productName: string; quantity: number; unitPrice: number; maxStock: number }
const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function NewOrder() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const form = useForm<InsertOrder>({ resolver: zodResolver(insertOrderSchema), defaultValues: { customerName: "", customerPhone: "", customerAddress: "", items: [] } });

  const createOrderMutation = useMutation({
    mutationFn: (data: InsertOrder) => apiRequest("POST", "/api/orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Sucesso", description: "Pedido criado com sucesso" });
      setLocation("/orders");
    },
    onError: (error: any) => toast({ title: "Erro", description: error?.message || "Falha ao criar pedido", variant: "destructive" }),
  });

  const filteredProducts = products?.filter((p) => (selectedCategory === "all" || p.category === selectedCategory) && p.stock > 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.productId === product.id);
    if (existing && existing.quantity >= existing.maxStock) return toast({ title: "Atenção", description: "Quantidade máxima em estoque atingida" });
    if (existing) setCart(cart.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    else setCart([...cart, { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.price, maxStock: product.stock }]);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-foreground">Novo Pedido</h1><p className="text-muted-foreground">Monte um pedido com produtos disponíveis em estoque</p></div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}><SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Categorias" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select>
          {isLoading ? <div className="grid gap-4 sm:grid-cols-2">{[...Array(6)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardFooter><Skeleton className="h-9 w-full" /></CardFooter></Card>)}</div> : <div className="grid gap-4 sm:grid-cols-2">{filteredProducts?.map((product) => <Card key={product.id} className="hover-elevate"><CardHeader><CardTitle>{product.name}</CardTitle><CardDescription>{formatCurrency(product.price)}</CardDescription></CardHeader><CardFooter className="flex justify-between"><Badge variant="secondary">{product.stock} em estoque</Badge><Button onClick={() => addToCart(product)}>Adicionar</Button></CardFooter></Card>)}</div>}
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader><CardTitle>Resumo do Pedido</CardTitle><CardDescription>{cart.length} {cart.length === 1 ? "item" : "itens"}</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => <div key={item.productId} className="flex items-start justify-between gap-2"><div><p className="text-sm font-medium">{item.productName}</p><p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)}</p></div><div className="flex items-center gap-2"><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCart(cart.map((it) => it.productId === item.productId ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it))}><Minus className="h-3 w-3" /></Button><span className="w-8 text-center">{item.quantity}</span><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => item.quantity < item.maxStock && setCart(cart.map((it) => it.productId === item.productId ? { ...it, quantity: it.quantity + 1 } : it))}><Plus className="h-3 w-3" /></Button><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCart(cart.filter((it) => it.productId !== item.productId))}><Trash2 className="h-3 w-3" /></Button></div></div>)}
              {cart.length === 0 && <div className="py-8 text-center"><ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Carrinho vazio</p></div>}
              <div className="border-t pt-4 flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(totalAmount)}</span></div>
              <Form {...form}><form onSubmit={form.handleSubmit((data) => createOrderMutation.mutate({ ...data, items: cart.map(({ maxStock, ...rest }) => rest) }))} className="space-y-4">
                <FormField control={form.control} name="customerName" render={({ field }) => <FormItem><FormLabel>Nome do cliente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="customerPhone" render={({ field }) => <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="customerAddress" render={({ field }) => <FormItem><FormLabel>Endereço de entrega</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <Button type="submit" className="w-full" disabled={createOrderMutation.isPending || cart.length === 0}>Finalizar pedido</Button>
              </form></Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
