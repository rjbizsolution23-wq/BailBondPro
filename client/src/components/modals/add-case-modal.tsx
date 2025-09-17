import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

const caseSchema = z.object({
  caseNumber: z.string().min(1, "Case number is required"),
  clientId: z.string().min(1, "Client is required"),
  charges: z.string().min(1, "Charges are required"),
  arrestDate: z.string().min(1, "Arrest date is required"),
  courtDate: z.string().optional(),
  courtLocation: z.string().optional(),
  judgeName: z.string().optional(),
  prosecutorName: z.string().optional(),
  defenseAttorney: z.string().optional(),
  notes: z.string().optional(),
});

type CaseFormData = z.infer<typeof caseSchema>;

interface AddCaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCaseModal({ open, onOpenChange }: AddCaseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      caseNumber: "",
      clientId: "",
      charges: "",
      arrestDate: "",
      courtDate: "",
      courtLocation: "",
      judgeName: "",
      prosecutorName: "",
      defenseAttorney: "",
      notes: "",
    },
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => api.getClients(),
  });

  const createCaseMutation = useMutation({
    mutationFn: (data: CaseFormData) => {
      return api.createCase(data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Case created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create case",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CaseFormData) => {
    createCaseMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="add-case-modal-title">Create New Case</DialogTitle>
        </DialogHeader>

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
                      <Input {...field} data-testid="input-case-number" />
                    </FormControl>
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
                      <Input type="date" {...field} data-testid="input-arrest-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
              name="charges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Charges</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} data-testid="input-charges" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="courtDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Court Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} data-testid="input-court-date" />
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
                      <Input {...field} data-testid="input-court-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="judgeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judge Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-judge-name" />
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
                    <FormLabel>Prosecutor</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-prosecutor-name" />
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
                      <Input {...field} data-testid="input-defense-attorney" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} data-testid="input-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCaseMutation.isPending}
                data-testid="button-create-case"
              >
                {createCaseMutation.isPending ? "Creating..." : "Create Case"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}