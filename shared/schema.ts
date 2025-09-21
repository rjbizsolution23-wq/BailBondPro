import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("agent"), // admin, agent, staff
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  status: text("status").notNull().default("active"), // active, inactive, high_risk
  notes: text("notes"),
  // Client portal authentication fields
  portalUsername: text("portal_username").unique(),
  portalPassword: text("portal_password"),
  portalEnabled: boolean("portal_enabled").notNull().default(false),
  lastCheckin: timestamp("last_checkin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseNumber: text("case_number").notNull().unique(),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  charges: text("charges").notNull(),
  arrestDate: text("arrest_date").notNull(),
  courtDate: text("court_date"),
  courtLocation: text("court_location"),
  judgeName: text("judge_name"),
  prosecutorName: text("prosecutor_name"),
  defenseAttorney: text("defense_attorney"),
  status: text("status").notNull().default("open"), // open, closed, dismissed
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bonds = pgTable("bonds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bondNumber: text("bond_number").notNull().unique(),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  bondAmount: decimal("bond_amount", { precision: 10, scale: 2 }).notNull(),
  premiumAmount: decimal("premium_amount", { precision: 10, scale: 2 }).notNull(),
  premiumRate: decimal("premium_rate", { precision: 5, scale: 4 }).notNull(),
  collateralAmount: decimal("collateral_amount", { precision: 10, scale: 2 }),
  collateralDescription: text("collateral_description"),
  status: text("status").notNull().default("active"), // active, completed, forfeited, at_risk
  issueDate: text("issue_date").notNull(),
  exonerationDate: text("exoneration_date"),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, partial, paid_full, overdue
  agentId: varchar("agent_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: text("transaction_id").notNull().unique(),
  bondId: varchar("bond_id").notNull().references(() => bonds.id),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentType: text("payment_type").notNull(), // premium, collateral_return, fee
  paymentMethod: text("payment_method").notNull(), // cash, check, credit_card, bank_transfer
  status: text("status").notNull().default("completed"), // pending, completed, failed, refunded
  paymentDate: text("payment_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  category: text("category").notNull(), // contract, court_papers, identification, financial
  relatedId: varchar("related_id"), // client, bond, or case ID
  relatedType: text("related_type"), // client, bond, case
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: varchar("resource_id").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const clientCheckins = pgTable("client_checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  bondId: varchar("bond_id").notNull().references(() => bonds.id),
  photoUrl: text("photo_url"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  locationName: text("location_name"),
  notes: text("notes"),
  status: text("status").notNull().default("completed"), // completed, failed, pending_review
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contractTemplates = pgTable("contract_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEs: text("name_es").notNull(),
  type: text("type").notNull(), // bail-agreement, indemnity, collateral, payment-plan, power-of-attorney
  description: text("description").notNull(),
  descriptionEs: text("description_es").notNull(),
  content: text("content").notNull(),
  contentEs: text("content_es").notNull(),
  variables: jsonb("variables").notNull().default('[]'), // Array of variable names like {{CLIENT_NAME}}
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const generatedContracts = pgTable("generated_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => contractTemplates.id),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  caseId: varchar("case_id").references(() => cases.id),
  bondId: varchar("bond_id").references(() => bonds.id),
  content: text("content").notNull(),
  variables: jsonb("variables").notNull().default('{}'), // Key-value pairs of replaced variables
  status: text("status").notNull().default("draft"), // draft, sent, signed, executed
  generatedBy: varchar("generated_by").notNull().references(() => users.id),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const trainingModules = pgTable("training_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleEs: text("title_es").notNull(),
  description: text("description").notNull(),
  descriptionEs: text("description_es").notNull(),
  category: text("category").notNull(), // legal-compliance, system-usage, client-service, risk-management, operations
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  duration: integer("duration").notNull(), // in minutes
  isRequired: boolean("is_required").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  content: jsonb("content").notNull().default('[]'), // Array of training sections
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const trainingProgress = pgTable("training_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  moduleId: varchar("module_id").notNull().references(() => trainingModules.id),
  progress: integer("progress").notNull().default(0), // 0-100
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  currentSection: integer("current_section").notNull().default(0),
  timeSpent: integer("time_spent").notNull().default(0), // in minutes
  lastAccessed: timestamp("last_accessed").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const standardOperatingProcedures = pgTable("standard_operating_procedures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleEs: text("title_es").notNull(),
  category: text("category").notNull(), // client-onboarding, bond-processing, payment-handling, legal-compliance, emergency-procedures
  description: text("description").notNull(),
  descriptionEs: text("description_es").notNull(),
  content: text("content").notNull(),
  contentEs: text("content_es").notNull(),
  steps: jsonb("steps").notNull().default('[]'), // Array of SOP steps with details
  version: text("version").notNull().default("1.0"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBondSchema = createInsertSchema(bonds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  bondAmount: z.union([z.string(), z.number()]).transform(val => String(val)),
  premiumAmount: z.union([z.string(), z.number()]).transform(val => String(val)),
  premiumRate: z.union([z.string(), z.number()]).transform(val => String(val)),
  collateralAmount: z.union([z.string(), z.number(), z.null()]).transform(val => val === null ? null : String(val)).optional(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertClientCheckinSchema = createInsertSchema(clientCheckins).omit({
  id: true,
  createdAt: true,
}).extend({
  latitude: z.union([z.string(), z.number(), z.null()]).transform(val => val === null ? null : String(val)).optional(),
  longitude: z.union([z.string(), z.number(), z.null()]).transform(val => val === null ? null : String(val)).optional(),
});

export const insertContractTemplateSchema = createInsertSchema(contractTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeneratedContractSchema = createInsertSchema(generatedContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingModuleSchema = createInsertSchema(trainingModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingProgressSchema = createInsertSchema(trainingProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSOPSchema = createInsertSchema(standardOperatingProcedures).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Case = typeof cases.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;

export type Bond = typeof bonds.$inferSelect;
export type InsertBond = z.infer<typeof insertBondSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type ClientCheckin = typeof clientCheckins.$inferSelect;
export type InsertClientCheckin = z.infer<typeof insertClientCheckinSchema>;

export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;

export type GeneratedContract = typeof generatedContracts.$inferSelect;
export type InsertGeneratedContract = z.infer<typeof insertGeneratedContractSchema>;

export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;

export type TrainingProgress = typeof trainingProgress.$inferSelect;
export type InsertTrainingProgress = z.infer<typeof insertTrainingProgressSchema>;

export type StandardOperatingProcedure = typeof standardOperatingProcedures.$inferSelect;
export type InsertSOP = z.infer<typeof insertSOPSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bonds: many(bonds),
  documents: many(documents),
  activities: many(activities),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  cases: many(cases),
  bonds: many(bonds),
  payments: many(payments),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  client: one(clients, { fields: [cases.clientId], references: [clients.id] }),
  bonds: many(bonds),
}));

export const bondsRelations = relations(bonds, ({ one, many }) => ({
  client: one(clients, { fields: [bonds.clientId], references: [clients.id] }),
  case: one(cases, { fields: [bonds.caseId], references: [cases.id] }),
  agent: one(users, { fields: [bonds.agentId], references: [users.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  bond: one(bonds, { fields: [payments.bondId], references: [bonds.id] }),
  client: one(clients, { fields: [payments.clientId], references: [clients.id] }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  uploadedByUser: one(users, { fields: [documents.uploadedBy], references: [users.id] }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
}));

export const clientCheckinsRelations = relations(clientCheckins, ({ one }) => ({
  client: one(clients, { fields: [clientCheckins.clientId], references: [clients.id] }),
  bond: one(bonds, { fields: [clientCheckins.bondId], references: [bonds.id] }),
}));
