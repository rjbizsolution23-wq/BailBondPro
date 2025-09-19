import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const documentSchema = z.object({
  category: z.string().min(1, "Category is required"),
  relatedType: z.string().optional(),
  relatedId: z.string().optional(),
  notes: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDocumentModal({ open, onOpenChange }: UploadDocumentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      category: "",
      relatedType: "",
      relatedId: "",
      notes: "",
    },
  });

  // Fetch clients for association
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => api.getClients(),
  });

  // Fetch cases for association
  const { data: cases = [] } = useQuery({
    queryKey: ["/api/cases"],
    queryFn: () => api.getCases(),
  });

  // Fetch bonds for association
  const { data: bonds = [] } = useQuery({
    queryKey: ["/api/bonds"],
    queryFn: () => api.getBonds(),
  });

  const selectedRelatedType = form.watch("relatedType");

  const getRelatedOptions = () => {
    switch (selectedRelatedType) {
      case "client":
        return clients.map((client: any) => ({
          value: client.id,
          label: `${client.firstName} ${client.lastName}`,
        }));
      case "case":
        return cases.map((case_: any) => ({
          value: case_.id,
          label: `${case_.caseNumber} - ${case_.charges}`,
        }));
      case "bond":
        return bonds.map((bond: any) => ({
          value: bond.id,
          label: `${bond.bondNumber} - ${bond.client_name || 'Unknown Client'}`,
        }));
      case "none":
        return [];
      default:
        return [];
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      if (selectedFiles.length === 0) {
        throw new Error("Please select at least one file to upload");
      }

      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append(`files`, file);
      });
      formData.append("category", data.category);
      if (data.relatedType && data.relatedType !== "none") formData.append("relatedType", data.relatedType);
      if (data.relatedId && data.relatedType !== "none") formData.append("relatedId", data.relatedId);
      if (data.notes) formData.append("notes", data.notes);

      return api.uploadDocuments(formData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${selectedFiles.length} document(s) uploaded successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      form.reset();
      setSelectedFiles([]);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload documents",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(file => {
        // Allow common document types
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/gif',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ];
        return allowedTypes.includes(file.type);
      });

      if (validFiles.length < fileArray.length) {
        toast({
          title: "Warning",
          description: "Some files were skipped. Only PDF, images, Word documents, and text files are allowed.",
          variant: "destructive",
        });
      }

      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onSubmit = (data: DocumentFormData) => {
    uploadMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="upload-document-modal-title">Upload Documents</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* File Upload Area */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-foreground">Files</label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center space-y-2">
                  <i className="fas fa-cloud-upload-alt text-3xl text-muted-foreground"></i>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop files here, or{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-select-files"
                    >
                      click to select
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: PDF, Images (JPG, PNG, GIF), Word documents, Text files
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  data-testid="input-file-upload"
                />
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Selected Files ({selectedFiles.length})
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                        data-testid={`selected-file-${index}`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <i className="fas fa-file text-sm text-muted-foreground"></i>
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          data-testid={`button-remove-file-${index}`}
                        >
                          <i className="fas fa-times text-xs"></i>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select document category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="contract">Contracts</SelectItem>
                      <SelectItem value="court_papers">Court Papers</SelectItem>
                      <SelectItem value="identification">Identification</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Associate with Record */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="relatedType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Associate with (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-related-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="case">Case</SelectItem>
                        <SelectItem value="bond">Bond</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedRelatedType && selectedRelatedType !== "none" && (
                <FormField
                  control={form.control}
                  name="relatedId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select {selectedRelatedType}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-related-record">
                            <SelectValue placeholder={`Select ${selectedRelatedType}`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getRelatedOptions().map((option: { value: string; label: string }) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Add any notes about these documents..."
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploadMutation.isPending || selectedFiles.length === 0}
                data-testid="button-upload"
              >
                {uploadMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload mr-2"></i>
                    Upload {selectedFiles.length > 0 ? `${selectedFiles.length} File(s)` : 'Files'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}