const GIBSON_API_BASE = "https://api.gibsonai.com";
const API_KEY = process.env.GIBSON_API_KEY || process.env.X_GIBSON_API_KEY;

interface GibsonApiResponse<T = any> {
  data?: T;
  error?: string;
}

class GibsonApiService {
  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
    body?: any
  ): Promise<GibsonApiResponse<T>> {
    if (!API_KEY) {
      return { error: "Gibson API key not configured. Set GIBSON_API_KEY environment variable." };
    }

    try {
      const response = await fetch(`${GIBSON_API_BASE}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Gibson-API-Key": API_KEY,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { error: `Gibson API Error (${response.status}): ${errorText}` };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Query endpoint for custom SQL queries
  async query(sql: string): Promise<GibsonApiResponse<any[]>> {
    return this.makeRequest("/v1/-/query", "POST", { query: sql });
  }

  // Generic CRUD operations for any table
  async create(table: string, data: Record<string, any>): Promise<GibsonApiResponse<any>> {
    const columns = Object.keys(data).join(", ");
    const values = Object.values(data).map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v).join(", ");
    
    // Insert without RETURNING clause (not supported by Gibson API)
    const insertSql = `INSERT INTO ${table} (${columns}) VALUES (${values})`;
    const insertResult = await this.query(insertSql);
    if (insertResult.error) return insertResult;
    
    // Try to retrieve the inserted record by ID if available
    if (data.id) {
      const selectSql = `SELECT * FROM ${table} WHERE id = '${data.id}' LIMIT 1`;
      const selectResult = await this.query(selectSql);
      if (selectResult.error) {
        // If we can't retrieve, return the data that was sent
        return { data: data };
      }
      return { data: selectResult.data?.[0] || data };
    }
    
    // Return the data that was sent if no ID available
    return { data: data };
  }

  async read(table: string, where?: string, orderBy?: string, limit?: number): Promise<GibsonApiResponse<any[]>> {
    let sql = `SELECT * FROM ${table}`;
    if (where) sql += ` WHERE ${where}`;
    if (orderBy) sql += ` ORDER BY ${orderBy}`;
    if (limit) sql += ` LIMIT ${limit}`;
    
    return this.query(sql);
  }

  async update(table: string, id: string, data: Record<string, any>): Promise<GibsonApiResponse<any>> {
    const sets = Object.entries(data)
      .map(([key, value]) => `${key} = ${typeof value === 'string' ? `'${value}'` : value}`)
      .join(", ");
    
    const sql = `UPDATE ${table} SET ${sets} WHERE id = '${id}' RETURNING *`;
    
    const result = await this.query(sql);
    if (result.error) return result;
    
    return { data: result.data?.[0] };
  }

  async delete(table: string, id: string): Promise<GibsonApiResponse<boolean>> {
    const sql = `DELETE FROM ${table} WHERE id = '${id}'`;
    
    const result = await this.query(sql);
    if (result.error) return { error: result.error };
    
    return { data: true };
  }

  // Specific business logic methods
  async getDashboardStats(): Promise<GibsonApiResponse<any>> {
    const queries = [
      "SELECT COUNT(*) as active_bonds FROM bonds WHERE status = 'active'",
      "SELECT COALESCE(SUM(amount), 0) as total_revenue FROM payments WHERE status = 'completed'",
      "SELECT COALESCE(SUM(premium_amount), 0) as pending_payments FROM bonds WHERE payment_status IN ('pending', 'partial')",
      "SELECT COUNT(*) as upcoming_court_dates FROM cases WHERE court_date >= CURRENT_DATE AND court_date <= CURRENT_DATE + INTERVAL '30 days'"
    ];

    const results = await Promise.all(queries.map(q => this.query(q)));
    
    if (results.some(r => r.error)) {
      return { error: "Failed to fetch dashboard statistics" };
    }

    return {
      data: {
        activeBonds: results[0].data?.[0]?.active_bonds || 0,
        totalRevenue: results[1].data?.[0]?.total_revenue || 0,
        pendingPayments: results[2].data?.[0]?.pending_payments || 0,
        upcomingCourtDates: results[3].data?.[0]?.upcoming_court_dates || 0,
      }
    };
  }

  async getRecentActivity(limit: number = 10): Promise<GibsonApiResponse<any[]>> {
    const sql = `
      SELECT a.*, u.first_name, u.last_name 
      FROM activities a 
      JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC 
      LIMIT ${limit}
    `;
    return this.query(sql);
  }

  async getUpcomingCourtDates(limit: number = 10): Promise<GibsonApiResponse<any[]>> {
    const sql = `
      SELECT c.*, cl.first_name, cl.last_name 
      FROM cases c 
      JOIN clients cl ON c.client_id = cl.id 
      WHERE c.court_date >= CURRENT_DATE 
      ORDER BY c.court_date ASC 
      LIMIT ${limit}
    `;
    return this.query(sql);
  }

  async getClientsWithBonds(): Promise<GibsonApiResponse<any[]>> {
    const sql = `
      SELECT 
        c.*,
        COUNT(b.id) as total_bonds,
        MAX(b.created_at) as last_bond_date
      FROM clients c
      LEFT JOIN bonds b ON c.id = b.client_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    return this.query(sql);
  }

  async getBondsWithDetails(): Promise<GibsonApiResponse<any[]>> {
    const sql = `
      SELECT 
        b.*,
        c.first_name || ' ' || c.last_name as client_name,
        c.phone as client_phone,
        cs.court_date,
        u.first_name || ' ' || u.last_name as agent_name
      FROM bonds b
      JOIN clients c ON b.client_id = c.id
      JOIN cases cs ON b.case_id = cs.id
      JOIN users u ON b.agent_id = u.id
      ORDER BY b.created_at DESC
    `;
    return this.query(sql);
  }

  async getFinancialSummary(): Promise<GibsonApiResponse<any>> {
    const queries = [
      `SELECT 
        COALESCE(SUM(CASE WHEN DATE_PART('month', created_at) = DATE_PART('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as monthly_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as outstanding,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
        COUNT(*) as total_payments
      FROM payments`,
    ];

    const result = await this.query(queries[0]);
    if (result.error) return result;

    const data = result.data?.[0] || {};
    const collectionRate = data.total_payments > 0 
      ? (data.completed_payments / data.total_payments * 100).toFixed(1)
      : "0.0";

    return {
      data: {
        monthlyRevenue: data.monthly_revenue || 0,
        outstanding: data.outstanding || 0,
        collectionRate: parseFloat(collectionRate),
      }
    };
  }

  // Database initialization - create all required tables
  async initializeDatabase(): Promise<GibsonApiResponse<any>> {
    console.log("Initializing database schema...");
    
    const createTablesSQL = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY DEFAULT (SUBSTRING(UUID(), 1, 36)),
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'agent',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Clients table
      `CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(255) PRIMARY KEY DEFAULT (SUBSTRING(UUID(), 1, 36)),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zip_code TEXT NOT NULL,
        emergency_contact TEXT,
        emergency_phone TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      // Cases table
      `CREATE TABLE IF NOT EXISTS cases (
        id VARCHAR(255) PRIMARY KEY DEFAULT (SUBSTRING(UUID(), 1, 36)),
        case_number TEXT NOT NULL UNIQUE,
        client_id VARCHAR(255) NOT NULL,
        charges TEXT NOT NULL,
        arrest_date TEXT NOT NULL,
        court_date TEXT,
        court_location TEXT,
        judge_name TEXT,
        prosecutor_name TEXT,
        defense_attorney TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      // Bonds table  
      `CREATE TABLE IF NOT EXISTS bonds (
        id VARCHAR(255) PRIMARY KEY DEFAULT (SUBSTRING(UUID(), 1, 36)),
        bond_number TEXT NOT NULL UNIQUE,
        client_id VARCHAR(255) NOT NULL,
        case_id VARCHAR(255) NOT NULL,
        bond_amount DECIMAL(10, 2) NOT NULL,
        premium_amount DECIMAL(10, 2) NOT NULL,
        premium_rate DECIMAL(5, 4) NOT NULL,
        collateral_amount DECIMAL(10, 2),
        collateral_description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        issue_date TEXT NOT NULL,
        exoneration_date TEXT,
        payment_status TEXT NOT NULL DEFAULT 'pending',
        agent_id VARCHAR(255) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      // Payments table
      `CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(255) PRIMARY KEY DEFAULT (SUBSTRING(UUID(), 1, 36)),
        transaction_id TEXT NOT NULL UNIQUE,
        bond_id VARCHAR(255) NOT NULL,
        client_id VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_type TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        payment_date TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      // Documents table
      `CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(255) PRIMARY KEY DEFAULT (SUBSTRING(UUID(), 1, 36)),
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        category TEXT NOT NULL,
        related_id VARCHAR(255),
        related_type TEXT,
        uploaded_by VARCHAR(255) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      // Activities table
      `CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR(255) PRIMARY KEY DEFAULT (SUBSTRING(UUID(), 1, 36)),
        user_id VARCHAR(255) NOT NULL,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    try {
      for (const sql of createTablesSQL) {
        const result = await this.query(sql);
        if (result.error) {
          console.error("Failed to create table:", result.error);
          return result;
        }
      }
      console.log("Database schema initialized successfully");
      return { data: { message: "Database schema initialized successfully" } };
    } catch (error) {
      console.error("Database initialization error:", error);
      return { error: `Database initialization failed: ${error}` };
    }
  }
}

export const gibsonApi = new GibsonApiService();
