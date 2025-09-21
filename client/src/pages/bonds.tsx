import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { AddBondModal } from "@/components/modals/add-bond-modal";
import { Card, CardContent } from "@/components/ui/card";
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
import { api } from "@/lib/api";
import { BondWithDetails } from "@/lib/types";

export default function Bonds() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedBondId, setSelectedBondId] = useState<string | null>(null);
  const [bondDetailsModalOpen, setBondDetailsModalOpen] = useState(false);

  const { data: bonds = [], isLoading } = useQuery<BondWithDetails[]>({
    queryKey: ["/api/bonds/with-details"],
    queryFn: () => api.getBondsWithDetails(),
  });

  // Filter bonds based on search term and status
  const filteredBonds = bonds.filter((bond) => {
    const matchesSearch = !searchTerm || 
      bond.bondNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bond.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bond.clientPhone.includes(searchTerm);
    
    const matchesStatus = !statusFilter || statusFilter === "all" || bond.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate bond statistics
  const bondStats = {
    active: bonds.filter(b => b.status === 'active').length,
    completed: bonds.filter(b => b.status === 'completed').length,
    atRisk: bonds.filter(b => b.status === 'at_risk').length,
    forfeited: bonds.filter(b => b.status === 'forfeited').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-blue-100 text-blue-800" data-testid="badge-active">Active</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800" data-testid="badge-completed">Completed</Badge>;
      case "at_risk":
        return <Badge className="bg-amber-100 text-amber-800" data-testid="badge-at-risk">At Risk</Badge>;
      case "forfeited":
        return <Badge className="bg-red-100 text-red-800" data-testid="badge-forfeited">Forfeited</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-unknown">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid_full":
        return <Badge className="bg-green-100 text-green-800" data-testid="badge-paid-full">Paid in Full</Badge>;
      case "partial":
        return <Badge className="bg-amber-100 text-amber-800" data-testid="badge-partial">Partial Payment</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800" data-testid="badge-pending">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800" data-testid="badge-overdue">Overdue</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-unknown">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleViewBondDetails = (bondId: string) => {
    setSelectedBondId(bondId);
    setBondDetailsModalOpen(true);
  };

  const handleEditBond = (bondId: string) => {
    // TODO: Implement edit functionality
    console.log('Edit bond:', bondId);
  };

  const handlePrintBond = (bondId: string) => {
    // TODO: Implement print functionality
    window.print();
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header
        title="Bond Tracking"
        subtitle="Monitor bond status, payments, and collateral"
        onNewBond={() => setShowAddModal(true)}
      />

      <div className="p-6 overflow-y-auto h-full">
        {/* Bond Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="stat-active-bonds">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Active Bonds</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="value-active-bonds">
                    {bondStats.active}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-handshake text-blue-600"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-completed-bonds">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="value-completed-bonds">
                    {bondStats.completed}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-check-circle text-green-600"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-at-risk-bonds">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">At Risk</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="value-at-risk-bonds">
                    {bondStats.atRisk}
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-amber-600"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-forfeited-bonds">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Forfeited</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="value-forfeited-bonds">
                    {bondStats.forfeited}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-times-circle text-red-600"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                <Input
                  type="text"
                  placeholder="Bond number, client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-bonds"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="forfeited">Forfeited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Court Date</label>
                <Input type="date" data-testid="input-court-date-filter" />
              </div>
              <div className="flex items-end">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                  }}
                  data-testid="button-clear-filters"
                >
                  <i className="fas fa-times mr-2"></i>Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bonds Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bond Details</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Court Date</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-4" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredBonds.length > 0 ? (
                  filteredBonds.map((bond) => (
                    <TableRow key={bond.id} className="hover:bg-muted/50" data-testid={`bond-row-${bond.id}`}>
                      <TableCell>
                        <div className="text-sm font-medium text-foreground" data-testid={`bond-number-${bond.id}`}>
                          {bond.bondNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Created: {formatDate(bond.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-foreground" data-testid={`bond-client-${bond.id}`}>
                          {bond.clientName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {bond.clientPhone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-foreground">
                          {formatCurrency(bond.bondAmount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Premium: {formatCurrency(bond.premiumAmount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(bond.status)}
                      </TableCell>
                      <TableCell>
                        {bond.courtDate ? (
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {formatDate(bond.courtDate)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTime(bond.courtDate)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Not scheduled</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(bond.paymentStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <button 
                            className="text-primary hover:text-primary/80" 
                            title="View Details"
                            onClick={() => handleViewBondDetails(bond.id)}
                            data-testid={`button-view-${bond.id}`}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="text-muted-foreground hover:text-foreground" 
                            title="Edit"
                            onClick={() => handleEditBond(bond.id)}
                            data-testid={`button-edit-${bond.id}`}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="text-muted-foreground hover:text-foreground" 
                            title="Print"
                            onClick={() => handlePrintBond(bond.id)}
                            data-testid={`button-print-${bond.id}`}
                          >
                            <i className="fas fa-print"></i>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || statusFilter ? (
                          <>
                            <i className="fas fa-search text-4xl mb-4 block opacity-50"></i>
                            <p className="text-lg mb-2">No bonds found</p>
                            <p className="text-sm">Try adjusting your search criteria</p>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-handshake text-4xl mb-4 block opacity-50"></i>
                            <p className="text-lg mb-2">No bonds yet</p>
                            <p className="text-sm">Create your first bond to get started</p>
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
          {filteredBonds.length > 0 && (
            <div className="px-6 py-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredBonds.length} of {bonds.length} results
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

      <AddBondModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />

      {/* Bond Details Modal */}
      <Dialog open={bondDetailsModalOpen} onOpenChange={setBondDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bond Details</DialogTitle>
            <DialogDescription>
              View detailed information about this bond
            </DialogDescription>
          </DialogHeader>
          {selectedBondId && (() => {
            const bond = bonds.find(b => b.id === selectedBondId);
            if (!bond) return <div>Bond not found</div>;
            
            return (
              <div className="space-y-6" data-testid="bond-details-modal">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bond Number</label>
                    <p className="text-foreground" data-testid="modal-bond-number">{bond.bondNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div data-testid="modal-bond-status">{getStatusBadge(bond.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Client Name</label>
                    <p className="text-foreground" data-testid="modal-client-name">{bond.clientName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Client Phone</label>
                    <p className="text-foreground" data-testid="modal-client-phone">{bond.clientPhone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bond Amount</label>
                    <p className="text-foreground" data-testid="modal-bond-amount">{formatCurrency(bond.bondAmount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Premium Amount</label>
                    <p className="text-foreground" data-testid="modal-premium-amount">{formatCurrency(bond.premiumAmount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Court Date</label>
                    <p className="text-foreground" data-testid="modal-court-date">
                      {bond.courtDate ? `${formatDate(bond.courtDate)} ${formatTime(bond.courtDate)}` : 'Not scheduled'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                    <div data-testid="modal-payment-status">{getPaymentStatusBadge(bond.paymentStatus)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                    <p className="text-foreground" data-testid="modal-created-date">{formatDate(bond.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
