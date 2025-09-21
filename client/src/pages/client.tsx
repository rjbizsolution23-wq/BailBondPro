import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { Client, Bond, Payment, Document } from "@shared/schema";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, User, FileText, Clock, MessageSquare, DollarSign, Building, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function ClientDetail() {
  const params = useParams();
  const clientId = params.id;

  const { data: client, isLoading, error } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    queryFn: () => api.getClient(clientId as string),
    enabled: !!clientId,
  });

  // State for modals
  const [showAddBondModal, setShowAddBondModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showUploadDocumentModal, setShowUploadDocumentModal] = useState(false);

  // Fetch related data for this client with explicit API calls
  const { data: clientBonds = [], isLoading: bondsLoading } = useQuery<Bond[]>({
    queryKey: ["/api/bonds", clientId],
    queryFn: () => api.getBonds({ clientId: clientId as string }),
    enabled: !!clientId,
  });

  const { data: clientPayments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments", clientId],
    queryFn: () => api.getPayments({ clientId: clientId as string }),
    enabled: !!clientId,
  });

  const { data: clientDocuments = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", clientId],
    queryFn: () => api.getDocuments({ relatedId: clientId as string, relatedType: "client" }),
    enabled: !!clientId,
  });

  const { data: clientActivities = [], isLoading: activitiesLoading } = useQuery<any[]>({
    queryKey: ["/api/activities", clientId],
    queryFn: () => api.getActivities({ resourceId: clientId as string, resourceType: "client", limit: 20 }),
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-hidden">
        <Header
          title="Client Details"
          subtitle="Loading client information..."
          showNewBondButton={false}
        />
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex-1 overflow-hidden">
        <Header
          title="Client Not Found"
          subtitle="The requested client could not be found"
          showNewBondButton={false}
        />
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Client Not Found</h3>
                <p className="text-muted-foreground mb-4">
                  The client you're looking for doesn't exist or may have been removed.
                </p>
                <Link href="/clients">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Clients
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "high_risk":
        return <Badge className="bg-amber-100 text-amber-800">High Risk</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return "Not specified";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header
        title="Client Details"
        subtitle={`${client.firstName} ${client.lastName}`}
        showNewBondButton={false}
      />

      <div className="p-6 space-y-6">
        {/* Back Button */}
        <div className="flex items-center">
          <Link href="/clients">
            <Button variant="outline" size="sm" data-testid="button-back-to-clients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </Link>
        </div>

        {/* Client Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-medium text-xl">
                {getInitials(client.firstName, client.lastName)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="client-name">
                {client.firstName} {client.lastName}
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                {getStatusBadge(client.status)}
                <span className="text-sm text-muted-foreground">
                  Client since {formatDate(client.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" data-testid="button-edit-client">
              <FileText className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
            <Button size="sm" data-testid="button-new-bond">
              Add Bond
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
                <TabsTrigger value="bonds" data-testid="tab-bonds">Bonds</TabsTrigger>
                <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
                <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">First Name</label>
                        <p className="text-sm" data-testid="client-first-name">{client.firstName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                        <p className="text-sm" data-testid="client-last-name">{client.lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                        <p className="text-sm" data-testid="client-dob">{formatDate(client.dateOfBirth)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <p className="text-sm" data-testid="client-status">{client.status}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Address
                      </h4>
                      <div className="text-sm text-muted-foreground" data-testid="client-address">
                        <p>{client.address}</p>
                        <p>{client.city}, {client.state} {client.zipCode}</p>
                      </div>
                    </div>

                    {client.notes && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2 flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Notes
                        </h4>
                        <p className="text-sm text-muted-foreground" data-testid="client-notes">
                          {client.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bonds" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Bonds ({clientBonds.length})</span>
                      <Button size="sm" data-testid="button-add-bond" onClick={() => setShowAddBondModal(true)}>
                        Add Bond
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bondsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : clientBonds.length > 0 ? (
                      <div className="space-y-4">
                        {clientBonds.map((bond: any) => (
                          <div
                            key={bond.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            data-testid={`bond-item-${bond.id}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-3">
                                  <h3 className="font-medium">{bond.bondNumber}</h3>
                                  <Badge 
                                    className={
                                      bond.status === 'active' ? 'bg-green-100 text-green-800' :
                                      bond.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                      bond.status === 'forfeited' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }
                                  >
                                    {bond.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    ${parseFloat(bond.bondAmount || '0').toLocaleString()}
                                  </span>
                                  <span className="flex items-center">
                                    Premium: ${parseFloat(bond.premiumAmount || '0').toLocaleString()}
                                  </span>
                                  {bond.issueDate && (
                                    <span className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      {formatDate(bond.issueDate)}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Payment Status: {bond.paymentStatus || 'pending'}
                                </div>
                              </div>
                              <Button variant="outline" size="sm" data-testid={`button-view-bond-${bond.id}`}>
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No bonds found for this client.</p>
                        <Button className="mt-4" size="sm" data-testid="button-add-first-bond">
                          Add First Bond
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Payment History ({clientPayments.length})</span>
                      <Button size="sm" data-testid="button-record-payment" onClick={() => setShowRecordPaymentModal(true)}>
                        Record Payment
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {paymentsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : clientPayments.length > 0 ? (
                      <div className="space-y-4">
                        {clientPayments.map((payment: any) => (
                          <div
                            key={payment.id}
                            className="p-4 border rounded-lg"
                            data-testid={`payment-item-${payment.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-3">
                                  <span className="font-medium">{payment.transactionId}</span>
                                  <Badge className="bg-green-100 text-green-800">
                                    {payment.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    ${parseFloat(payment.amount || '0').toLocaleString()}
                                  </span>
                                  <span>{payment.paymentMethod}</span>
                                  <span>{formatDate(payment.paymentDate)}</span>
                                </div>
                                {payment.notes && (
                                  <p className="text-sm text-muted-foreground">{payment.notes}</p>
                                )}
                              </div>
                              <div className="text-lg font-medium">
                                ${parseFloat(payment.amount || '0').toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No payments found for this client.</p>
                        <Button className="mt-4" size="sm" data-testid="button-record-first-payment">
                          Record First Payment
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Documents ({clientDocuments.length})</span>
                      <Button size="sm" data-testid="button-upload-document" onClick={() => setShowUploadDocumentModal(true)}>
                        Upload Document
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {documentsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : clientDocuments.length > 0 ? (
                      <div className="space-y-4">
                        {clientDocuments.map((document: any) => (
                          <div
                            key={document.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            data-testid={`document-item-${document.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                                <div>
                                  <h3 className="font-medium">{document.fileName}</h3>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <span>{document.category}</span>
                                    <span>{formatDate(document.uploadedAt)}</span>
                                    <span>{document.fileSize ? `${(document.fileSize / 1024).toFixed(1)} KB` : ''}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" data-testid={`button-view-document-${document.id}`}>
                                  View
                                </Button>
                                <Button variant="outline" size="sm" data-testid={`button-download-document-${document.id}`}>
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No documents found for this client.</p>
                        <Button className="mt-4" size="sm" data-testid="button-upload-first-document">
                          Upload First Document
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Activity Timeline ({clientActivities.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activitiesLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : clientActivities.length > 0 ? (
                      <div className="space-y-4">
                        {clientActivities.map((activity: any, index: number) => (
                          <div
                            key={activity.id}
                            className="flex items-start space-x-4 p-4 border-l-2 border-muted"
                            data-testid={`activity-item-${activity.id}`}
                          >
                            <div className="flex-shrink-0">
                              {activity.type === 'payment' ? (
                                <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                              ) : activity.type === 'bond_created' ? (
                                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                              ) : activity.type === 'document_uploaded' ? (
                                <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                              ) : activity.type === 'status_change' ? (
                                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                              ) : (
                                <Clock className="h-5 w-5 text-gray-600 mt-0.5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {activity.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(activity.createdAt)}
                                </p>
                              </div>
                              {activity.details && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {activity.details}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No recent activity for this client.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Statistics, Contact & Emergency */}
          <div className="space-y-6">
            {/* Client Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{clientBonds.length}</div>
                    <div className="text-sm text-muted-foreground">Total Bonds</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${clientPayments.reduce((sum: number, payment: Payment) => sum + parseFloat(payment.amount || '0'), 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Payments</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{clientDocuments.length}</div>
                    <div className="text-sm text-muted-foreground">Documents</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{clientActivities.length}</div>
                    <div className="text-sm text-muted-foreground">Activities</div>
                  </div>
                </div>
                
                {/* Active Bonds Summary */}
                {clientBonds.filter((bond: any) => bond.status === 'active').length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Active Bonds
                    </h4>
                    <div className="space-y-2">
                      {clientBonds
                        .filter((bond: any) => bond.status === 'active')
                        .slice(0, 3)
                        .map((bond: Bond) => (
                          <div key={bond.id} className="flex justify-between text-sm">
                            <span>{bond.bondNumber}</span>
                            <span className="font-medium">${parseFloat(bond.bondAmount || '0').toLocaleString()}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Phone className="h-5 w-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground" data-testid="client-phone">
                      {client.phone}
                    </p>
                  </div>
                </div>
                {client.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground" data-testid="client-email">
                        {client.email}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {(client.emergencyContact || client.emergencyPhone) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client.emergencyContact && (
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground" data-testid="emergency-contact">
                        {client.emergencyContact}
                      </p>
                    </div>
                  )}
                  {client.emergencyPhone && (
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground" data-testid="emergency-phone">
                        {client.emergencyPhone}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" data-testid="button-call-client">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Client
                </Button>
                {client.email && (
                  <Button variant="outline" className="w-full justify-start" data-testid="button-email-client">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start" data-testid="button-schedule-checkin">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Check-in
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}