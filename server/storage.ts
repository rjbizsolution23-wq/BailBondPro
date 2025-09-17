import { 
  type User, type InsertUser,
  type Client, type InsertClient,
  type Case, type InsertCase,
  type Bond, type InsertBond,
  type Payment, type InsertPayment,
  type Document, type InsertDocument,
  type Activity, type InsertActivity
} from "@shared/schema";
import { gibsonApi } from "./services/gibsonApi";
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
  getDocuments(filter?: { category?: string; relatedId?: string }): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<Document>): Promise<Document>;
  deleteDocument(id: string): Promise<boolean>;

  // Activities
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Dashboard & Analytics
  getDashboardStats(): Promise<any>;
  getRecentActivity(limit?: number): Promise<any[]>;
  getUpcomingCourtDates(limit?: number): Promise<any[]>;
  getFinancialSummary(): Promise<any>;
}

export class GibsonApiStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await gibsonApi.read("users", `id = '${id}'`);
    return result.data?.[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await gibsonApi.read("users", `username = '${username}'`);
    return result.data?.[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const userData = { ...user, id: randomUUID() };
    const result = await gibsonApi.create("users", userData);
    if (result.error) throw new Error(result.error);
    return result.data;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const result = await gibsonApi.update("users", id, user);
    if (result.error) throw new Error(result.error);
    return result.data;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await gibsonApi.delete("users", id);
    if (result.error) throw new Error(result.error);
    return result.data || false;
  }

  // Clients
  async getClient(id: string): Promise<Client | undefined> {
    const result = await gibsonApi.read("clients", `id = '${id}'`);
    return result.data?.[0];
  }

  async getClients(filter?: { status?: string; search?: string }): Promise<Client[]> {
    let where = "";
    if (filter?.status) where += `status = '${filter.status}'`;
    if (filter?.search) {
      if (where) where += " AND ";
      where += `(first_name ILIKE '%${filter.search}%' OR last_name ILIKE '%${filter.search}%' OR phone ILIKE '%${filter.search}%' OR email ILIKE '%${filter.search}%')`;
    }

    const result = await gibsonApi.read("clients", where, "created_at DESC");
    return result.data || [];
  }

  async getClientsWithBonds(): Promise<any[]> {
    const result = await gibsonApi.getClientsWithBonds();
    return result.data || [];
  }

  async createClient(client: InsertClient): Promise<Client> {
    const clientData = { ...client, id: randomUUID() };
    const result = await gibsonApi.create("clients", clientData);
    if (result.error) throw new Error(result.error);
    return result.data;
  }

  async updateClient(id: string, client: Partial<Client>): Promise<Client> {
    const result = await gibsonApi.update("clients", id, client);
    if (result.error) throw new Error(result.error);
    return result.data;
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await gibsonApi.delete("clients", id);
    if (result.error) throw new Error(result.error);
    return result.data || false;
  }

  // Cases
  async getCase(id: string): Promise<Case | undefined> {
    const result = await gibsonApi.read("cases", `id = '${id}'`);
    return result.data?.[0];
  }

  async getCases(filter?: { clientId?: string; status?: string }): Promise<Case[]> {
    let where = "";
    if (filter?.clientId) where += `client_id = '${filter.clientId}'`;
    if (filter?.status) {
      if (where) where += " AND ";
      where += `status = '${filter.status}'`;
    }

    const result = await gibsonApi.read("cases", where, "created_at DESC");
    return result.data || [];
  }

  async createCase(case_: InsertCase): Promise<Case> {
    const caseData = { ...case_, id: randomUUID() };
    const result = await gibsonApi.create("cases", caseData);
    if (result.error) throw new Error(result.error);
    return result.data;
  }

  async updateCase(id: string, case_: Partial<Case>): Promise<Case> {
    const result = await gibsonApi.update("cases", id, case_);
    if (result.error) throw new Error(result.error);
    return result.data;
  }

  async deleteCase(id: string): Promise<boolean> {
    const result = await gibsonApi.delete("cases", id);
    if (result.error) throw new Error(result.error);
    return result.data || false;
  }

  // Bonds
  async getBond(id: string): Promise<Bond | undefined> {
    const result = await gibsonApi.read("bonds", `id = '${id}'`);
    return result.data?.[0];
  }

  async getBonds(filter?: { clientId?: string; status?: string }): Promise<Bond[]> {
    let where = "";
    if (filter?.clientId) where += `client_id = '${filter.clientId}'`;
    if (filter?.status) {
      if (where) where += " AND ";
      where += `status = '${filter.status}'`;
    }

    const result = await gibsonApi.read("bonds", where, "created_at DESC");
    return result.data || [];
  }

  async getBondsWithDetails(): Promise<any[]> {
    const result = await gibsonApi.getBondsWithDetails();
    return result.data || [];
  }

  async createBond(bond: InsertBond): Promise<Bond> {
    const bondData = { ...bond, id: randomUUID() };
    const result = await gibsonApi.create("bonds", bondData);
    if (result.error) throw new Error(result.error);
    return result.data;
  }

  async updateBond(id: string, bond: Partial<Bond>): Promise<Bond> {
    const result = await gibsonApi.update("bonds", id, bond);
    if (result.error) throw new Error(result.error);
    return result.data;
  }

  async deleteBond(id: string): Promise<boolean> {
    const result = await gibsonApi.delete("bonds", id);
    if (result.error) throw new Error(result.error);
    return result.data || false;
  }

  // Payments
  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await gibsonApi.read("payments", `id = '${id}'`);
    return result.data?.[0];
  }

  async getPayments(filter?: { bondId?: string; clientId?: string }): Promise<Payment[]> {
    let where = "";
    if (filter?.bondId) where += `bond_id = '${filter.bondId}'`;
    if (filter?.clientId) {
      if (where) where += " AND ";
      where += `client_id = '${filter.clientId}'`;
    }

    const result = await gibsonApi.read("payments", where, "created_at DESC");
    return result.data || [];
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const paymentData = { ...payment, id: randomUUID() };
    const result = await gibsonApi.create("payments", paymentData);
    if (result.error) throw new Error(result.error);
    return result.data;
  }

  async updatePayment(id: string, payment: Partial<Payment>): Promise<Payment> {
    const result = await gibsonApi.update("payments", id, payment);
    if (result.error) throw new Error(result.error);
    return result.data;
  }

  async deletePayment(id: string): Promise<boolean> {
    const result = await gibsonApi.delete("payments", id);
    if (result.error) throw new Error(result.error);
    return result.data || false;
  }

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    const result = await gibsonApi.read("documents", `id = '${id}'`);
    return result.data?.[0];
  }

  async getDocuments(filter?: { category?: string; relatedId?: string }): Promise<Document[]> {
    let where = "";
    if (filter?.category) where += `category = '${filter.category}'`;
    if (filter?.relatedId) {
      if (where) where += " AND ";
      where += `related_id = '${filter.relatedId}'`;
    }

    const result = await gibsonApi.read("documents", where, "created_at DESC");
    return result.data || [];
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const documentData = { ...document, id: randomUUID() };
    const result = await gibsonApi.create("documents", documentData);
    if (result.error) throw new Error(result.error);
    return result.data;
  }

  async updateDocument(id: string, document: Partial<Document>): Promise<Document> {
    const result = await gibsonApi.update("documents", id, document);
    if (result.error) throw new Error(result.error);
    return result.data;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await gibsonApi.delete("documents", id);
    if (result.error) throw new Error(result.error);
    return result.data || false;
  }

  // Activities
  async getActivities(limit: number = 50): Promise<Activity[]> {
    const result = await gibsonApi.read("activities", undefined, "created_at DESC", limit);
    return result.data || [];
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const activityData = { ...activity, id: randomUUID() };
    const result = await gibsonApi.create("activities", activityData);
    if (result.error) throw new Error(result.error);
    return result.data;
  }

  // Dashboard & Analytics
  async getDashboardStats(): Promise<any> {
    const result = await gibsonApi.getDashboardStats();
    if (result.error) throw new Error(result.error);
    return result.data;
  }

  async getRecentActivity(limit: number = 10): Promise<any[]> {
    const result = await gibsonApi.getRecentActivity(limit);
    return result.data || [];
  }

  async getUpcomingCourtDates(limit: number = 10): Promise<any[]> {
    const result = await gibsonApi.getUpcomingCourtDates(limit);
    return result.data || [];
  }

  async getFinancialSummary(): Promise<any> {
    const result = await gibsonApi.getFinancialSummary();
    if (result.error) throw new Error(result.error);
    return result.data;
  }
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private clients: Map<string, Client> = new Map();
  private cases: Map<string, Case> = new Map();
  private bonds: Map<string, Bond> = new Map();
  private payments: Map<string, Payment> = new Map();
  private documents: Map<string, Document> = new Map();
  private activities: Map<string, Activity> = new Map();

  constructor() {
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample user
    const sampleUser: User = {
      id: "user-1",
      username: "john.smith", 
      email: "john.smith@bailbondpro.com",
      password: "hashed_password",
      firstName: "John",
      lastName: "Smith",
      role: "agent",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(sampleUser.id, sampleUser);

    // Sample clients
    const sampleClients: Client[] = [
      {
        id: "client-1",
        firstName: "Michael",
        lastName: "Johnson",
        dateOfBirth: "1990-05-15",
        phone: "555-0101",
        email: "michael.johnson@email.com",
        address: "456 Oak Avenue",
        city: "Springfield",
        state: "IL",
        zipCode: "62701",
        emergencyContact: "Mary Johnson",
        emergencyPhone: "555-0102",
        status: "active",
        notes: "Reliable client",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "client-2", 
        firstName: "Jessica",
        lastName: "Williams",
        dateOfBirth: "1985-08-22",
        phone: "555-0201",
        email: "jessica.williams@email.com",
        address: "789 Pine Street",
        city: "Springfield",
        state: "IL", 
        zipCode: "62702",
        status: "active",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    
    sampleClients.forEach(client => this.clients.set(client.id, client));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) throw new Error("User not found");
    
    const updated: User = { ...existing, ...user, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Clients
  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClients(filter?: { status?: string; search?: string }): Promise<Client[]> {
    let clients = Array.from(this.clients.values());
    
    if (filter?.status) {
      clients = clients.filter(client => client.status === filter.status);
    }
    
    if (filter?.search) {
      const search = filter.search.toLowerCase();
      clients = clients.filter(client => 
        client.firstName.toLowerCase().includes(search) ||
        client.lastName.toLowerCase().includes(search) ||
        client.phone.includes(search) ||
        client.email?.toLowerCase().includes(search)
      );
    }
    
    return clients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getClientsWithBonds(): Promise<any[]> {
    const clients = Array.from(this.clients.values());
    return clients.map(client => ({
      ...client,
      total_bonds: Array.from(this.bonds.values()).filter(bond => bond.clientId === client.id).length,
      last_bond_date: null // Simplified for now
    }));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const newClient: Client = {
      ...client,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.clients.set(newClient.id, newClient);
    return newClient;
  }

  async updateClient(id: string, client: Partial<Client>): Promise<Client> {
    const existing = this.clients.get(id);
    if (!existing) throw new Error("Client not found");
    
    const updated: Client = { ...existing, ...client, updatedAt: new Date() };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Cases
  async getCase(id: string): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async getCases(filter?: { clientId?: string; status?: string }): Promise<Case[]> {
    let cases = Array.from(this.cases.values());
    
    if (filter?.clientId) {
      cases = cases.filter(case_ => case_.clientId === filter.clientId);
    }
    
    if (filter?.status) {
      cases = cases.filter(case_ => case_.status === filter.status);
    }
    
    return cases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createCase(case_: InsertCase): Promise<Case> {
    const newCase: Case = {
      ...case_,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cases.set(newCase.id, newCase);
    return newCase;
  }

  async updateCase(id: string, case_: Partial<Case>): Promise<Case> {
    const existing = this.cases.get(id);
    if (!existing) throw new Error("Case not found");
    
    const updated: Case = { ...existing, ...case_, updatedAt: new Date() };
    this.cases.set(id, updated);
    return updated;
  }

  async deleteCase(id: string): Promise<boolean> {
    return this.cases.delete(id);
  }

  // Bonds  
  async getBond(id: string): Promise<Bond | undefined> {
    return this.bonds.get(id);
  }

  async getBonds(filter?: { clientId?: string; status?: string }): Promise<Bond[]> {
    let bonds = Array.from(this.bonds.values());
    
    if (filter?.clientId) {
      bonds = bonds.filter(bond => bond.clientId === filter.clientId);
    }
    
    if (filter?.status) {
      bonds = bonds.filter(bond => bond.status === filter.status);
    }
    
    return bonds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getBondsWithDetails(): Promise<any[]> {
    const bonds = Array.from(this.bonds.values());
    return bonds.map(bond => {
      const client = this.clients.get(bond.clientId);
      const case_ = this.cases.get(bond.caseId);
      const agent = this.users.get(bond.agentId);
      
      return {
        ...bond,
        client_name: client ? `${client.firstName} ${client.lastName}` : "Unknown",
        client_phone: client?.phone || "",
        court_date: case_?.courtDate || null,
        agent_name: agent ? `${agent.firstName} ${agent.lastName}` : "Unknown"
      };
    });
  }

  async createBond(bond: InsertBond): Promise<Bond> {
    const newBond: Bond = {
      ...bond,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bonds.set(newBond.id, newBond);
    return newBond;
  }

  async updateBond(id: string, bond: Partial<Bond>): Promise<Bond> {
    const existing = this.bonds.get(id);
    if (!existing) throw new Error("Bond not found");
    
    const updated: Bond = { ...existing, ...bond, updatedAt: new Date() };
    this.bonds.set(id, updated);
    return updated;
  }

  async deleteBond(id: string): Promise<boolean> {
    return this.bonds.delete(id);
  }

  // Payments
  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPayments(filter?: { bondId?: string; clientId?: string }): Promise<Payment[]> {
    let payments = Array.from(this.payments.values());
    
    if (filter?.bondId) {
      payments = payments.filter(payment => payment.bondId === filter.bondId);
    }
    
    if (filter?.clientId) {
      payments = payments.filter(payment => payment.clientId === filter.clientId);
    }
    
    return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const newPayment: Payment = {
      ...payment,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.payments.set(newPayment.id, newPayment);
    return newPayment;
  }

  async updatePayment(id: string, payment: Partial<Payment>): Promise<Payment> {
    const existing = this.payments.get(id);
    if (!existing) throw new Error("Payment not found");
    
    const updated: Payment = { ...existing, ...payment, updatedAt: new Date() };
    this.payments.set(id, updated);
    return updated;
  }

  async deletePayment(id: string): Promise<boolean> {
    return this.payments.delete(id);
  }

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocuments(filter?: { category?: string; relatedId?: string }): Promise<Document[]> {
    let documents = Array.from(this.documents.values());
    
    if (filter?.category) {
      documents = documents.filter(doc => doc.category === filter.category);
    }
    
    if (filter?.relatedId) {
      documents = documents.filter(doc => doc.relatedId === filter.relatedId);
    }
    
    return documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const newDocument: Document = {
      ...document,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.documents.set(newDocument.id, newDocument);
    return newDocument;
  }

  async updateDocument(id: string, document: Partial<Document>): Promise<Document> {
    const existing = this.documents.get(id);
    if (!existing) throw new Error("Document not found");
    
    const updated: Document = { ...existing, ...document, updatedAt: new Date() };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Activities
  async getActivities(limit: number = 50): Promise<Activity[]> {
    const activities = Array.from(this.activities.values());
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const newActivity: Activity = {
      ...activity,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.activities.set(newActivity.id, newActivity);
    return newActivity;
  }

  // Dashboard & Analytics
  async getDashboardStats(): Promise<any> {
    const activeBonds = Array.from(this.bonds.values()).filter(bond => bond.status === 'active').length;
    const totalRevenue = Array.from(this.payments.values())
      .filter(payment => payment.status === 'completed')
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const pendingPayments = Array.from(this.bonds.values())
      .filter(bond => ['pending', 'partial'].includes(bond.paymentStatus))
      .reduce((sum, bond) => sum + parseFloat(bond.premiumAmount), 0);
    
    return {
      activeBonds,
      totalRevenue,
      pendingPayments, 
      upcomingCourtDates: 0, // Simplified
    };
  }

  async getRecentActivity(limit: number = 10): Promise<any[]> {
    return []; // Simplified for now
  }

  async getUpcomingCourtDates(limit: number = 10): Promise<any[]> {
    return []; // Simplified for now
  }

  async getFinancialSummary(): Promise<any> {
    return {
      monthlyRevenue: 0,
      outstanding: 0,
      collectionRate: 0,
    };
  }
}

export const storage = new MemStorage();
