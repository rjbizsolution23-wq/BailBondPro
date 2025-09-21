import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { api } from "@/lib/api";
import { FinancialSummary } from "@/lib/types";
import { insertPaymentSchema, InsertPayment } from "@shared/schema";

export default function Financial() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);

  const { data: financialSummary, isLoading: summaryLoading } = useQuery<FinancialSummary>({
    queryKey: ["/api/financial/summary"],
    queryFn: () => api.getFinancialSummary(),
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: () => api.getPayments(),
  });

  // Filter payments based on search term and type
  const filteredPayments = payments.filter((payment: any) => {
    const matchesSearch = !searchTerm || 
      payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.clientName && payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = !typeFilter || typeFilter === "all" || payment.paymentType === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800" data-testid="badge-completed">Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800" data-testid="badge-pending">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800" data-testid="badge-failed">Failed</Badge>;
      case "refunded":
        return <Badge className="bg-gray-100 text-gray-800" data-testid="badge-refunded">Refunded</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-unknown">{status}</Badge>;
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "premium":
        return "Premium Payment";
      case "collateral_return":
        return "Collateral Return";
      case "fee":
        return "Fee";
      default:
        return type;
    }
  };

  const { toast } = useToast();
  
  // Get clients and bonds for dropdowns
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => api.getClients(),
  });

  const { data: bonds = [] } = useQuery({
    queryKey: ["/api/bonds"],
    queryFn: () => api.getBonds(),
  });

  const form = useForm<InsertPayment>({
    resolver: zodResolver(insertPaymentSchema),
    defaultValues: {
      transactionId: `TXN-${Date.now()}`,
      bondId: "",
      clientId: "",
      amount: "",
      paymentType: "premium",
      paymentMethod: "cash",
      status: "completed",
      paymentDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: InsertPayment) => api.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/summary"] });
      toast({
        title: "Payment Recorded",
        description: "Payment has been successfully recorded.",
      });
      setShowRecordPaymentModal(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRecordPayment = () => {
    setShowRecordPaymentModal(true);
  };

  const handleExportReport = () => {
    // TODO: Implement export functionality
    console.log('Export report clicked');
  };

  const onSubmitPayment = (data: InsertPayment) => {
    createPaymentMutation.mutate(data);
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header
        title="Financial Management"
        subtitle="Track payments, fees, and financial reporting"
        showNewBondButton={false}
      />

      <div className="p-6 overflow-y-auto h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Financial Management</h3>
            <p className="text-muted-foreground">Track payments, fees, and financial reporting</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={handleExportReport} data-testid="button-export-report">
              <i className="fas fa-download mr-2"></i>Export Report
            </Button>
            <Button onClick={handleRecordPayment} data-testid="button-record-payment">
              <i className="fas fa-plus mr-2"></i>Record Payment
            </Button>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card data-testid="stat-monthly-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground">Revenue This Month</h4>
                <i className="fas fa-arrow-up text-green-600"></i>
              </div>
              {summaryLoading ? (
                <Skeleton className="h-8 w-24 mb-2" />
              ) : (
                <p className="text-3xl font-bold text-foreground" data-testid="value-monthly-revenue">
                  {formatCurrency(financialSummary?.monthlyRevenue || 0)}
                </p>
              )}
              <p className="text-sm text-green-600 mt-2">+12.5% from last month</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-outstanding-payments">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground">Outstanding Payments</h4>
                <i className="fas fa-clock text-amber-600"></i>
              </div>
              {summaryLoading ? (
                <Skeleton className="h-8 w-20 mb-2" />
              ) : (
                <p className="text-3xl font-bold text-foreground" data-testid="value-outstanding">
                  {formatCurrency(financialSummary?.outstanding || 0)}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {payments.filter((p: any) => p.status === 'pending').length} pending payments
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-collection-rate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground">Collection Rate</h4>
                <i className="fas fa-percentage text-primary"></i>
              </div>
              {summaryLoading ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <p className="text-3xl font-bold text-foreground" data-testid="value-collection-rate">
                  {financialSummary?.collectionRate || 0}%
                </p>
              )}
              <p className="text-sm text-green-600 mt-2">Above industry average</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="mb-8" data-testid="revenue-chart-card">
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly revenue performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        {/* Payment History Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                <Input
                  type="text"
                  placeholder="Transaction ID, client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-payments"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Payment Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger data-testid="select-type-filter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="premium">Premium Payment</SelectItem>
                    <SelectItem value="collateral_return">Collateral Return</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date Range</label>
                <Input type="date" data-testid="input-date-range" />
              </div>
              <div className="flex items-end">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("");
                  }}
                  data-testid="button-clear-filters"
                >
                  <i className="fas fa-times mr-2"></i>Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredPayments.length > 0 ? (
                  filteredPayments.map((payment: any) => (
                    <TableRow key={payment.id} className="hover:bg-muted/50" data-testid={`payment-row-${payment.id}`}>
                      <TableCell className="text-sm font-medium text-foreground" data-testid={`payment-id-${payment.id}`}>
                        {payment.transactionId}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {payment.clientName || "Unknown Client"}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {getPaymentTypeLabel(payment.paymentType)}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(payment.paymentDate)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell>
                        <button 
                          className="text-primary hover:text-primary/80" 
                          title="View Receipt"
                          data-testid={`button-receipt-${payment.id}`}
                        >
                          <i className="fas fa-receipt"></i>
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || typeFilter ? (
                          <>
                            <i className="fas fa-search text-4xl mb-4 block opacity-50"></i>
                            <p className="text-lg mb-2">No payments found</p>
                            <p className="text-sm">Try adjusting your search criteria</p>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-dollar-sign text-4xl mb-4 block opacity-50"></i>
                            <p className="text-lg mb-2">No payments yet</p>
                            <p className="text-sm">Record your first payment to get started</p>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredPayments.length > 0 && (
            <div className="px-6 py-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredPayments.length} of {payments.length} results
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                    1
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Record Payment Modal */}
      <Dialog open={showRecordPaymentModal} onOpenChange={setShowRecordPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a new payment transaction
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitPayment)} className="space-y-4">
              <FormField
                control={form.control}
                name="transactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction ID</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-transaction-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-client">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.firstName} {client.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bondId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bond</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bond">
                          <SelectValue placeholder="Select bond" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bonds.map((bond: any) => (
                          <SelectItem key={bond.id} value={bond.id}>
                            {bond.bondNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00"
                        data-testid="input-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="premium">Premium Payment</SelectItem>
                        <SelectItem value="collateral_return">Collateral Return</SelectItem>
                        <SelectItem value="fee">Fee</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-payment-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Additional notes..." data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRecordPaymentModal(false)}
                  data-testid="button-cancel-payment"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPaymentMutation.isPending}
                  data-testid="button-submit-payment"
                >
                  {createPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
