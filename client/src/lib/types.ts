export interface DashboardStats {
  activeBonds: number;
  totalRevenue: number;
  pendingPayments: number;
  upcomingCourtDates: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: any;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

export interface CourtDate {
  id: string;
  caseNumber: string;
  courtDate: string;
  courtLocation: string;
  firstName: string;
  lastName: string;
}

export interface ClientWithBonds {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  status: string;
  totalBonds: number;
  lastBondDate?: string;
  createdAt: string;
}

export interface BondWithDetails {
  id: string;
  bondNumber: string;
  clientName: string;
  clientPhone: string;
  bondAmount: number;
  premiumAmount: number;
  status: string;
  paymentStatus: string;
  courtDate?: string;
  agentName: string;
  createdAt: string;
}

export interface FinancialSummary {
  monthlyRevenue: number;
  outstanding: number;
  collectionRate: number;
}
