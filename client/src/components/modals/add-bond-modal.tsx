import { useState, useEffect } from "react";
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

const bondSchema = z.object({
  bondNumber: z.string().min(1, "Bond number is required"),
  clientId: z.string().min(1, "Client is required"),
  caseId: z.string().min(1, "Case is required"),
  bondAmount: z.string().min(1, "Bond amount is required"),
  premiumRate: z.string().min(1, "Premium rate is required"),
  collateralAmount: z.string().optional(),
  collateralDescription: z.string().optional(),
  issueDate: z.string().min(1, "Issue date is required"),
  agentId: z.string().nullable().optional(), // Nullable until auth is implemented
  notes: z.string().optional(),
}).refine(data => {
  const bondAmount = parseFloat(data.bondAmount);
  const premiumRate = parseFloat(data.premiumRate);
  return !isNaN(bondAmount) && !isNaN(premiumRate);
}, { message: "Bond amount and premium rate must be valid numbers" });

type BondFormData = z.infer<typeof bondSchema>;

interface AddBondModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBondModal({ open, onOpenChange }: AddBondModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BondFormData>({
    resolver: zodResolver(bondSchema),
    defaultValues: {
      bondNumber: "",
      clientId: "",
      caseId: "",
      bondAmount: "",
      premiumRate: "10.0", // Default 10%
      collateralAmount: "",
      collateralDescription: "",
      issueDate: new Date().toISOString().split('T')[0],
      agentId: null,
      notes: "",
    },
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => api.getClients(),
  });

  // Fetch cases for selected client
  const selectedClientId = form.watch("clientId");
  const { data: cases = [] } = useQuery({
    queryKey: ["/api/cases", selectedClientId],
    queryFn: () => api.getCases({ clientId: selectedClientId }),
    enabled: !!selectedClientId,
  });

  // Calculate premium amount when bond amount or rate changes
  const bondAmount = form.watch("bondAmount");
  const premiumRate = form.watch("premiumRate");
  const premiumAmount = bondAmount && premiumRate 
    ? (parseFloat(bondAmount) * parseFloat(premiumRate) / 100).toFixed(2)
    : "0.00";

  const createBondMutation = useMutation({
    mutationFn: (data: any) => {
      const bondData = {
        ...data,
        bondAmount: parseFloat(data.bondAmount),
        premiumAmount: parseFloat(premiumAmount),
        premiumRate: parseFloat(data.premiumRate) / 100, // Convert percentage to decimal
        collateralAmount: data.collateralAmount ? parseFloat(data.collateralAmount) : null,
      };
      return api.createBond(bondData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bond created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bonds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create bond",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BondFormData) => {
    createBondMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="add-bond-modal-title">Create New Bond</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bondNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bond Number</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-bond-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-issue-date" />
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
                    <SelectContent 
                      className="z-[9999]" 
                      position="popper"
                      sideOffset={5}
                    >
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id} data-testid={`client-option-${client.id}`}>
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
              name="caseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId}>
                    <FormControl>
                      <SelectTrigger data-testid="select-case">
                        <SelectValue placeholder={!selectedClientId ? "Select client first" : "Select case"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent 
                      className="z-[9999]" 
                      position="popper"
                      sideOffset={5}
                    >
                      {cases.map((case_: any) => (
                        <SelectItem key={case_.id} value={case_.id} data-testid={`case-option-${case_.id}`}>
                          {case_.caseNumber} - {case_.charges}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bondAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bond Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} data-testid="input-bond-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="premiumRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} data-testid="input-premium-rate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">Premium Amount</label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm" data-testid="text-premium-amount">
                  ${premiumAmount}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="collateralAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collateral Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} data-testid="input-collateral-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="collateralDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collateral Description</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-collateral-description" />
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
                disabled={createBondMutation.isPending}
                data-testid="button-create-bond"
              >
                {createBondMutation.isPending ? "Creating..." : "Create Bond"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
