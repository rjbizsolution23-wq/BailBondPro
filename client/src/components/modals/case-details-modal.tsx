import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { UploadDocumentModal } from "./upload-document-modal";
import { api } from "@/lib/api";

const caseUpdateSchema = z.object({
  caseNumber: z.string().min(1, "Case number is required"),
  charges: z.string().min(1, "Charges are required"),
  arrestDate: z.string().min(1, "Arrest date is required"),
  courtDate: z.string().optional(),
  courtLocation: z.string().optional(),
  judgeName: z.string().optional(),
  prosecutorName: z.string().optional(),
  defenseAttorney: z.string().optional(),
  status: z.enum(["open", "closed", "dismissed"]),
  notes: z.string().optional(),
});

type CaseUpdateData = z.infer<typeof caseUpdateSchema>;

interface CaseDetailsModalProps {
  caseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CaseDetailsModal({ caseId, open, onOpenChange }: CaseDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Fetch case details
  const { data: caseData, isLoading: isCaseLoading } = useQuery({
    queryKey: ["/api/cases", caseId],
    queryFn: () => caseId ? api.getCase(caseId) : null,
    enabled: !!caseId && open,
  });

  // Fetch client details
  const { data: client } = useQuery({
    queryKey: ["/api/clients", caseData?.clientId],
    queryFn: () => caseData?.clientId ? api.getClient(caseData.clientId) : null,
    enabled: !!caseData?.clientId,
  });

  // Fetch case documents
  const { data: documents = [] } = useQuery({
    queryKey: ["/api/documents", { relatedId: caseId, relatedType: "case" }],
    queryFn: () => api.getDocuments({ relatedId: caseId!, relatedType: "case" }),
    enabled: !!caseId && open,
  });

  // Fetch case activities/timeline
  const { data: activities = [] } = useQuery({
    queryKey: ["/api/activities", caseId],
    queryFn: () => caseId ? api.getActivities({ resourceId: caseId, resourceType: "case" }) : [],
    enabled: !!caseId && open,
  });

  const form = useForm<CaseUpdateData>({
    resolver: zodResolver(caseUpdateSchema),
    defaultValues: {
      caseNumber: "",
      charges: "",
      arrestDate: "",
      courtDate: "",
      courtLocation: "",
      judgeName: "",
      prosecutorName: "",
      defenseAttorney: "",
      status: "open",
      notes: "",
    },
  });

  // Update form when case data changes
  useEffect(() => {
    if (caseData) {
      form.reset({
        caseNumber: caseData.caseNumber || "",
        charges: caseData.charges || "",
        arrestDate: caseData.arrestDate || "",
        courtDate: caseData.courtDate || "",
        courtLocation: caseData.courtLocation || "",
        judgeName: caseData.judgeName || "",
        prosecutorName: caseData.prosecutorName || "",
        defenseAttorney: caseData.defenseAttorney || "",
        status: caseData.status || "open",
        notes: caseData.notes || "",
      });
    }
  }, [caseData, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: CaseUpdateData) => {
      if (!caseId) throw new Error("No case ID");
      return api.updateCase(caseId, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Case updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update case",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = async (newStatus: "open" | "closed" | "dismissed") => {
    if (!caseId || !caseData) return;
    
    updateMutation.mutate({
      ...form.getValues(),
      status: newStatus,
    });
  };

  const onSubmit = (data: CaseUpdateData) => {
    updateMutation.mutate(data);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-100 text-blue-800">Open</Badge>;
      case "closed":
        return <Badge className="bg-green-100 text-green-800">Closed</Badge>;
      case "dismissed":
        return <Badge className="bg-gray-100 text-gray-800">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "contract":
        return "fas fa-file-contract text-blue-600";
      case "court_papers":
        return "fas fa-gavel text-purple-600";
      case "identification":
        return "fas fa-id-card text-green-600";
      case "financial":
        return "fas fa-receipt text-amber-600";
      default:
        return "fas fa-file text-gray-600";
    }
  };

  if (!caseId) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="case-details-modal-title">
              {isCaseLoading ? "Loading..." : `Case ${caseData?.caseNumber || 'Details'}`}
            </DialogTitle>
          </DialogHeader>

          {isCaseLoading ? (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ) : caseData ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-documents">
                  Documents ({documents.length})
                </TabsTrigger>
                <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
                <TabsTrigger value="notes" data-testid="tab-notes">Notes</TabsTrigger>
              </TabsList>

              {/* Case Details Tab */}
              <TabsContent value="details" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Case {caseData.caseNumber}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Created {formatDate(caseData.createdAt)}
                      </p>
                    </div>
                    {getStatusBadge(caseData.status)}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      data-testid="button-toggle-edit"
                    >
                      {isEditing ? (
                        <>
                          <i className="fas fa-times mr-2"></i>Cancel
                        </>
                      ) : (
                        <>
                          <i className="fas fa-edit mr-2"></i>Edit
                        </>
                      )}
                    </Button>
                    {!isEditing && (
                      <Select
                        value={caseData.status}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="w-32" data-testid="select-status-quick">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <Separator />

                {isEditing ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="caseNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Case Number</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-case-number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-edit-status">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                  <SelectItem value="dismissed">Dismissed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="arrestDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Arrest Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-edit-arrest-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="courtDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Court Date</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} data-testid="input-edit-court-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="courtLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Court Location</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-court-location" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="judgeName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Judge Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-judge-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="prosecutorName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prosecutor Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-prosecutor-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="defenseAttorney"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Defense Attorney</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-defense-attorney" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="charges"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Charges</FormLabel>
                            <FormControl>
                              <Textarea {...field} data-testid="textarea-edit-charges" />
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
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea {...field} data-testid="textarea-edit-notes" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          data-testid="button-cancel-edit"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateMutation.isPending}
                          data-testid="button-save-case"
                        >
                          {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-6">
                    {/* Client Information */}
                    {client && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Client Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Name</label>
                            <p className="text-foreground">{client.firstName} {client.lastName}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <p className="text-foreground">{client.phone || "Not provided"}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-foreground">{client.email || "Not provided"}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Address</label>
                            <p className="text-foreground">{client.address || "Not provided"}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Case Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Case Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Case Number</label>
                          <p className="text-foreground font-mono">{caseData.caseNumber}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                          <div className="mt-1">{getStatusBadge(caseData.status)}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Arrest Date</label>
                          <p className="text-foreground">{formatDate(caseData.arrestDate)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Court Date</label>
                          <p className="text-foreground">{formatDateTime(caseData.courtDate)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Court Location</label>
                          <p className="text-foreground">{caseData.courtLocation || "Not specified"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Judge</label>
                          <p className="text-foreground">{caseData.judgeName || "Not assigned"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Prosecutor</label>
                          <p className="text-foreground">{caseData.prosecutorName || "Not specified"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Defense Attorney</label>
                          <p className="text-foreground">{caseData.defenseAttorney || "Not specified"}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">Charges</label>
                          <p className="text-foreground">{caseData.charges}</p>
                        </div>
                        {caseData.notes && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-muted-foreground">Notes</label>
                            <p className="text-foreground whitespace-pre-wrap">{caseData.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Case Documents</h3>
                  <Button
                    onClick={() => setUploadModalOpen(true)}
                    data-testid="button-upload-case-document"
                  >
                    <i className="fas fa-upload mr-2"></i>Upload Document
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {documents.length > 0 ? (
                    documents.map((document: any) => (
                      <Card key={document.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="mt-1">
                                <i className={getCategoryIcon(document.category)}></i>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-medium text-foreground truncate">
                                  {document.originalName}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {document.category.replace('_', ' ')} • {Math.round(document.fileSize / 1024)} KB
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Uploaded {formatDate(document.createdAt)}
                                </p>
                                {document.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {document.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                className="text-primary hover:text-primary/80" 
                                title="View"
                                data-testid={`button-view-document-${document.id}`}
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button 
                                className="text-muted-foreground hover:text-foreground" 
                                title="Download"
                                data-testid={`button-download-document-${document.id}`}
                              >
                                <i className="fas fa-download"></i>
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <i className="fas fa-file-alt text-4xl text-muted-foreground/50 mb-4"></i>
                        <h4 className="text-lg font-medium text-foreground mb-2">No documents yet</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload case documents like court papers, contracts, or evidence
                        </p>
                        <Button
                          onClick={() => setUploadModalOpen(true)}
                          data-testid="button-upload-first-document"
                        >
                          <i className="fas fa-upload mr-2"></i>Upload First Document
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Case Timeline</h3>
                
                <div className="space-y-4">
                  {activities.length > 0 ? (
                    activities.map((activity: any, index: number) => (
                      <div key={activity.id} className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <i className="fas fa-clock text-primary-foreground text-xs"></i>
                          </div>
                          {index < activities.length - 1 && (
                            <div className="w-px h-8 bg-border mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            {activity.action}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDateTime(activity.createdAt)}
                          </div>
                          {activity.details && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {JSON.stringify(activity.details)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <i className="fas fa-timeline text-4xl text-muted-foreground/50 mb-4"></i>
                        <h4 className="text-lg font-medium text-foreground mb-2">No timeline events yet</h4>
                        <p className="text-sm text-muted-foreground">
                          Case activities and milestones will appear here as they occur
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Case Notes</h3>
                
                {caseData.notes ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="whitespace-pre-wrap text-foreground">
                        {caseData.notes}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <i className="fas fa-sticky-note text-4xl text-muted-foreground/50 mb-4"></i>
                      <h4 className="text-lg font-medium text-foreground mb-2">No notes yet</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add notes to track important case information
                      </p>
                      <Button
                        onClick={() => setIsEditing(true)}
                        data-testid="button-add-notes"
                      >
                        <i className="fas fa-edit mr-2"></i>Add Notes
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Case not found</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Document Modal for this specific case */}
      <UploadDocumentModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        defaultRelatedType="case"
        defaultRelatedId={caseId}
      />
    </>
  );
}