import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { AddCaseModal } from "@/components/modals/add-case-modal";
import { CaseDetailsModal } from "@/components/modals/case-details-modal";
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
import { api } from "@/lib/api";

export default function Cases() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseDetailsModalOpen, setCaseDetailsModalOpen] = useState(false);
  
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["/api/cases"],
    queryFn: () => api.getCases(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => api.getClients(),
  });

  // Create client lookup map
  const clientMap = clients.reduce((map: any, client: any) => {
    map[client.id] = client;
    return map;
  }, {});

  // Filter cases based on search term and status
  const filteredCases = cases.filter((case_: any) => {
    const client = clientMap[case_.clientId];
    const clientName = client ? `${client.firstName} ${client.lastName}` : "";
    
    const matchesSearch = !searchTerm || 
      case_.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.charges.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === "all" || case_.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-100 text-blue-800" data-testid="badge-open">Open</Badge>;
      case "closed":
        return <Badge className="bg-green-100 text-green-800" data-testid="badge-closed">Closed</Badge>;
      case "dismissed":
        return <Badge className="bg-gray-100 text-gray-800" data-testid="badge-dismissed">Dismissed</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-unknown">{status}</Badge>;
    }
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

  const handleViewCaseDetails = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCaseDetailsModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header
        title="Case Management"
        subtitle="Track court cases and legal proceedings"
        showNewBondButton={false}
      />

      <div className="p-6 overflow-y-auto h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Case Management</h3>
            <p className="text-muted-foreground">Track court cases and legal proceedings</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} data-testid="button-add-case">
            <i className="fas fa-plus mr-2"></i>Add New Case
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                <Input
                  type="text"
                  placeholder="Case number, charges, client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-cases"
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
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
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

        {/* Cases Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case Information</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Charges</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Court Date</TableHead>
                  <TableHead>Court Location</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-4" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredCases.length > 0 ? (
                  filteredCases.map((case_: any) => {
                    const client = clientMap[case_.clientId];
                    return (
                      <TableRow key={case_.id} className="hover:bg-muted/50" data-testid={`case-row-${case_.id}`}>
                        <TableCell>
                          <div className="text-sm font-medium text-foreground" data-testid={`case-number-${case_.id}`}>
                            {case_.caseNumber}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Arrest: {formatDate(case_.arrestDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client ? (
                            <div>
                              <div className="text-sm font-medium text-foreground" data-testid={`case-client-${case_.id}`}>
                                {client.firstName} {client.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {client.phone}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">Unknown Client</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground max-w-xs truncate" title={case_.charges}>
                            {case_.charges}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(case_.status)}
                        </TableCell>
                        <TableCell>
                          {case_.courtDate ? (
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {formatDate(case_.courtDate)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatTime(case_.courtDate)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">Not scheduled</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">
                            {case_.courtLocation || "Not specified"}
                          </div>
                          {case_.judgeName && (
                            <div className="text-sm text-muted-foreground">
                              Judge: {case_.judgeName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <button 
                              className="text-primary hover:text-primary/80" 
                              title="View Details"
                              onClick={() => handleViewCaseDetails(case_.id)}
                              data-testid={`button-view-${case_.id}`}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button 
                              className="text-muted-foreground hover:text-foreground" 
                              title="Edit"
                              onClick={() => handleViewCaseDetails(case_.id)}
                              data-testid={`button-edit-${case_.id}`}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="text-muted-foreground hover:text-foreground" 
                              title="Documents"
                              onClick={() => handleViewCaseDetails(case_.id)}
                              data-testid={`button-documents-${case_.id}`}
                            >
                              <i className="fas fa-file-alt"></i>
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || statusFilter ? (
                          <>
                            <i className="fas fa-search text-4xl mb-4 block opacity-50"></i>
                            <p className="text-lg mb-2">No cases found</p>
                            <p className="text-sm">Try adjusting your search criteria</p>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-briefcase text-4xl mb-4 block opacity-50"></i>
                            <p className="text-lg mb-2">No cases yet</p>
                            <p className="text-sm">Add your first case to get started</p>
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
          {filteredCases.length > 0 && (
            <div className="px-6 py-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredCases.length} of {cases.length} results
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

      <AddCaseModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />

      <CaseDetailsModal
        caseId={selectedCaseId}
        open={caseDetailsModalOpen}
        onOpenChange={(open) => {
          setCaseDetailsModalOpen(open);
          if (!open) {
            setSelectedCaseId(null);
          }
        }}
      />
    </div>
  );
}
