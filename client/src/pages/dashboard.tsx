import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { AISearch } from "@/components/ui/ai-search";
import { ClientCheckin } from "@/components/ui/client-checkin";
import { useLanguage } from "@/contexts/language-context";
import { api } from "@/lib/api";
import { DashboardStats, RecentActivity, CourtDate } from "@/lib/types";

export default function Dashboard() {
  const { t } = useLanguage();
  
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: api.getDashboardStats,
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: ["/api/dashboard/recent-activity"],
    queryFn: () => api.getRecentActivity(10),
  });

  const { data: courtDates = [], isLoading: courtDatesLoading } = useQuery<CourtDate[]>({
    queryKey: ["/api/dashboard/upcoming-court-dates"],
    queryFn: () => api.getUpcomingCourtDates(10),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getActivityIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'created':
        return "fas fa-plus text-blue-600";
      case 'payment':
      case 'paid':
        return "fas fa-check text-green-600";
      case 'reminder':
      case 'alert':
        return "fas fa-exclamation text-amber-600";
      default:
        return "fas fa-info text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header
        title={t('dashboard.title')}
        subtitle={t('dashboard.overview')}
      />

      <div className="p-6 overflow-y-auto h-full">
        {/* AI Search and Client Check-in */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AISearch />
          <ClientCheckin />
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="stat-active-bonds">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Active Bonds</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground" data-testid="value-active-bonds">
                      {stats?.activeBonds || 0}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-handshake text-blue-600 text-xl"></i>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600 text-sm font-medium">+12%</span>
                <span className="text-muted-foreground text-sm ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Revenue</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground" data-testid="value-total-revenue">
                      {formatCurrency(stats?.totalRevenue || 0)}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600 text-sm font-medium">+8%</span>
                <span className="text-muted-foreground text-sm ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-pending-payments">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Pending Payments</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground" data-testid="value-pending-payments">
                      {formatCurrency(stats?.pendingPayments || 0)}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-amber-600 text-xl"></i>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-destructive text-sm font-medium">-3%</span>
                <span className="text-muted-foreground text-sm ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-court-dates">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Court Dates</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground" data-testid="value-court-dates">
                      {stats?.upcomingCourtDates || 0}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar text-purple-600 text-xl"></i>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-muted-foreground text-sm">Next: {courtDates[0] ? formatDate(courtDates[0].courtDate) : 'None scheduled'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Activity */}
          <Card data-testid="recent-activity-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3" data-testid={`activity-${activity.id}`}>
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className={getActivityIcon(activity.action)} style={{ fontSize: '14px' }}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {activity.action} for{' '}
                          <span className="font-medium">
                            {activity.firstName} {activity.lastName}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Court Dates */}
          <Card data-testid="court-dates-card">
            <CardHeader>
              <CardTitle>Upcoming Court Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courtDatesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))
                ) : courtDates.length > 0 ? (
                  courtDates.map((courtDate) => (
                    <div
                      key={courtDate.id}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                      data-testid={`court-date-${courtDate.id}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {courtDate.firstName} {courtDate.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Case #{courtDate.caseNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {formatDate(courtDate.courtDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(courtDate.courtDate)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No upcoming court dates</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card data-testid="revenue-chart-card">
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly revenue performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
