import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, InsertProduct } from "@shared/schema";
import { insertProductSchema, categories } from "@shared/schema";

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: { name: "", price: 0, stock: 0, category: "Feminino", imageUrl: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertProduct) => apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Sucesso", description: "Produto criado com sucesso" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertProduct }) => apiRequest("PUT", `/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Sucesso", description: "Produto atualizado com sucesso" });
      setIsDialogOpen(false);
      setEditingProduct(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/products/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Sucesso", description: "Produto removido" });
    },
  });

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (data: InsertProduct) => editingProduct ? updateMutation.mutate({ id: editingProduct.id, data }) : createMutation.mutate(data);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-products-title">Produtos</h1>
          <p className="text-muted-foreground">Cadastre peças, acompanhe estoque e organize categorias</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button data-testid="button-add-product"><Plus className="mr-2 h-4 w-4" />Novo Produto</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle><DialogDescription>Preencha os dados da peça.</DialogDescription></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Ex: Jaqueta Jeans" {...field} /></FormControl><FormMessage /></FormItem>} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => <FormItem><FormLabel>Preço</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="stock" render={({ field }) => <FormItem><FormLabel>Estoque</FormLabel><FormControl><Input type="number" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <FormField control={form.control} name="category" render={({ field }) => <FormItem><FormLabel>Categoria</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
              <DialogFooter><Button type="submit">{editingProduct ? "Salvar" : "Criar"}</Button></DialogFooter>
            </form></Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar produtos" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Todas" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select>
      </div>

      {isLoading ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[...Array(8)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-20" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>)}</div> : filteredProducts?.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredProducts.map((product) => <Card key={product.id} className="hover-elevate"><CardHeader><div className="flex items-start justify-between gap-2"><CardTitle className="text-lg">{product.name}</CardTitle><Badge variant="secondary">{product.category}</Badge></div><CardDescription className="text-xl font-bold text-foreground">{formatCurrency(product.price)}</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Estoque</span><Badge variant={product.stock < 10 ? "destructive" : "default"}>{product.stock} un.</Badge></div></CardContent><CardFooter className="flex gap-2"><Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditingProduct(product); form.reset(product); setIsDialogOpen(true); }}><Pencil className="mr-2 h-3 w-3" />Editar</Button><Button variant="outline" size="sm" className="flex-1" onClick={() => deleteMutation.mutate(product.id)}><Trash2 className="mr-2 h-3 w-3" />Excluir</Button></CardFooter></Card>)}</div> : <Card><CardContent className="py-16 text-center"><Package className="mx-auto h-16 w-16 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum produto encontrado</h3></CardContent></Card>}
    </div>
  );
}
