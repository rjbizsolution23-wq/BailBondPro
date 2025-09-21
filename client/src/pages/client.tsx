import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { Client } from "@shared/schema";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, User, FileText, Clock, MessageSquare } from "lucide-react";
import { Link } from "wouter";

export default function ClientDetail() {
  const params = useParams();
  const clientId = params.id;

  const { data: client, isLoading, error } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    queryFn: () => api.getClient(clientId as string),
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
                <TabsTrigger value="bonds" data-testid="tab-bonds">Bonds</TabsTrigger>
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
                    <CardTitle>Bonds</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No bonds found for this client.</p>
                      <Button className="mt-4" size="sm" data-testid="button-add-bond">
                        Add First Bond
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No documents found for this client.</p>
                      <Button className="mt-4" size="sm" data-testid="button-upload-document">
                        Upload Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Activity Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No recent activity for this client.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Contact & Emergency */}
          <div className="space-y-6">
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