import { 
  type User, type InsertUser,
  type Client, type InsertClient,
  type Case, type InsertCase,
  type Bond, type InsertBond,
  type Payment, type InsertPayment,
  type Document, type InsertDocument,
  type Activity, type InsertActivity,
  users, clients, cases, bonds, payments, documents, activities
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
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
}


// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
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
}

export const storage = new DatabaseStorage();
