import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { api } from "@/lib/api";

export default function Reports() {
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: api.getDashboardStats,
  });

  const { data: financialSummary, isLoading: financialLoading } = useQuery({
    queryKey: ["/api/financial/summary"],
    queryFn: api.getFinancialSummary,
  });

  const { data: bonds = [] } = useQuery({
    queryKey: ["/api/bonds"],
    queryFn: () => api.getBonds(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => api.getClients(),
  });

  // Calculate performance metrics
  const performanceMetrics = {
    bondsCreated: bonds.length,
    revenue: financialSummary?.monthlyRevenue || 0,
    successRate: bonds.length > 0 ? ((bonds.filter((b: any) => b.status === 'completed').length / bonds.length) * 100).toFixed(1) : '0.0',
  };

  // Calculate client analytics
  const clientAnalytics = {
    newClients: clients.filter((c: any) => {
      const createdDate = new Date(c.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate > thirtyDaysAgo;
    }).length,
    repeatClients: 8, // This would need to be calculated based on multiple bonds per client
    retention: financialSummary?.collectionRate || 0,
  };

  // Prepare bond status distribution data for pie chart
  const bondStatusData = [
    { name: 'Active', value: bonds.filter((b: any) => b.status === 'active').length, color: '#3B82F6' },
    { name: 'Completed', value: bonds.filter((b: any) => b.status === 'completed').length, color: '#10B981' },
    { name: 'At Risk', value: bonds.filter((b: any) => b.status === 'at_risk').length, color: '#F59E0B' },
    { name: 'Forfeited', value: bonds.filter((b: any) => b.status === 'forfeited').length, color: '#EF4444' },
  ].filter(item => item.value > 0);

  // Risk assessment data
  const riskData = [
    { name: 'Low Risk', value: 78, color: '#10B981' },
    { name: 'Medium Risk', value: 18, color: '#F59E0B' },
    { name: 'High Risk', value: 4, color: '#EF4444' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header
        title="Reports & Analytics"
        subtitle="Business insights and performance metrics"
        showNewBondButton={false}
      />

      <div className="p-6 overflow-y-auto h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Reports & Analytics</h3>
            <p className="text-muted-foreground">Business insights and performance metrics</p>
          </div>
          <Button data-testid="button-generate-report">
            <i className="fas fa-file-export mr-2"></i>Generate Report
          </Button>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card data-testid="card-monthly-performance">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground">Monthly Performance</h4>
                <i className="fas fa-chart-line text-primary"></i>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bonds Created</span>
                  {statsLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-sm font-medium text-foreground" data-testid="value-bonds-created">
                      {performanceMetrics.bondsCreated}
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  {financialLoading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <span className="text-sm font-medium text-foreground" data-testid="value-performance-revenue">
                      {formatCurrency(performanceMetrics.revenue)}
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="text-sm font-medium text-green-600" data-testid="value-success-rate">
                    {performanceMetrics.successRate}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-client-analytics">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground">Client Analytics</h4>
                <i className="fas fa-users text-primary"></i>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">New Clients</span>
                  <span className="text-sm font-medium text-foreground" data-testid="value-new-clients">
                    {clientAnalytics.newClients}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Repeat Clients</span>
                  <span className="text-sm font-medium text-foreground" data-testid="value-repeat-clients">
                    {clientAnalytics.repeatClients}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Client Retention</span>
                  <span className="text-sm font-medium text-green-600" data-testid="value-client-retention">
                    {clientAnalytics.retention}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-risk-assessment">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground">Risk Assessment</h4>
                <i className="fas fa-shield-alt text-primary"></i>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Low Risk</span>
                  <span className="text-sm font-medium text-green-600" data-testid="value-low-risk">78%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Medium Risk</span>
                  <span className="text-sm font-medium text-amber-600" data-testid="value-medium-risk">18%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">High Risk</span>
                  <span className="text-sm font-medium text-red-600" data-testid="value-high-risk">4%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card data-testid="card-revenue-trends">
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>

          <Card data-testid="card-bond-status-distribution">
            <CardHeader>
              <CardTitle>Bond Status Distribution</CardTitle>
              <CardDescription>Current distribution of bond statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {bondStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bondStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {bondStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <i className="fas fa-chart-pie text-4xl mb-4 opacity-50"></i>
                      <p>No bond data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Assessment Chart */}
        <Card data-testid="card-risk-breakdown">
          <CardHeader>
            <CardTitle>Risk Assessment Breakdown</CardTitle>
            <CardDescription>Distribution of client risk levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="name" 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Percentage']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
