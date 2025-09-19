import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { storage } from "./storage";
import { insertClientSchema, insertCaseSchema, insertBondSchema, insertPaymentSchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Configure multer for file uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  // Ensure uploads directory exists
  await fs.mkdir(uploadsDir, { recursive: true });
  
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      // Create unique filename with timestamp and random string
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const ext = path.extname(file.originalname);
      const filename = `${timestamp}_${randomString}${ext}`;
      cb(null, filename);
    }
  });
  
  const upload = multer({
    storage: multerStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit per file
      files: 10 // Maximum 10 files per upload
    },
    fileFilter: (req, file, cb) => {
      // Allow common document types
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF, images, Word documents, and text files are allowed.`));
      }
    }
  });
  
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
      
      // Handle PostgreSQL constraint violations
      if (error instanceof Error) {
        if (error.message.includes("duplicate key value violates unique constraint")) {
          if (error.message.includes("clients_email_unique")) {
            return res.status(400).json({ error: "Email address already exists. Please use a different email." });
          }
          return res.status(400).json({ error: "Duplicate value detected. Please check your input." });
        }
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
      
      // Handle PostgreSQL constraint violations
      if (error instanceof Error) {
        if (error.message.includes("duplicate key value violates unique constraint")) {
          if (error.message.includes("cases_case_number_unique")) {
            return res.status(400).json({ error: "Case number already exists. Please use a different case number." });
          }
          return res.status(400).json({ error: "Duplicate value detected. Please check your input." });
        }
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
      
      // Handle PostgreSQL constraint violations
      if (error instanceof Error) {
        if (error.message.includes("duplicate key value violates unique constraint")) {
          if (error.message.includes("bonds_bond_number_unique")) {
            return res.status(400).json({ error: "Bond number already exists. Please use a different bond number." });
          }
          return res.status(400).json({ error: "Duplicate value detected. Please check your input." });
        }
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

  app.post("/api/documents/upload", upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const { category, relatedType, relatedId, notes } = req.body;
      
      if (!category) {
        return res.status(400).json({ error: "Category is required" });
      }

      // For now, use a default user ID since auth isn't implemented yet
      const defaultUserId = "system-user";
      
      // Create document records for each uploaded file
      const createdDocuments = [];
      
      for (const file of files) {
        const documentData = {
          filename: file.filename,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          category,
          relatedId: relatedId || undefined,
          relatedType: relatedType || undefined,
          uploadedBy: defaultUserId,
          notes: notes || undefined,
        };

        // Validate the document data against the insert schema
        const validatedData = insertDocumentSchema.parse(documentData);
        
        const document = await storage.createDocument(validatedData);
        createdDocuments.push(document);
      }

      res.status(201).json({ 
        message: `Successfully uploaded ${createdDocuments.length} document(s)`,
        documents: createdDocuments 
      });
      
    } catch (error) {
      // Clean up uploaded files if document creation fails
      const files = req.files as Express.Multer.File[];
      if (files) {
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error(`Failed to clean up file ${file.filename}:`, unlinkError);
          }
        }
      }
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      
      if (error instanceof multer.MulterError) {
        let message = "File upload error";
        if (error.code === 'LIMIT_FILE_SIZE') {
          message = "File too large. Maximum size is 10MB per file.";
        } else if (error.code === 'LIMIT_FILE_COUNT') {
          message = "Too many files. Maximum is 10 files per upload.";
        }
        return res.status(400).json({ error: message });
      }
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to upload documents" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
