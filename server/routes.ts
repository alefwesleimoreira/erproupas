import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema, orderStatuses } from "@shared/schema";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(orderStatuses),
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch {
      res.status(500).json({ error: "Falha ao buscar produtos" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }
      res.json(product);
    } catch {
      res.status(500).json({ error: "Falha ao buscar produto" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados de produto inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Falha ao criar produto" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados de produto inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Falha ao atualizar produto" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Falha ao remover produto" });
    }
  });

  app.get("/api/orders", async (_req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch {
      res.status(500).json({ error: "Falha ao buscar pedidos" });
    }
  });

  app.get("/api/orders/recent", async (_req, res) => {
    try {
      const orders = await storage.getRecentOrders(10);
      res.json(orders);
    } catch {
      res.status(500).json({ error: "Falha ao buscar pedidos recentes" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }
      res.json(order);
    } catch {
      res.status(500).json({ error: "Falha ao buscar pedido" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados de pedido inválidos", details: error.errors });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Falha ao criar pedido" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = updateStatusSchema.parse(req.body);
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Status inválido", details: error.errors });
      }
      res.status(500).json({ error: "Falha ao atualizar status do pedido" });
    }
  });

  app.get("/api/customers", async (_req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch {
      res.status(500).json({ error: "Falha ao buscar clientes" });
    }
  });

  app.get("/api/analytics", async (_req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch {
      res.status(500).json({ error: "Falha ao buscar métricas" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
