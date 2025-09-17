import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertCaseSchema, insertBondSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/recent-activity", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivity(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch recent activity" });
    }
  });

  app.get("/api/dashboard/upcoming-court-dates", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const courtDates = await storage.getUpcomingCourtDates(limit);
      res.json(courtDates);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch upcoming court dates" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const { status, search } = req.query;
      const clients = await storage.getClients({
        status: status as string,
        search: search as string,
      });
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/with-bonds", async (req, res) => {
    try {
      const clients = await storage.getClientsWithBonds();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch clients with bonds" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.updateClient(req.params.id, req.body);
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete client" });
    }
  });

  // Case routes
  app.get("/api/cases", async (req, res) => {
    try {
      const { clientId, status } = req.query;
      const cases = await storage.getCases({
        clientId: clientId as string,
        status: status as string,
      });
      res.json(cases);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch cases" });
    }
  });

  app.get("/api/cases/:id", async (req, res) => {
    try {
      const case_ = await storage.getCase(req.params.id);
      if (!case_) {
        return res.status(404).json({ error: "Case not found" });
      }
      res.json(case_);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch case" });
    }
  });

  app.post("/api/cases", async (req, res) => {
    try {
      const validatedData = insertCaseSchema.parse(req.body);
      const case_ = await storage.createCase(validatedData);
      res.status(201).json(case_);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create case" });
    }
  });

  app.patch("/api/cases/:id", async (req, res) => {
    try {
      const case_ = await storage.updateCase(req.params.id, req.body);
      res.json(case_);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update case" });
    }
  });

  app.delete("/api/cases/:id", async (req, res) => {
    try {
      await storage.deleteCase(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete case" });
    }
  });

  // Bond routes
  app.get("/api/bonds", async (req, res) => {
    try {
      const { clientId, status } = req.query;
      const bonds = await storage.getBonds({
        clientId: clientId as string,
        status: status as string,
      });
      res.json(bonds);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch bonds" });
    }
  });

  app.get("/api/bonds/with-details", async (req, res) => {
    try {
      const bonds = await storage.getBondsWithDetails();
      res.json(bonds);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch bonds with details" });
    }
  });

  app.get("/api/bonds/:id", async (req, res) => {
    try {
      const bond = await storage.getBond(req.params.id);
      if (!bond) {
        return res.status(404).json({ error: "Bond not found" });
      }
      res.json(bond);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch bond" });
    }
  });

  app.post("/api/bonds", async (req, res) => {
    try {
      const validatedData = insertBondSchema.parse(req.body);
      const bond = await storage.createBond(validatedData);
      res.status(201).json(bond);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create bond" });
    }
  });

  app.patch("/api/bonds/:id", async (req, res) => {
    try {
      const bond = await storage.updateBond(req.params.id, req.body);
      res.json(bond);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update bond" });
    }
  });

  app.delete("/api/bonds/:id", async (req, res) => {
    try {
      await storage.deleteBond(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete bond" });
    }
  });

  // Payment routes
  app.get("/api/payments", async (req, res) => {
    try {
      const { bondId, clientId } = req.query;
      const payments = await storage.getPayments({
        bondId: bondId as string,
        clientId: clientId as string,
      });
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create payment" });
    }
  });

  // Financial routes
  app.get("/api/financial/summary", async (req, res) => {
    try {
      const summary = await storage.getFinancialSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch financial summary" });
    }
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const { category, relatedId } = req.query;
      const documents = await storage.getDocuments({
        category: category as string,
        relatedId: relatedId as string,
      });
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch documents" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
