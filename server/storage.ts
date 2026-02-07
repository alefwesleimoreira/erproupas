import { randomUUID } from "crypto";
import type { Product, InsertProduct, Order, InsertOrder, Customer, Analytics, OrderStatus } from "@shared/schema";

const allowedStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const cancellableStatuses: OrderStatus[] = ["pending", "confirmed", "preparing", "ready"];

export interface IStorage {
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: InsertProduct): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateProductStock(id: string, quantityChange: number): Promise<void>;

  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getRecentOrders(limit: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined>;

  getCustomers(): Promise<Customer[]>;

  getAnalytics(): Promise<Analytics>;
}

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private orders: Map<string, Order>;

  constructor() {
    this.products = new Map();
    this.orders = new Map();
    this.seedData();
  }

  private seedData() {
    const sampleProducts: InsertProduct[] = [
      { name: "Vestido Midi Floral", price: 179.9, stock: 32, category: "Feminino", imageUrl: "" },
      { name: "Blusa de Linho", price: 129.9, stock: 45, category: "Feminino", imageUrl: "" },
      { name: "Camisa Social Slim", price: 159.9, stock: 26, category: "Masculino", imageUrl: "" },
      { name: "Calça Chino", price: 189.9, stock: 20, category: "Masculino", imageUrl: "" },
      { name: "Conjunto Moletom Infantil", price: 149.9, stock: 18, category: "Infantil", imageUrl: "" },
      { name: "Tênis Casual Branco", price: 249.9, stock: 28, category: "Calçados", imageUrl: "" },
      { name: "Sandália Salto Bloco", price: 199.9, stock: 16, category: "Calçados", imageUrl: "" },
      { name: "Bolsa Tiracolo", price: 139.9, stock: 22, category: "Acessórios", imageUrl: "" },
      { name: "Boné Street", price: 69.9, stock: 40, category: "Acessórios", imageUrl: "" },
      { name: "Legging Compressão", price: 119.9, stock: 34, category: "Esportivo", imageUrl: "" },
      { name: "Top Fitness", price: 89.9, stock: 38, category: "Esportivo", imageUrl: "" },
      { name: "Biquíni Cortininha", price: 99.9, stock: 24, category: "Moda Praia", imageUrl: "" },
      { name: "Sunga Lisa", price: 79.9, stock: 21, category: "Moda Praia", imageUrl: "" },
      { name: "Kit Meias Básicas", price: 49.9, stock: 60, category: "Íntimo", imageUrl: "" },
      { name: "Pijama Algodão", price: 109.9, stock: 30, category: "Íntimo", imageUrl: "" },
    ];

    sampleProducts.forEach((product) => {
      const id = randomUUID();
      this.products.set(id, {
        id,
        ...product,
        createdAt: new Date().toISOString(),
      });
    });

    const productArray = Array.from(this.products.values());
    const sampleOrders: Array<{
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }>;
      status: OrderStatus;
      discountAmount?: number;
      daysAgo: number;
    }> = [
      {
        customerName: "Mariana Costa",
        customerPhone: "(11) 98888-1111",
        customerAddress: "Rua das Flores, 123 - São Paulo/SP",
        items: [
          { productId: productArray[0].id, productName: productArray[0].name, quantity: 1, unitPrice: productArray[0].price },
          { productId: productArray[7].id, productName: productArray[7].name, quantity: 1, unitPrice: productArray[7].price },
        ],
        status: "delivered",
        discountAmount: 15,
        daysAgo: 6,
      },
      {
        customerName: "Lucas Almeida",
        customerPhone: "(21) 97777-2222",
        customerAddress: "Av. Atlântica, 580 - Rio de Janeiro/RJ",
        items: [{ productId: productArray[2].id, productName: productArray[2].name, quantity: 2, unitPrice: productArray[2].price }],
        status: "confirmed",
        daysAgo: 2,
      },
      {
        customerName: "Fernanda Souza",
        customerPhone: "(31) 96666-3333",
        customerAddress: "Rua da Bahia, 950 - Belo Horizonte/MG",
        items: [
          { productId: productArray[5].id, productName: productArray[5].name, quantity: 1, unitPrice: productArray[5].price },
          { productId: productArray[8].id, productName: productArray[8].name, quantity: 1, unitPrice: productArray[8].price },
        ],
        status: "ready",
        discountAmount: 10,
        daysAgo: 1,
      },
      {
        customerName: "Renato Pereira",
        customerPhone: "(41) 95555-4444",
        customerAddress: "Rua XV de Novembro, 77 - Curitiba/PR",
        items: [
          { productId: productArray[9].id, productName: productArray[9].name, quantity: 2, unitPrice: productArray[9].price },
          { productId: productArray[10].id, productName: productArray[10].name, quantity: 2, unitPrice: productArray[10].price },
        ],
        status: "preparing",
        daysAgo: 0,
      },
    ];

    sampleOrders.forEach((orderData) => {
      const id = randomUUID();
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - orderData.daysAgo);

      const subtotalAmount = orderData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const discountAmount = Math.min(orderData.discountAmount || 0, subtotalAmount);
      const totalAmount = Math.max(0.01, subtotalAmount - discountAmount);

      const order: Order = {
        id,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress,
        subtotalAmount,
        discountAmount,
        totalAmount,
        status: orderData.status,
        orderDate: orderDate.toISOString(),
        items: orderData.items.map((item) => ({ id: randomUUID(), orderId: id, ...item })),
      };

      this.orders.set(id, order);
    });
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      id,
      ...insertProduct,
      createdAt: new Date().toISOString(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, insertProduct: InsertProduct): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;

    const updated: Product = {
      ...existing,
      ...insertProduct,
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async updateProductStock(id: string, quantityChange: number): Promise<void> {
    const product = this.products.get(id);
    if (product) {
      product.stock = Math.max(0, product.stock + quantityChange);
      this.products.set(id, product);
    }
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getRecentOrders(limit: number): Promise<Order[]> {
    const orders = await this.getOrders();
    return orders.slice(0, limit);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    for (const item of insertOrder.items) {
      const product = this.products.get(item.productId);
      if (!product) {
        throw new Error(`Produto não encontrado: ${item.productName}`);
      }
      if (item.quantity > product.stock) {
        throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${product.stock}`);
      }
    }

    const id = randomUUID();
    const subtotalAmount = insertOrder.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discountAmount = Math.min(insertOrder.discountAmount || 0, subtotalAmount);
    const totalAmount = Math.max(0.01, subtotalAmount - discountAmount);

    const order: Order = {
      id,
      customerName: insertOrder.customerName,
      customerPhone: insertOrder.customerPhone,
      customerAddress: insertOrder.customerAddress,
      subtotalAmount,
      discountAmount,
      totalAmount,
      status: "pending",
      orderDate: new Date().toISOString(),
      items: insertOrder.items.map((item) => ({
        id: randomUUID(),
        orderId: id,
        ...item,
      })),
    };

    for (const item of order.items) {
      await this.updateProductStock(item.productId, -item.quantity);
    }

    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    if (order.status === status) {
      return order;
    }

    const allowedNext = allowedStatusTransitions[order.status];
    if (!allowedNext.includes(status)) {
      throw new Error(`Transição inválida: ${order.status} -> ${status}`);
    }

    if (status === "cancelled" && cancellableStatuses.includes(order.status)) {
      for (const item of order.items) {
        await this.updateProductStock(item.productId, item.quantity);
      }
    }

    order.status = status;
    this.orders.set(id, order);
    return order;
  }

  async getCustomers(): Promise<Customer[]> {
    const orders = Array.from(this.orders.values());
    const customerMap = new Map<string, Customer>();

    orders.forEach((order) => {
      const key = order.customerPhone;
      const existing = customerMap.get(key);

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += order.totalAmount;
        if (new Date(order.orderDate) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.orderDate;
        }
      } else {
        customerMap.set(key, {
          name: order.customerName,
          phone: order.customerPhone,
          address: order.customerAddress,
          totalOrders: 1,
          totalSpent: order.totalAmount,
          lastOrderDate: order.orderDate,
        });
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime());
  }

  async getAnalytics(): Promise<Analytics> {
    const products = Array.from(this.products.values());
    const orders = Array.from(this.orders.values());

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const grossRevenue = orders.reduce((sum, order) => sum + order.subtotalAmount, 0);
    const totalDiscount = orders.reduce((sum, order) => sum + order.discountAmount, 0);
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const pendingOrders = orders.filter((order) => ["pending", "confirmed", "preparing", "ready"].includes(order.status)).length;
    const cancelledOrders = orders.filter((order) => order.status === "cancelled").length;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    const customerOrderCount = new Map<string, number>();
    const customerSpentMap = new Map<string, number>();
    const customerLastOrderDate = new Map<string, Date>();

    orders.forEach((order) => {
      const phone = order.customerPhone;
      customerOrderCount.set(phone, (customerOrderCount.get(phone) || 0) + 1);
      customerSpentMap.set(phone, (customerSpentMap.get(phone) || 0) + order.totalAmount);
      const existingDate = customerLastOrderDate.get(phone);
      const orderDate = new Date(order.orderDate);
      if (!existingDate || orderDate > existingDate) {
        customerLastOrderDate.set(phone, orderDate);
      }
    });

    const totalCustomers = customerOrderCount.size;
    const repeatCustomers = Array.from(customerOrderCount.values()).filter((count) => count > 1).length;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    const lowStockProducts = products
      .filter((product) => product.stock <= 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8)
      .map((product) => ({
        productId: product.id,
        productName: product.name,
        stock: product.stock,
      }));

    const productSalesUnits = new Map<string, number>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        productSalesUnits.set(item.productId, (productSalesUnits.get(item.productId) || 0) + item.quantity);
      });
    });

    const reorderSuggestions = products
      .map((product) => {
        const soldUnits = productSalesUnits.get(product.id) || 0;
        const avgDailySales = soldUnits / 30;
        const leadTimeDays = 7;
        const safetyStock = Math.max(2, Math.ceil(avgDailySales * 3));
        const reorderPoint = Math.ceil(avgDailySales * leadTimeDays + safetyStock);
        const suggestedOrderQty = Math.max(0, reorderPoint * 2 - product.stock);
        return {
          productId: product.id,
          productName: product.name,
          currentStock: product.stock,
          reorderPoint,
          suggestedOrderQty,
        };
      })
      .filter((item) => item.currentStock <= item.reorderPoint)
      .sort((a, b) => b.suggestedOrderQty - a.suggestedOrderQty)
      .slice(0, 8);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((order) => new Date(order.orderDate) >= today).length;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const salesTrend = last7Days.map((date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= date && orderDate < nextDay;
      });

      return {
        date: date.toISOString(),
        revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        orders: dayOrders.length,
      };
    });

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const monthlyRevenueTrend = last6Months.map((date) => {
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const monthOrders = orders.filter((order) => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= date && orderDate < nextMonth;
      });

      return {
        month: date.toISOString(),
        revenue: monthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        orders: monthOrders.length,
      };
    });

    const productSales = new Map<string, { productName: string; totalSold: number; revenue: number }>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = productSales.get(item.productId);
        if (existing) {
          existing.totalSold += item.quantity;
          existing.revenue += item.quantity * item.unitPrice;
        } else {
          productSales.set(item.productId, {
            productName: item.productName,
            totalSold: item.quantity,
            revenue: item.quantity * item.unitPrice,
          });
        }
      });
    });

    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        ...data,
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    const totalProductRevenue = topProducts.reduce((sum, product) => sum + product.revenue, 0);
    let accumulatedRevenue = 0;
    const abcCurve = topProducts.map((product) => {
      accumulatedRevenue += product.revenue;
      const accumulatedShare = totalProductRevenue > 0 ? (accumulatedRevenue / totalProductRevenue) * 100 : 0;
      const classType: "A" | "B" | "C" = accumulatedShare <= 80 ? "A" : accumulatedShare <= 95 ? "B" : "C";
      return {
        productId: product.productId,
        productName: product.productName,
        revenue: product.revenue,
        accumulatedShare,
        classType,
      };
    });

    const categoryRevenue = new Map<string, { count: number; revenue: number }>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          const existing = categoryRevenue.get(product.category);
          if (existing) {
            existing.count += item.quantity;
            existing.revenue += item.quantity * item.unitPrice;
          } else {
            categoryRevenue.set(product.category, {
              count: item.quantity,
              revenue: item.quantity * item.unitPrice,
            });
          }
        }
      });
    });

    const categoryDistribution = Array.from(categoryRevenue.entries())
      .map(([category, data]) => ({
        category,
        ...data,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const statusMap = new Map<OrderStatus, { orders: number; revenue: number }>();

    orders.forEach((order) => {
      const current = statusMap.get(order.status) || { orders: 0, revenue: 0 };
      current.orders += 1;
      current.revenue += order.totalAmount;
      statusMap.set(order.status, current);
    });

    const revenueByStatus = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"].map((status) => {
      const data = statusMap.get(status as OrderStatus) || { orders: 0, revenue: 0 };
      return { status: status as OrderStatus, orders: data.orders, revenue: data.revenue };
    });

    const now = new Date();
    const rfm = new Map<
      string,
      {
        segment: string;
        revenue: number;
      }
    >();

    customerOrderCount.forEach((frequency, phone) => {
      const recencyDays = Math.ceil((now.getTime() - (customerLastOrderDate.get(phone)?.getTime() || now.getTime())) / (1000 * 60 * 60 * 24));
      const monetary = customerSpentMap.get(phone) || 0;

      let segment = "Base";
      if (frequency >= 3 && monetary >= 500 && recencyDays <= 30) {
        segment = "VIP";
      } else if (frequency >= 2 && recencyDays <= 60) {
        segment = "Recorrente";
      } else if (recencyDays > 90) {
        segment = "Em risco";
      } else if (frequency === 1 && recencyDays <= 30) {
        segment = "Novo";
      }

      rfm.set(phone, { segment, revenue: monetary });
    });

    const segmentMap = new Map<string, { customers: number; revenue: number }>();
    Array.from(rfm.values()).forEach((item) => {
      const current = segmentMap.get(item.segment) || { customers: 0, revenue: 0 };
      current.customers += 1;
      current.revenue += item.revenue;
      segmentMap.set(item.segment, current);
    });

    const rfmSegments = Array.from(segmentMap.entries())
      .map(([segment, data]) => ({ segment, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      grossRevenue,
      totalDiscount,
      totalOrders,
      totalProducts,
      todayOrders,
      averageTicket,
      totalCustomers,
      repeatCustomers,
      repeatRate,
      cancelledOrders,
      cancellationRate,
      pendingOrders,
      lowStockProducts,
      reorderSuggestions,
      revenueByStatus,
      monthlyRevenueTrend,
      abcCurve,
      rfmSegments,
      salesTrend,
      topProducts,
      categoryDistribution,
    };
  }
}

export const storage = new MemStorage();
