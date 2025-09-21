import { 
  type User, type InsertUser,
  type Client, type InsertClient,
  type Case, type InsertCase,
  type Bond, type InsertBond,
  type Payment, type InsertPayment,
  type Document, type InsertDocument,
  type Activity, type InsertActivity,
  type ClientCheckin, type InsertClientCheckin,
  type ContractTemplate, type InsertContractTemplate,
  type GeneratedContract, type InsertGeneratedContract,
  type TrainingModule, type InsertTrainingModule,
  type TrainingProgress, type InsertTrainingProgress,
  type StandardOperatingProcedure, type InsertSOP,
  users, clients, cases, bonds, payments, documents, activities, clientCheckins,
  contractTemplates, generatedContracts, trainingModules, trainingProgress, standardOperatingProcedures
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUsers(filter?: { role?: string; isActive?: boolean }): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<boolean>;

  // Clients
  getClient(id: string): Promise<Client | undefined>;
  getClients(filter?: { status?: string; search?: string }): Promise<Client[]>;
  getClientsWithBonds(): Promise<any[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<Client>): Promise<Client>;
  deleteClient(id: string): Promise<boolean>;

  // Cases
  getCase(id: string): Promise<Case | undefined>;
  getCases(filter?: { clientId?: string; status?: string }): Promise<Case[]>;
  createCase(case_: InsertCase): Promise<Case>;
  updateCase(id: string, case_: Partial<Case>): Promise<Case>;
  deleteCase(id: string): Promise<boolean>;

  // Bonds
  getBond(id: string): Promise<Bond | undefined>;
  getBonds(filter?: { clientId?: string; status?: string }): Promise<Bond[]>;
  getBondsWithDetails(): Promise<any[]>;
  createBond(bond: InsertBond): Promise<Bond>;
  updateBond(id: string, bond: Partial<Bond>): Promise<Bond>;
  deleteBond(id: string): Promise<boolean>;

  // Payments
  getPayment(id: string): Promise<Payment | undefined>;
  getPayments(filter?: { bondId?: string; clientId?: string }): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<Payment>): Promise<Payment>;
  deletePayment(id: string): Promise<boolean>;

  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  getDocuments(filter?: { category?: string; relatedId?: string; relatedType?: string }): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<Document>): Promise<Document>;
  deleteDocument(id: string): Promise<boolean>;

  // Activities
  getActivities(filter?: { resourceId?: string; resourceType?: string; limit?: number }): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Dashboard & Analytics
  getDashboardStats(): Promise<any>;
  getRecentActivity(limit?: number): Promise<any[]>;
  getUpcomingCourtDates(limit?: number): Promise<any[]>;
  getFinancialSummary(): Promise<any>;

  // Client Portal Authentication
  getClientByPortalUsername(username: string): Promise<Client | undefined>;
  enableClientPortal(clientId: string, username: string, password: string): Promise<Client>;
  authenticateClient(username: string, password: string): Promise<Client | null>;
  updateClientLastCheckin(clientId: string): Promise<Client>;

  // Client Check-ins
  getClientCheckin(id: string): Promise<ClientCheckin | undefined>;
  getClientCheckins(filter?: { clientId?: string; bondId?: string }): Promise<ClientCheckin[]>;
  createClientCheckin(checkin: InsertClientCheckin): Promise<ClientCheckin>;
  updateClientCheckin(id: string, checkin: Partial<ClientCheckin>): Promise<ClientCheckin>;

  // Client Portal Data
  getClientBonds(clientId: string): Promise<Bond[]>;
  getClientCases(clientId: string): Promise<Case[]>;
  getClientUpcomingCourtDates(clientId: string): Promise<any[]>;

  // Contract Templates
  getContractTemplate(id: string): Promise<ContractTemplate | undefined>;
  getContractTemplates(filter?: { type?: string; isActive?: boolean }): Promise<ContractTemplate[]>;
  createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate>;
  updateContractTemplate(id: string, template: Partial<ContractTemplate>): Promise<ContractTemplate>;
  deleteContractTemplate(id: string): Promise<boolean>;

  // Generated Contracts
  getGeneratedContract(id: string): Promise<GeneratedContract | undefined>;
  getGeneratedContracts(filter?: { clientId?: string; templateId?: string; status?: string }): Promise<GeneratedContract[]>;
  createGeneratedContract(contract: InsertGeneratedContract): Promise<GeneratedContract>;
  updateGeneratedContract(id: string, contract: Partial<GeneratedContract>): Promise<GeneratedContract>;
  deleteGeneratedContract(id: string): Promise<boolean>;

  // Training Modules
  getTrainingModule(id: string): Promise<TrainingModule | undefined>;
  getTrainingModules(filter?: { category?: string; isActive?: boolean; isRequired?: boolean }): Promise<TrainingModule[]>;
  createTrainingModule(module: InsertTrainingModule): Promise<TrainingModule>;
  updateTrainingModule(id: string, module: Partial<TrainingModule>): Promise<TrainingModule>;
  deleteTrainingModule(id: string): Promise<boolean>;

  // Training Progress
  getTrainingProgress(userId: string, moduleId: string): Promise<TrainingProgress | undefined>;
  getUserTrainingProgress(userId: string): Promise<TrainingProgress[]>;
  createTrainingProgress(progress: InsertTrainingProgress): Promise<TrainingProgress>;
  updateTrainingProgress(id: string, progress: Partial<TrainingProgress>): Promise<TrainingProgress>;

  // Standard Operating Procedures
  getSOP(id: string): Promise<StandardOperatingProcedure | undefined>;
  getSOPs(filter?: { category?: string; isActive?: boolean }): Promise<StandardOperatingProcedure[]>;
  createSOP(sop: InsertSOP): Promise<StandardOperatingProcedure>;
  updateSOP(id: string, sop: Partial<StandardOperatingProcedure>): Promise<StandardOperatingProcedure>;
  deleteSOP(id: string): Promise<boolean>;
}


// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUsers(filter?: { role?: string; isActive?: boolean }): Promise<User[]> {
    const conditions = [];
    if (filter?.role) {
      conditions.push(eq(users.role, filter.role));
    }
    if (filter?.isActive !== undefined) {
      conditions.push(eq(users.isActive, filter.isActive));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(users).where(and(...conditions)).orderBy(users.createdAt);
    }
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    if (!updated) throw new Error("User not found");
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Clients
  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClients(filter?: { status?: string; search?: string }): Promise<Client[]> {
    const conditions = [];
    if (filter?.status) {
      conditions.push(eq(clients.status, filter.status));
    }
    
    if (filter?.search) {
      const searchTerm = `%${filter.search}%`;
      conditions.push(
        or(
          like(clients.firstName, searchTerm),
          like(clients.lastName, searchTerm),
          like(clients.phone, searchTerm),
          like(clients.email, searchTerm)
        )
      );
    }
    
    if (conditions.length > 0) {
      return db.select().from(clients).where(and(...conditions)).orderBy(desc(clients.createdAt));
    }
    
    return db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClientsWithBonds(): Promise<any[]> {
    const result = await db
      .select({
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        dateOfBirth: clients.dateOfBirth,
        phone: clients.phone,
        email: clients.email,
        address: clients.address,
        city: clients.city,
        state: clients.state,
        zipCode: clients.zipCode,
        emergencyContact: clients.emergencyContact,
        emergencyPhone: clients.emergencyPhone,
        status: clients.status,
        notes: clients.notes,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
        totalBonds: sql<number>`count(${bonds.id})`
      })
      .from(clients)
      .leftJoin(bonds, eq(clients.id, bonds.clientId))
      .groupBy(clients.id)
      .orderBy(desc(clients.createdAt));
    
    return result.map(row => ({
      ...row,
      total_bonds: row.totalBonds,
      last_bond_date: null // Will enhance later
    }));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<Client>): Promise<Client> {
    const [updated] = await db.update(clients).set(client).where(eq(clients.id, id)).returning();
    if (!updated) throw new Error("Client not found");
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Cases
  async getCase(id: string): Promise<Case | undefined> {
    const [case_] = await db.select().from(cases).where(eq(cases.id, id));
    return case_ || undefined;
  }

  async getCases(filter?: { clientId?: string; status?: string }): Promise<Case[]> {
    const conditions = [];
    if (filter?.clientId) {
      conditions.push(eq(cases.clientId, filter.clientId));
    }
    if (filter?.status) {
      conditions.push(eq(cases.status, filter.status));
    }
    
    if (conditions.length > 0) {
      return db.select().from(cases).where(and(...conditions)).orderBy(desc(cases.createdAt));
    }
    
    return db.select().from(cases).orderBy(desc(cases.createdAt));
  }

  async createCase(case_: InsertCase): Promise<Case> {
    const [newCase] = await db.insert(cases).values(case_).returning();
    return newCase;
  }

  async updateCase(id: string, case_: Partial<Case>): Promise<Case> {
    const [updated] = await db.update(cases).set(case_).where(eq(cases.id, id)).returning();
    if (!updated) throw new Error("Case not found");
    return updated;
  }

  async deleteCase(id: string): Promise<boolean> {
    const result = await db.delete(cases).where(eq(cases.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Bonds
  async getBond(id: string): Promise<Bond | undefined> {
    const [bond] = await db.select().from(bonds).where(eq(bonds.id, id));
    return bond || undefined;
  }

  async getBonds(filter?: { clientId?: string; status?: string }): Promise<Bond[]> {
    const conditions = [];
    if (filter?.clientId) {
      conditions.push(eq(bonds.clientId, filter.clientId));
    }
    if (filter?.status) {
      conditions.push(eq(bonds.status, filter.status));
    }
    
    if (conditions.length > 0) {
      return db.select().from(bonds).where(and(...conditions)).orderBy(desc(bonds.createdAt));
    }
    
    return db.select().from(bonds).orderBy(desc(bonds.createdAt));
  }

  async getBondsWithDetails(): Promise<any[]> {
    const result = await db
      .select({
        id: bonds.id,
        bondNumber: bonds.bondNumber,
        clientId: bonds.clientId,
        caseId: bonds.caseId,
        bondAmount: bonds.bondAmount,
        premiumAmount: bonds.premiumAmount,
        premiumRate: bonds.premiumRate,
        collateralAmount: bonds.collateralAmount,
        collateralDescription: bonds.collateralDescription,
        status: bonds.status,
        issueDate: bonds.issueDate,
        exonerationDate: bonds.exonerationDate,
        paymentStatus: bonds.paymentStatus,
        agentId: bonds.agentId,
        notes: bonds.notes,
        createdAt: bonds.createdAt,
        updatedAt: bonds.updatedAt,
        clientName: sql<string>`CONCAT(${clients.firstName}, ' ', ${clients.lastName})`,
        clientPhone: clients.phone,
        courtDate: cases.courtDate,
        agentName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`
      })
      .from(bonds)
      .leftJoin(clients, eq(bonds.clientId, clients.id))
      .leftJoin(cases, eq(bonds.caseId, cases.id))
      .leftJoin(users, eq(bonds.agentId, users.id))
      .orderBy(desc(bonds.createdAt));
    
    return result.map(row => ({
      ...row,
      client_name: row.clientName || "Unknown",
      client_phone: row.clientPhone || "",
      court_date: row.courtDate,
      agent_name: row.agentName || "Unknown"
    }));
  }

  async createBond(bond: InsertBond): Promise<Bond> {
    const [newBond] = await db.insert(bonds).values(bond).returning();
    
    // Create activity record if agent is specified
    if (bond.agentId) {
      await this.createActivity({
        userId: bond.agentId,
        action: "created",
        resourceType: "bond",
        resourceId: newBond.id,
        details: { bondNumber: newBond.bondNumber, clientId: newBond.clientId }
      });
    }
    
    return newBond;
  }

  async updateBond(id: string, bond: Partial<Bond>): Promise<Bond> {
    const [updated] = await db.update(bonds).set(bond).where(eq(bonds.id, id)).returning();
    if (!updated) throw new Error("Bond not found");
    return updated;
  }

  async deleteBond(id: string): Promise<boolean> {
    const result = await db.delete(bonds).where(eq(bonds.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Payments
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPayments(filter?: { bondId?: string; clientId?: string }): Promise<Payment[]> {
    const conditions = [];
    if (filter?.bondId) {
      conditions.push(eq(payments.bondId, filter.bondId));
    }
    if (filter?.clientId) {
      conditions.push(eq(payments.clientId, filter.clientId));
    }
    
    if (conditions.length > 0) {
      return db.select().from(payments).where(and(...conditions)).orderBy(desc(payments.createdAt));
    }
    
    return db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: string, payment: Partial<Payment>): Promise<Payment> {
    const [updated] = await db.update(payments).set(payment).where(eq(payments.id, id)).returning();
    if (!updated) throw new Error("Payment not found");
    return updated;
  }

  async deletePayment(id: string): Promise<boolean> {
    const result = await db.delete(payments).where(eq(payments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getDocuments(filter?: { category?: string; relatedId?: string; relatedType?: string }): Promise<Document[]> {
    const conditions = [];
    if (filter?.category) {
      conditions.push(eq(documents.category, filter.category));
    }
    if (filter?.relatedId) {
      conditions.push(eq(documents.relatedId, filter.relatedId));
    }
    if (filter?.relatedType) {
      conditions.push(eq(documents.relatedType, filter.relatedType));
    }
    
    if (conditions.length > 0) {
      return db.select().from(documents).where(and(...conditions)).orderBy(desc(documents.createdAt));
    }
    
    return db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: string, document: Partial<Document>): Promise<Document> {
    const [updated] = await db.update(documents).set(document).where(eq(documents.id, id)).returning();
    if (!updated) throw new Error("Document not found");
    return updated;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Activities
  async getActivities(filter?: { resourceId?: string; resourceType?: string; limit?: number }): Promise<Activity[]> {
    const conditions = [];
    const limit = filter?.limit || 50;
    
    if (filter?.resourceId) {
      conditions.push(eq(activities.resourceId, filter.resourceId));
    }
    if (filter?.resourceType) {
      conditions.push(eq(activities.resourceType, filter.resourceType));
    }
    
    if (conditions.length > 0) {
      return db.select().from(activities).where(and(...conditions)).orderBy(desc(activities.createdAt)).limit(limit);
    }
    
    return db.select().from(activities).orderBy(desc(activities.createdAt)).limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Dashboard & Analytics
  async getDashboardStats(): Promise<any> {
    const [activeBondsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bonds)
      .where(eq(bonds.status, 'active'));
    
    // Total Revenue: Sum of premium amounts from all active bonds (money earned from writing bonds)
    const [totalRevenueResult] = await db
      .select({ total: sql<number>`coalesce(sum(${bonds.premiumAmount}), 0)` })
      .from(bonds)
      .where(eq(bonds.status, 'active'));
    
    // Pending Payments: Sum of premium amounts where payment status is pending/partial
    const [pendingPaymentsResult] = await db
      .select({ total: sql<number>`coalesce(sum(${bonds.premiumAmount}), 0)` })
      .from(bonds)
      .where(and(
        eq(bonds.status, 'active'),
        or(eq(bonds.paymentStatus, 'pending'), eq(bonds.paymentStatus, 'partial'))
      ));
    
    const [upcomingCourtDatesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cases)
      .where(and(
        eq(cases.status, 'open'),
        sql`${cases.courtDate} IS NOT NULL AND ${cases.courtDate}::date >= current_date`
      ));
    
    return {
      activeBonds: activeBondsResult?.count || 0,
      totalRevenue: Number(totalRevenueResult?.total || 0),
      pendingPayments: Number(pendingPaymentsResult?.total || 0),
      upcomingCourtDates: upcomingCourtDatesResult?.count || 0
    };
  }

  async getRecentActivity(limit: number = 10): Promise<any[]> {
    const result = await db
      .select({
        id: activities.id,
        userId: activities.userId,
        action: activities.action,
        resourceType: activities.resourceType,
        resourceId: activities.resourceId,
        details: activities.details,
        createdAt: activities.createdAt,
        userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`
      })
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
    
    return result.map(row => ({
      ...row,
      user_name: row.userName || "Unknown"
    }));
  }

  async getUpcomingCourtDates(limit: number = 10): Promise<any[]> {
    const result = await db
      .select({
        id: cases.id,
        caseNumber: cases.caseNumber,
        clientId: cases.clientId,
        charges: cases.charges,
        arrestDate: cases.arrestDate,
        courtDate: cases.courtDate,
        courtLocation: cases.courtLocation,
        judgeName: cases.judgeName,
        prosecutorName: cases.prosecutorName,
        defenseAttorney: cases.defenseAttorney,
        status: cases.status,
        notes: cases.notes,
        createdAt: cases.createdAt,
        updatedAt: cases.updatedAt,
        clientName: sql<string>`CONCAT(${clients.firstName}, ' ', ${clients.lastName})`,
        bondNumber: bonds.bondNumber
      })
      .from(cases)
      .leftJoin(clients, eq(cases.clientId, clients.id))
      .leftJoin(bonds, eq(cases.id, bonds.caseId))
      .where(and(
        eq(cases.status, 'open'),
        sql`${cases.courtDate}::date >= current_date`
      ))
      .orderBy(sql`${cases.courtDate}::date`)
      .limit(limit);
    
    return result.map(row => ({
      ...row,
      client_name: row.clientName || "Unknown",
      bond_number: row.bondNumber
    }));
  }

  async getFinancialSummary(): Promise<any> {
    const [monthlyRevenueResult] = await db
      .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .where(and(
        eq(payments.status, 'completed'),
        sql`date_trunc('month', ${payments.createdAt}) = date_trunc('month', current_date)`
      ));
    
    const [outstandingResult] = await db
      .select({ total: sql<number>`coalesce(sum(${bonds.premiumAmount}), 0)` })
      .from(bonds)
      .where(eq(bonds.paymentStatus, 'pending'));
    
    const [totalPaymentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments);
    
    const [completedPaymentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(eq(payments.status, 'completed'));
    
    const collectionRate = totalPaymentsResult?.count > 0 
      ? (Number(completedPaymentsResult?.count || 0) / Number(totalPaymentsResult?.count || 1) * 100)
      : 0;
    
    return {
      monthlyRevenue: Number(monthlyRevenueResult?.total || 0),
      outstanding: Number(outstandingResult?.total || 0),
      collectionRate: Math.round(collectionRate * 10) / 10
    };
  }

  // Client Portal Authentication
  async getClientByPortalUsername(username: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.portalUsername, username));
    return client || undefined;
  }

  async enableClientPortal(clientId: string, username: string, password: string): Promise<Client> {
    // Hash password with bcrypt before storing
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const [updatedClient] = await db
      .update(clients)
      .set({ 
        portalUsername: username, 
        portalPassword: hashedPassword, 
        portalEnabled: true 
      })
      .where(eq(clients.id, clientId))
      .returning();
    if (!updatedClient) throw new Error("Client not found");
    return updatedClient;
  }

  async authenticateClient(username: string, password: string): Promise<Client | null> {
    // Get client by username first
    const [client] = await db
      .select()
      .from(clients)
      .where(and(
        eq(clients.portalUsername, username),
        eq(clients.portalEnabled, true)
      ));
    
    if (!client || !client.portalPassword) {
      return null;
    }
    
    // Use bcrypt to securely compare password
    const isPasswordValid = await bcrypt.compare(password, client.portalPassword);
    return isPasswordValid ? client : null;
  }

  async updateClientLastCheckin(clientId: string): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set({ lastCheckin: sql`now()` })
      .where(eq(clients.id, clientId))
      .returning();
    if (!updatedClient) throw new Error("Client not found");
    return updatedClient;
  }

  // Client Check-ins
  async getClientCheckin(id: string): Promise<ClientCheckin | undefined> {
    const [checkin] = await db.select().from(clientCheckins).where(eq(clientCheckins.id, id));
    return checkin || undefined;
  }

  async getClientCheckins(filter?: { clientId?: string; bondId?: string }): Promise<ClientCheckin[]> {
    const conditions = [];
    if (filter?.clientId) {
      conditions.push(eq(clientCheckins.clientId, filter.clientId));
    }
    if (filter?.bondId) {
      conditions.push(eq(clientCheckins.bondId, filter.bondId));
    }
    
    if (conditions.length > 0) {
      return db.select().from(clientCheckins).where(and(...conditions)).orderBy(desc(clientCheckins.createdAt));
    }
    
    return db.select().from(clientCheckins).orderBy(desc(clientCheckins.createdAt));
  }

  async createClientCheckin(checkin: InsertClientCheckin): Promise<ClientCheckin> {
    const [newCheckin] = await db.insert(clientCheckins).values(checkin).returning();
    return newCheckin;
  }

  async updateClientCheckin(id: string, checkin: Partial<ClientCheckin>): Promise<ClientCheckin> {
    const [updated] = await db.update(clientCheckins).set(checkin).where(eq(clientCheckins.id, id)).returning();
    if (!updated) throw new Error("Check-in not found");
    return updated;
  }

  // Client Portal Data
  async getClientBonds(clientId: string): Promise<Bond[]> {
    return db.select().from(bonds).where(eq(bonds.clientId, clientId)).orderBy(desc(bonds.createdAt));
  }

  async getClientCases(clientId: string): Promise<Case[]> {
    return db.select().from(cases).where(eq(cases.clientId, clientId)).orderBy(desc(cases.createdAt));
  }

  async getClientUpcomingCourtDates(clientId: string): Promise<any[]> {
    const result = await db
      .select({
        id: cases.id,
        caseNumber: cases.caseNumber,
        charges: cases.charges,
        arrestDate: cases.arrestDate,
        courtDate: cases.courtDate,
        courtLocation: cases.courtLocation,
        judgeName: cases.judgeName,
        prosecutorName: cases.prosecutorName,
        defenseAttorney: cases.defenseAttorney,
        status: cases.status,
        bondNumber: bonds.bondNumber,
        bondAmount: bonds.bondAmount
      })
      .from(cases)
      .leftJoin(bonds, eq(cases.id, bonds.caseId))
      .where(and(
        eq(cases.clientId, clientId),
        eq(cases.status, 'open'),
        sql`${cases.courtDate}::date >= current_date`
      ))
      .orderBy(sql`${cases.courtDate}::date`);
    
    return result.map(row => ({
      ...row,
      bond_number: row.bondNumber,
      bond_amount: row.bondAmount
    }));
  }

  // Contract Templates
  async getContractTemplate(id: string): Promise<ContractTemplate | undefined> {
    const [template] = await db.select().from(contractTemplates).where(eq(contractTemplates.id, id));
    return template || undefined;
  }

  async getContractTemplates(filter?: { type?: string; isActive?: boolean }): Promise<ContractTemplate[]> {
    const conditions = [];
    if (filter?.type) {
      conditions.push(eq(contractTemplates.type, filter.type));
    }
    if (filter?.isActive !== undefined) {
      conditions.push(eq(contractTemplates.isActive, filter.isActive));
    }
    
    if (conditions.length > 0) {
      return db.select().from(contractTemplates).where(and(...conditions)).orderBy(desc(contractTemplates.createdAt));
    }
    
    return db.select().from(contractTemplates).orderBy(desc(contractTemplates.createdAt));
  }

  async createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate> {
    const [newTemplate] = await db.insert(contractTemplates).values(template).returning();
    return newTemplate;
  }

  async updateContractTemplate(id: string, template: Partial<ContractTemplate>): Promise<ContractTemplate> {
    const [updated] = await db.update(contractTemplates).set(template).where(eq(contractTemplates.id, id)).returning();
    if (!updated) throw new Error("Contract template not found");
    return updated;
  }

  async deleteContractTemplate(id: string): Promise<boolean> {
    const result = await db.delete(contractTemplates).where(eq(contractTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Generated Contracts
  async getGeneratedContract(id: string): Promise<GeneratedContract | undefined> {
    const [contract] = await db.select().from(generatedContracts).where(eq(generatedContracts.id, id));
    return contract || undefined;
  }

  async getGeneratedContracts(filter?: { clientId?: string; templateId?: string; status?: string }): Promise<GeneratedContract[]> {
    const conditions = [];
    if (filter?.clientId) {
      conditions.push(eq(generatedContracts.clientId, filter.clientId));
    }
    if (filter?.templateId) {
      conditions.push(eq(generatedContracts.templateId, filter.templateId));
    }
    if (filter?.status) {
      conditions.push(eq(generatedContracts.status, filter.status));
    }
    
    if (conditions.length > 0) {
      return db.select().from(generatedContracts).where(and(...conditions)).orderBy(desc(generatedContracts.createdAt));
    }
    
    return db.select().from(generatedContracts).orderBy(desc(generatedContracts.createdAt));
  }

  async createGeneratedContract(contract: InsertGeneratedContract): Promise<GeneratedContract> {
    const [newContract] = await db.insert(generatedContracts).values(contract).returning();
    return newContract;
  }

  async updateGeneratedContract(id: string, contract: Partial<GeneratedContract>): Promise<GeneratedContract> {
    const [updated] = await db.update(generatedContracts).set(contract).where(eq(generatedContracts.id, id)).returning();
    if (!updated) throw new Error("Generated contract not found");
    return updated;
  }

  async deleteGeneratedContract(id: string): Promise<boolean> {
    const result = await db.delete(generatedContracts).where(eq(generatedContracts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Training Modules
  async getTrainingModule(id: string): Promise<TrainingModule | undefined> {
    const [module] = await db.select().from(trainingModules).where(eq(trainingModules.id, id));
    return module || undefined;
  }

  async getTrainingModules(filter?: { category?: string; isActive?: boolean; isRequired?: boolean }): Promise<TrainingModule[]> {
    const conditions = [];
    if (filter?.category) {
      conditions.push(eq(trainingModules.category, filter.category));
    }
    if (filter?.isActive !== undefined) {
      conditions.push(eq(trainingModules.isActive, filter.isActive));
    }
    if (filter?.isRequired !== undefined) {
      conditions.push(eq(trainingModules.isRequired, filter.isRequired));
    }
    
    if (conditions.length > 0) {
      return db.select().from(trainingModules).where(and(...conditions)).orderBy(desc(trainingModules.createdAt));
    }
    
    return db.select().from(trainingModules).orderBy(desc(trainingModules.createdAt));
  }

  async createTrainingModule(module: InsertTrainingModule): Promise<TrainingModule> {
    const [newModule] = await db.insert(trainingModules).values(module).returning();
    return newModule;
  }

  async updateTrainingModule(id: string, module: Partial<TrainingModule>): Promise<TrainingModule> {
    const [updated] = await db.update(trainingModules).set(module).where(eq(trainingModules.id, id)).returning();
    if (!updated) throw new Error("Training module not found");
    return updated;
  }

  async deleteTrainingModule(id: string): Promise<boolean> {
    const result = await db.delete(trainingModules).where(eq(trainingModules.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Training Progress
  async getTrainingProgress(userId: string, moduleId: string): Promise<TrainingProgress | undefined> {
    const [progress] = await db.select().from(trainingProgress).where(and(
      eq(trainingProgress.userId, userId),
      eq(trainingProgress.moduleId, moduleId)
    ));
    return progress || undefined;
  }

  async getUserTrainingProgress(userId: string): Promise<TrainingProgress[]> {
    return db.select().from(trainingProgress).where(eq(trainingProgress.userId, userId)).orderBy(desc(trainingProgress.lastAccessed));
  }

  async createTrainingProgress(progress: InsertTrainingProgress): Promise<TrainingProgress> {
    // Use upsert to handle unique constraint on (userId, moduleId)
    // Prevent regressions by using GREATEST for progress tracking
    const [newProgress] = await db.insert(trainingProgress)
      .values(progress)
      .onConflictDoUpdate({
        target: [trainingProgress.userId, trainingProgress.moduleId],
        set: {
          progress: sql`GREATEST(${trainingProgress.progress}, ${progress.progress})`,
          currentSection: sql`GREATEST(${trainingProgress.currentSection}, ${progress.currentSection})`,
          timeSpent: sql`${trainingProgress.timeSpent} + ${progress.timeSpent}`,
          isCompleted: sql`CASE WHEN GREATEST(${trainingProgress.progress}, ${progress.progress}) >= 100 THEN true ELSE ${progress.isCompleted} END`,
          completedAt: sql`CASE WHEN GREATEST(${trainingProgress.progress}, ${progress.progress}) >= 100 AND ${trainingProgress.completedAt} IS NULL THEN NOW() ELSE ${trainingProgress.completedAt} END`,
          lastAccessed: sql`NOW()`,
          updatedAt: sql`NOW()`,
        }
      })
      .returning();
    return newProgress;
  }

  async updateTrainingProgress(id: string, progress: Partial<TrainingProgress>): Promise<TrainingProgress> {
    const [updated] = await db.update(trainingProgress).set(progress).where(eq(trainingProgress.id, id)).returning();
    if (!updated) throw new Error("Training progress not found");
    return updated;
  }

  // Standard Operating Procedures
  async getSOP(id: string): Promise<StandardOperatingProcedure | undefined> {
    const [sop] = await db.select().from(standardOperatingProcedures).where(eq(standardOperatingProcedures.id, id));
    return sop || undefined;
  }

  async getSOPs(filter?: { category?: string; isActive?: boolean }): Promise<StandardOperatingProcedure[]> {
    const conditions = [];
    if (filter?.category) {
      conditions.push(eq(standardOperatingProcedures.category, filter.category));
    }
    if (filter?.isActive !== undefined) {
      conditions.push(eq(standardOperatingProcedures.isActive, filter.isActive));
    }
    
    if (conditions.length > 0) {
      return db.select().from(standardOperatingProcedures).where(and(...conditions)).orderBy(desc(standardOperatingProcedures.lastUpdated));
    }
    
    return db.select().from(standardOperatingProcedures).orderBy(desc(standardOperatingProcedures.lastUpdated));
  }

  async createSOP(sop: InsertSOP): Promise<StandardOperatingProcedure> {
    const [newSOP] = await db.insert(standardOperatingProcedures).values(sop).returning();
    return newSOP;
  }

  async updateSOP(id: string, sop: Partial<StandardOperatingProcedure>): Promise<StandardOperatingProcedure> {
    const [updated] = await db.update(standardOperatingProcedures).set(sop).where(eq(standardOperatingProcedures.id, id)).returning();
    if (!updated) throw new Error("SOP not found");
    return updated;
  }

  async deleteSOP(id: string): Promise<boolean> {
    const result = await db.delete(standardOperatingProcedures).where(eq(standardOperatingProcedures.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
