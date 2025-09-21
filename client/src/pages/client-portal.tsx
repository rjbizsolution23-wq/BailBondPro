import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Calendar, Camera, FileText, CreditCard, MapPin, 
  Clock, AlertTriangle, CheckCircle, LogOut, Shield,
  Gavel, DollarSign, Phone, RefreshCw
} from "lucide-react";

interface ClientPortalData {
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    status: string;
    lastCheckin: string | null;
  };
  bonds: any[];
  cases: any[];
  upcomingCourtDates: any[];
  recentCheckins: any[];
}

export default function ClientPortalPage() {
  const { clientId } = useParams();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBond, setSelectedBond] = useState<string | null>(null);

  // Load client data on mount with authentication
  const { data: clientData, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/client/${clientId}/dashboard`],
    queryFn: async (): Promise<ClientPortalData> => {
      const token = localStorage.getItem("clientToken");
      if (!token) {
        throw new Error("Authentication required");
      }
      const response = await fetch(`/api/client/${clientId}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      return response.json();
    },
    enabled: !!clientId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Logout functionality
  const handleLogout = () => {
    localStorage.removeItem("clientData");
    localStorage.removeItem("clientToken");
    setLocation("/client-login");
    toast({
      title: t("clientPortal.logoutSuccessful"),
      description: t("clientPortal.comeBackSoon"),
    });
  };

  // Photo check-in mutation
  const checkinMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem("clientToken");
      if (!token) {
        throw new Error("Authentication required");
      }
      const response = await fetch(`/api/client/${clientId}/checkin`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Check-in failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("clientPortal.checkinCompleted"),
        description: t("clientPortal.checkinSuccessful"),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/dashboard`] });
    },
    onError: (error: any) => {
      toast({
        title: t("clientPortal.checkinFailed"),
        description: error.message || t("clientPortal.pleaseRetry"),
        variant: "destructive",
      });
    },
  });

  // Handle photo check-in
  const handlePhotoCheckin = async (file: File) => {
    if (!selectedBond) {
      toast({
        title: t("clientPortal.selectBond"),
        description: t("clientPortal.bondRequiredForCheckin"),
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("bondId", selectedBond);

    // Add GPS location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          formData.append("latitude", position.coords.latitude.toString());
          formData.append("longitude", position.coords.longitude.toString());
          checkinMutation.mutate(formData);
        },
        () => {
          // Still submit without GPS if denied
          checkinMutation.mutate(formData);
        }
      );
    } else {
      checkinMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !clientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("errors.loadingFailed")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t("errors.unableToLoadData")}
            </p>
            <Button onClick={() => refetch()} className="w-full">
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", text: t("common.active") },
      completed: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", text: t("common.completed") },
      forfeited: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", text: t("bonds.forfeited") },
      at_risk: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", text: t("bonds.atRisk") },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.active;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t("clientPortal.title")}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {clientData.client.firstName} {clientData.client.lastName}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              {t("navigation.logout")}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-white dark:bg-gray-800">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <User className="h-4 w-4 mr-2" />
              {t("clientPortal.dashboard")}
            </TabsTrigger>
            <TabsTrigger value="bonds" data-testid="tab-bonds">
              <FileText className="h-4 w-4 mr-2" />
              {t("clientPortal.myBonds")}
            </TabsTrigger>
            <TabsTrigger value="court" data-testid="tab-court">
              <Calendar className="h-4 w-4 mr-2" />
              {t("clientPortal.courtDates")}
            </TabsTrigger>
            <TabsTrigger value="checkin" data-testid="tab-checkin">
              <Camera className="h-4 w-4 mr-2" />
              {t("clientPortal.checkIn")}
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Status Overview */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("clientPortal.complianceStatus")}
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {t("checkin.compliant")}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {clientData.client.lastCheckin 
                      ? `${t("clientPortal.lastCheckin")}: ${formatDate(clientData.client.lastCheckin)}`
                      : t("clientPortal.noRecentCheckin")
                    }
                  </p>
                </CardContent>
              </Card>

              {/* Active Bonds */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("clientPortal.myBonds")}
                  </CardTitle>
                  <FileText className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {clientData.bonds.length}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t("bonds.activeBonds")}
                  </p>
                </CardContent>
              </Card>

              {/* Next Court Date */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("clientPortal.nextCourtDate")}
                  </CardTitle>
                  <Gavel className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {clientData.upcomingCourtDates.length > 0 
                      ? formatDate(clientData.upcomingCourtDates[0].courtDate)
                      : t("cases.noDates")
                    }
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {clientData.upcomingCourtDates.length > 0
                      ? clientData.upcomingCourtDates[0].courtLocation || t("cases.locationTBD")
                      : t("cases.noUpcomingDates")
                    }
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Check-ins */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>{t("clientPortal.checkinHistory")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientData.recentCheckins.length === 0 ? (
                  <div className="text-center py-8">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t("checkin.noCheckins")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientData.recentCheckins.map((checkin: any, index: number) => (
                      <div key={checkin.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">
                            {formatDate(checkin.createdAt)}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {t("common.completed")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bonds Tab */}
          <TabsContent value="bonds" className="space-y-6">
            {clientData.bonds.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("bonds.noBonds")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {clientData.bonds.map((bond: any) => (
                  <Card key={bond.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedBond(bond.id)}
                        data-testid={`card-bond-${bond.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {t("bonds.bondNumber")}: {bond.bondNumber}
                        </CardTitle>
                        {getStatusBadge(bond.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("clientPortal.bondAmount")}
                          </p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(bond.bondAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("clientPortal.premiumPaid")}
                          </p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(bond.premiumAmount)}
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("bonds.issueDate")}
                        </p>
                        <p className="font-medium">{formatDate(bond.issueDate)}</p>
                      </div>
                      {selectedBond === bond.id && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {t("clientPortal.selectedForCheckin")}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Court Dates Tab */}
          <TabsContent value="court" className="space-y-6">
            {clientData.upcomingCourtDates.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("cases.noUpcomingDates")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {clientData.upcomingCourtDates.map((courtDate: any) => (
                  <Card key={courtDate.id} data-testid={`card-court-${courtDate.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {t("cases.case")} #{courtDate.caseNumber}
                        </CardTitle>
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          {t("cases.upcoming")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t("cases.courtDate")}
                            </p>
                            <p className="font-semibold">{formatDate(courtDate.courtDate)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t("cases.location")}
                            </p>
                            <p className="font-semibold">
                              {courtDate.courtLocation || t("cases.locationTBD")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {t("cases.charges")}
                        </p>
                        <p className="font-medium">{courtDate.charges}</p>
                      </div>
                      {courtDate.judgeName && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("cases.judge")}
                          </p>
                          <p className="font-medium">{courtDate.judgeName}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Check-in Tab */}
          <TabsContent value="checkin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>{t("clientPortal.takePhotoCheckin")}</span>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("clientPortal.photoRequired")}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedBond && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        {t("clientPortal.selectBondForCheckin")}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("clientPortal.takePhoto")}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {t("clientPortal.tapToTakePhoto")}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    id="photo-input"
                    data-testid="input-photo"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handlePhotoCheckin(file);
                      }
                    }}
                    disabled={!selectedBond || checkinMutation.isPending}
                  />
                  <label
                    htmlFor="photo-input"
                    className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                      selectedBond && !checkinMutation.isPending
                        ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {checkinMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        {t("common.uploading")}
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-5 w-5" />
                        {t("clientPortal.takePhoto")}
                      </>
                    )}
                  </label>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>• {t("clientPortal.locationRequired")}</p>
                  <p>• {t("clientPortal.photoVerificationRequired")}</p>
                  <p>• {t("clientPortal.ensureGoodLighting")}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}