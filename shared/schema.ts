import { z } from "zod";

export const categories = [
  "Feminino",
  "Masculino",
  "Infantil",
  "Calçados",
  "Acessórios",
  "Esportivo",
  "Moda Praia",
  "Íntimo",
] as const;

export const orderStatuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type Category = (typeof categories)[number];

export const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome é obrigatório"),
  price: z.coerce.number().positive("Preço deve ser maior que zero"),
  stock: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
  category: z.enum(categories),
  imageUrl: z.string().optional(),
  createdAt: z.string(),
});

export const insertProductSchema = productSchema.omit({ id: true, createdAt: true });

export type Product = z.infer<typeof productSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export const orderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().positive("Quantidade deve ser maior que zero"),
  unitPrice: z.number().positive("Preço deve ser maior que zero"),
});

export const insertOrderItemSchema = orderItemSchema.omit({ id: true, orderId: true });

export type OrderItem = z.infer<typeof orderItemSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export const orderSchema = z.object({
  id: z.string(),
  customerName: z.string().min(1, "Nome do cliente é obrigatório"),
  customerPhone: z.string().min(1, "Telefone é obrigatório"),
  customerAddress: z.string().min(1, "Endereço é obrigatório"),
  totalAmount: z.number().positive("Total deve ser maior que zero"),
  status: z.enum(orderStatuses),
  orderDate: z.string(),
  items: z.array(orderItemSchema),
});

export const insertOrderSchema = z.object({
  customerName: z.string().min(1, "Nome do cliente é obrigatório"),
  customerPhone: z.string().min(10, "Telefone deve ter ao menos 10 dígitos"),
  customerAddress: z.string().min(5, "Endereço é obrigatório"),
  items: z.array(insertOrderItemSchema).min(1, "Adicione ao menos 1 item ao pedido"),
});

export type Order = z.infer<typeof orderSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export const customerSchema = z.object({
  name: z.string(),
  phone: z.string(),
  address: z.string(),
  totalOrders: z.number(),
  totalSpent: z.number(),
  lastOrderDate: z.string(),
});

export type Customer = z.infer<typeof customerSchema>;

export const analyticsSchema = z.object({
  totalRevenue: z.number(),
  totalOrders: z.number(),
  totalProducts: z.number(),
  todayOrders: z.number(),
  salesTrend: z.array(
    z.object({
      date: z.string(),
      revenue: z.number(),
      orders: z.number(),
    }),
  ),
  topProducts: z.array(
    z.object({
      productId: z.string(),
      productName: z.string(),
      totalSold: z.number(),
      revenue: z.number(),
    }),
  ),
  categoryDistribution: z.array(
    z.object({
      category: z.string(),
      count: z.number(),
      revenue: z.number(),
    }),
  ),
});

export type Analytics = z.infer<typeof analyticsSchema>;

export const statusConfig: Record<OrderStatus, { label: string; color: string; bgClass: string; textClass: string }> = {
  pending: {
    label: "Pendente",
    color: "orange",
    bgClass: "bg-orange-100 dark:bg-orange-950",
    textClass: "text-orange-700 dark:text-orange-300",
  },
  confirmed: {
    label: "Confirmado",
    color: "blue",
    bgClass: "bg-blue-100 dark:bg-blue-950",
    textClass: "text-blue-700 dark:text-blue-300",
  },
  preparing: {
    label: "Separando",
    color: "purple",
    bgClass: "bg-purple-100 dark:bg-purple-950",
    textClass: "text-purple-700 dark:text-purple-300",
  },
  ready: {
    label: "Pronto para envio",
    color: "green",
    bgClass: "bg-green-100 dark:bg-green-950",
    textClass: "text-green-700 dark:text-green-300",
  },
  delivered: {
    label: "Entregue",
    color: "gray",
    bgClass: "bg-gray-100 dark:bg-gray-800",
    textClass: "text-gray-700 dark:text-gray-300",
  },
  cancelled: {
    label: "Cancelado",
    color: "red",
    bgClass: "bg-red-100 dark:bg-red-950",
    textClass: "text-red-700 dark:text-red-300",
  },
};
