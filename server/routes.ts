import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { storage } from "./storage";
import { insertClientSchema, insertCaseSchema, insertBondSchema, insertPaymentSchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";
import { aiService } from "./ai-services";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Validate JWT secret at startup - fail fast for production security
  const JWT_SECRET = process.env.SESSION_SECRET;
  if (!JWT_SECRET || JWT_SECRET === 'fallback-secret-for-dev') {
    throw new Error('SESSION_SECRET environment variable must be set for production security');
  }
  
  // Rate limiting for login endpoint
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit to 5 attempts per IP per window
    message: { error: 'Too many login attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
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
  
  // Image-only multer for photo check-ins (security hardening)
  const photoUpload = multer({
    storage: multerStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit for photos
      files: 1 // Only one photo per check-in
    },
    fileFilter: (req, file, cb) => {
      // Only allow image types for photo check-ins
      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      
      if (imageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed for photo check-ins.'));
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

  // Activity routes
  app.get("/api/activities", async (req, res) => {
    try {
      const { resourceId, resourceType, limit } = req.query;
      const activities = await storage.getActivities({
        resourceId: resourceId as string,
        resourceType: resourceType as string,
        limit: limit ? parseInt(limit as string) : 50,
      });
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch activities" });
    }
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const { category, relatedId, relatedType } = req.query;
      const documents = await storage.getDocuments({
        category: category as string,
        relatedId: relatedId as string,
        relatedType: relatedType as string,
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

  // AI-powered routes
  
  // Intelligent search across all data
  app.post("/api/ai/search", async (req, res) => {
    try {
      const { query, language = 'en' } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }

      // Gather all data for search
      const [clients, cases, bonds, payments, documents] = await Promise.all([
        storage.getClients(),
        storage.getCases(),
        storage.getBonds(),
        storage.getPayments(),
        storage.getDocuments()
      ]);

      const results = await aiService.intelligentSearch(query, {
        clients,
        cases,
        bonds,
        payments,
        documents
      }, language);

      res.json({ results });
    } catch (error) {
      console.error('AI search error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Search failed" 
      });
    }
  });

  // Text translation
  app.post("/api/ai/translate", async (req, res) => {
    try {
      const { text, fromLanguage, toLanguage } = req.body;
      
      if (!text || !fromLanguage || !toLanguage) {
        return res.status(400).json({ 
          error: "Text, fromLanguage, and toLanguage are required" 
        });
      }

      const translation = await aiService.translateText({
        text,
        fromLanguage,
        toLanguage
      });

      res.json({ translation });
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Translation failed" 
      });
    }
  });

  // Photo verification for check-ins
  app.post("/api/ai/verify-photo", async (req, res) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Remove data:image/jpeg;base64, prefix if present
      const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const verification = await aiService.verifyCheckinPhoto(base64Image);
      res.json(verification);
    } catch (error) {
      console.error('Photo verification error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Photo verification failed" 
      });
    }
  });

  // AI help and guidance
  app.post("/api/ai/help", async (req, res) => {
    try {
      const { question, language = 'en' } = req.body;
      
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: "Question is required" });
      }

      const response = await aiService.generateHelp(question, language);
      res.json({ response });
    } catch (error) {
      console.error('AI help error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Help generation failed" 
      });
    }
  });

  // Case compliance analysis
  app.post("/api/ai/analyze-compliance", async (req, res) => {
    try {
      const { caseId } = req.body;
      
      if (!caseId) {
        return res.status(400).json({ error: "Case ID is required" });
      }

      const caseData = await storage.getCase(caseId);
      if (!caseData) {
        return res.status(404).json({ error: "Case not found" });
      }

      // Get check-in history (placeholder - would need to implement check-ins)
      const checkins: any[] = [];
      
      const analysis = await aiService.analyzeCaseCompliance(caseData, checkins);
      res.json(analysis);
    } catch (error) {
      console.error('Compliance analysis error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Compliance analysis failed" 
      });
    }
  });

  // CLIENT PORTAL API ROUTES
  
  // Client Portal Authentication
  app.post("/api/client/login", loginLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const client = await storage.authenticateClient(username, password);
      
      if (!client) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Update last check-in time
      await storage.updateClientLastCheckin(client.id);

      // Generate secure JWT token with proper secret validation
      const JWT_SECRET = process.env.SESSION_SECRET;
      if (!JWT_SECRET || JWT_SECRET === 'fallback-secret-for-dev') {
        throw new Error('SESSION_SECRET environment variable must be set for production security');
      }
      
      const token = jwt.sign(
        { 
          clientId: client.id,
          portalEnabled: client.portalEnabled,
          iss: 'bailbond-pro',
          aud: 'client-portal'
        },
        JWT_SECRET,
        { 
          algorithm: 'HS256',
          expiresIn: '24h'
        }
      );

      // Return client data without password and include secure JWT token
      const { portalPassword, ...clientData } = client;
      res.json({ 
        success: true, 
        client: clientData,
        token: token,
        message: "Login successful" 
      });
    } catch (error) {
      console.error('Client login error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Login failed" 
      });
    }
  });

  // Enable portal access for a client (admin use)
  app.post("/api/client/:clientId/enable-portal", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const updatedClient = await storage.enableClientPortal(clientId, username, password);
      const { portalPassword, ...clientData } = updatedClient;
      
      res.json({ 
        success: true, 
        client: clientData,
        message: "Portal access enabled successfully" 
      });
    } catch (error) {
      console.error('Portal enable error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to enable portal access" 
      });
    }
  });

  // Client authentication middleware with JWT verification
  const authenticateClient = async (req: any, res: any, next: any) => {
    try {
      const { clientId } = req.params;
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Verify JWT token with algorithm specification
      const JWT_SECRET = process.env.SESSION_SECRET;
      if (!JWT_SECRET) {
        return res.status(500).json({ error: "Server configuration error" });
      }
      
      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET, {
          algorithms: ['HS256'],
          issuer: 'bailbond-pro',
          audience: 'client-portal'
        });
      } catch (jwtError) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      
      // Verify client ID matches token and client is authorized
      if (decoded.clientId !== clientId || !decoded.portalEnabled) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get client data for additional verification
      const client = await storage.getClient(decoded.clientId);
      if (!client || !client.portalEnabled) {
        return res.status(403).json({ error: "Client not found or portal disabled" });
      }
      
      req.authenticatedClient = client;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ error: "Authentication failed" });
    }
  };

  // Client Dashboard Data
  app.get("/api/client/:clientId/dashboard", authenticateClient, async (req: any, res) => {
    try {
      const { clientId } = req.params;
      
      const [client, bonds, cases, upcomingCourtDates, recentCheckins] = await Promise.all([
        storage.getClient(clientId),
        storage.getClientBonds(clientId),
        storage.getClientCases(clientId),
        storage.getClientUpcomingCourtDates(clientId),
        storage.getClientCheckins({ clientId })
      ]);

      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      res.json({
        client: {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone,
          email: client.email,
          status: client.status,
          lastCheckin: client.lastCheckin
        },
        bonds,
        cases,
        upcomingCourtDates,
        recentCheckins: recentCheckins.slice(0, 5) // Last 5 check-ins
      });
    } catch (error) {
      console.error('Client dashboard error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch dashboard data" 
      });
    }
  });

  // Client Photo Check-in
  app.post("/api/client/:clientId/checkin", authenticateClient, photoUpload.single('photo'), async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const { bondId, latitude, longitude, locationName, notes } = req.body;
      
      if (!bondId) {
        return res.status(400).json({ error: "Bond ID is required" });
      }

      // Verify bond belongs to authenticated client
      const bond = await storage.getBond(bondId);
      if (!bond) {
        return res.status(404).json({ error: "Bond not found" });
      }

      // Get case associated with bond and verify ownership
      const bondCase = await storage.getCase(bond.caseId);
      if (!bondCase || bondCase.clientId !== clientId) {
        return res.status(403).json({ error: "Access denied - bond does not belong to client" });
      }

      let photoUrl = null;
      if (req.file) {
        photoUrl = `/uploads/${req.file.filename}`;
      }

      const checkinData = {
        clientId,
        bondId,
        photoUrl,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        locationName: locationName || null,
        notes: notes || null,
        status: 'completed' as const
      };

      const newCheckin = await storage.createClientCheckin(checkinData);
      
      // Update client's last check-in time
      await storage.updateClientLastCheckin(clientId);

      res.json({ 
        success: true, 
        checkin: newCheckin,
        message: "Check-in completed successfully" 
      });
    } catch (error) {
      console.error('Client check-in error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Check-in failed" 
      });
    }
  });

  // Get client check-in history
  app.get("/api/client/:clientId/checkins", authenticateClient, async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const { bondId } = req.query;
      
      const filter: any = { clientId };
      if (bondId) {
        filter.bondId = bondId as string;
      }

      const checkins = await storage.getClientCheckins(filter);
      res.json(checkins);
    } catch (error) {
      console.error('Client checkins fetch error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch check-ins" 
      });
    }
  });

  // Get client bonds
  app.get("/api/client/:clientId/bonds", authenticateClient, async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const bonds = await storage.getClientBonds(clientId);
      res.json(bonds);
    } catch (error) {
      console.error('Client bonds fetch error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch bonds" 
      });
    }
  });

  // Get client cases
  app.get("/api/client/:clientId/cases", authenticateClient, async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const cases = await storage.getClientCases(clientId);
      res.json(cases);
    } catch (error) {
      console.error('Client cases fetch error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch cases" 
      });
    }
  });

  // Get client court dates
  app.get("/api/client/:clientId/court-dates", authenticateClient, async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const courtDates = await storage.getClientUpcomingCourtDates(clientId);
      res.json(courtDates);
    } catch (error) {
      console.error('Client court dates fetch error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch court dates" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
