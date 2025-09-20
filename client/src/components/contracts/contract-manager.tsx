import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileText, Download, Eye, Edit, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";

interface ContractTemplate {
  id: string;
  name: string;
  nameEs: string;
  type: 'bail-agreement' | 'indemnity' | 'collateral' | 'payment-plan' | 'power-of-attorney';
  description: string;
  descriptionEs: string;
  content: string;
  contentEs: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GeneratedContract {
  id: string;
  templateId: string;
  clientId: string;
  clientName: string;
  caseId?: string;
  bondId?: string;
  content: string;
  status: 'draft' | 'sent' | 'signed' | 'executed';
  createdAt: string;
  signedAt?: string;
  variables: Record<string, any>;
}

export function ContractManager() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);

  // Mock data - In production, these would come from your API
  const contractTemplates: ContractTemplate[] = [
    {
      id: "1",
      name: "Bail Bond Agreement",
      nameEs: "Acuerdo de Fianza",
      type: "bail-agreement",
      description: "Standard bail bond agreement contract",
      descriptionEs: "Contrato estándar de acuerdo de fianza",
      content: `BAIL BOND AGREEMENT

This agreement is entered into between \{\{AGENCY_NAME\}\} (the "Surety") and \{\{CLIENT_NAME\}\} (the "Indemnitor") on \{\{DATE\}\}.

TERMS AND CONDITIONS:
1. Bond Amount: $\{\{BOND_AMOUNT\}\}
2. Premium: $\{\{PREMIUM_AMOUNT\}\} (\{\{PREMIUM_PERCENTAGE\}\}% of bond amount)
3. Court Date: \{\{COURT_DATE\}\}
4. Case Number: \{\{CASE_NUMBER\}\}

OBLIGATIONS:
- The defendant must appear at all court hearings
- Premium is fully earned and non-refundable
- Indemnitor is responsible for all costs if defendant fails to appear
- GPS monitoring and check-ins may be required

By signing below, all parties agree to the terms stated herein.

Surety: _____________________     Date: ___________
Indemnitor: _________________     Date: ___________
Defendant: __________________     Date: ___________`,
      contentEs: `ACUERDO DE FIANZA

Este acuerdo se celebra entre \{\{AGENCY_NAME\}\} (el "Fiador") y \{\{CLIENT_NAME\}\} (el "Indemnizador") el \{\{DATE\}\}.

TÉRMINOS Y CONDICIONES:
1. Monto de la Fianza: $\{\{BOND_AMOUNT\}\}
2. Prima: $\{\{PREMIUM_AMOUNT\}\} (\{\{PREMIUM_PERCENTAGE\}\}% del monto de la fianza)
3. Fecha de Corte: \{\{COURT_DATE\}\}
4. Número de Caso: \{\{CASE_NUMBER\}\}

OBLIGACIONES:
- El acusado debe comparecer a todas las audiencias judiciales
- La prima se devenga completamente y no es reembolsable
- El Indemnizador es responsable de todos los costos si el acusado no comparece
- Puede requerirse monitoreo GPS y registros

Al firmar abajo, todas las partes aceptan los términos establecidos aquí.

Fiador: _____________________     Fecha: ___________
Indemnizador: _______________     Fecha: ___________
Acusado: ___________________     Fecha: ___________`,
      variables: ["AGENCY_NAME", "CLIENT_NAME", "DATE", "BOND_AMOUNT", "PREMIUM_AMOUNT", "PREMIUM_PERCENTAGE", "COURT_DATE", "CASE_NUMBER"],
      isActive: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-15"
    },
    {
      id: "2",
      name: "Indemnity Agreement",
      nameEs: "Acuerdo de Indemnización",
      type: "indemnity",
      description: "Comprehensive indemnity and security agreement",
      descriptionEs: "Acuerdo integral de indemnización y seguridad",
      content: `INDEMNITY AND SECURITY AGREEMENT\n\nThe undersigned \{\{INDEMNITOR_NAME\}\} hereby agrees to indemnify and hold harmless \{\{AGENCY_NAME\}\} from any and all losses, costs, damages, and expenses that may be incurred in connection with the bail bond posted for \{\{DEFENDANT_NAME\}\}.\n\nSECURITY PROVISIONS:\n1. Collateral Description: \{\{COLLATERAL_DESCRIPTION\}\}\n2. Estimated Value: $\{\{COLLATERAL_VALUE\}\}\n3. Location: \{\{COLLATERAL_LOCATION\}\}\n\nINDEMNIFICATION:\nIndemnitor agrees to pay all costs including but not limited to:\n- Bail bond forfeiture\n- Attorney fees\n- Investigation costs\n- Recovery expenses\n- Court costs and fees\n\nThis agreement shall remain in effect until the bail bond is exonerated or discharged.\n\nIndemnitor: ____________________     Date: ___________\nWitness: ______________________     Date: ___________`,
      contentEs: `ACUERDO DE INDEMNIZACIÓN Y SEGURIDAD\n\nEl suscrito \{\{INDEMNITOR_NAME\}\} por la presente acepta indemnizar y eximir de responsabilidad a \{\{AGENCY_NAME\}\} de todas las pérdidas, costos, daños y gastos que puedan incurrirse en relación con la fianza otorgada para \{\{DEFENDANT_NAME\}\}.\n\nPROVISIONES DE SEGURIDAD:\n1. Descripción de Garantía: \{\{COLLATERAL_DESCRIPTION\}\}\n2. Valor Estimado: $\{\{COLLATERAL_VALUE\}\}\n3. Ubicación: \{\{COLLATERAL_LOCATION\}\}\n\nINDEMNIZACIÓN:\nEl Indemnizador acepta pagar todos los costos incluyendo pero no limitado a:\n- Pérdida de fianza\n- Honorarios de abogado\n- Costos de investigación\n- Gastos de recuperación\n- Costos y honorarios judiciales\n\nEste acuerdo permanecerá en vigencia hasta que la fianza sea exonerada o liberada.\n\nIndemnizador: ________________     Fecha: ___________\nTestigo: ____________________     Fecha: ___________`,
      variables: ["INDEMNITOR_NAME", "AGENCY_NAME", "DEFENDANT_NAME", "COLLATERAL_DESCRIPTION", "COLLATERAL_VALUE", "COLLATERAL_LOCATION"],
      isActive: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-10"
    },
    {
      id: "3",
      name: "Payment Plan Agreement",
      nameEs: "Acuerdo de Plan de Pago",
      type: "payment-plan",
      description: "Structured payment plan for premium and fees",
      descriptionEs: "Plan de pago estructurado para prima y honorarios",
      content: `PAYMENT PLAN AGREEMENT\n\nClient: \{\{CLIENT_NAME\}\}\nCase: \{\{CASE_NUMBER\}\}\nTotal Amount Due: $\{\{TOTAL_AMOUNT\}\}\n\nPAYMENT SCHEDULE:\nDown Payment: $\{\{DOWN_PAYMENT\}\} - Due: \{\{DOWN_PAYMENT_DATE\}\}\n\{\{#INSTALLMENTS\}\}\nPayment \{\{INSTALLMENT_NUMBER\}\}: $\{\{INSTALLMENT_AMOUNT\}\} - Due: \{\{INSTALLMENT_DATE\}\}\n\{\{/INSTALLMENTS\}\}\n\nTERMS:\n- Late fee of $\{\{LATE_FEE\}\} applies for payments more than \{\{GRACE_DAYS\}\} days late\n- Default occurs after \{\{DEFAULT_DAYS\}\} days of non-payment\n- Upon default, full balance becomes immediately due\n- Client remains responsible for all court appearances regardless of payment status\n\nClient Signature: ________________     Date: ___________\nAgency Representative: ___________     Date: ___________`,
      contentEs: `ACUERDO DE PLAN DE PAGO\n\nCliente: \{\{CLIENT_NAME\}\}\nCaso: \{\{CASE_NUMBER\}\}\nMonto Total Adeudado: $\{\{TOTAL_AMOUNT\}\}\n\nCRONOGRAMA DE PAGOS:\nPago Inicial: $\{\{DOWN_PAYMENT\}\} - Vence: \{\{DOWN_PAYMENT_DATE\}\}\n\{\{#INSTALLMENTS\}\}\nPago \{\{INSTALLMENT_NUMBER\}\}: $\{\{INSTALLMENT_AMOUNT\}\} - Vence: \{\{INSTALLMENT_DATE\}\}\n\{\{/INSTALLMENTS\}\}\n\nTÉRMINOS:\n- Se aplica un recargo por mora de $\{\{LATE_FEE\}\} para pagos con más de \{\{GRACE_DAYS\}\} días de retraso\n- El incumplimiento ocurre después de \{\{DEFAULT_DAYS\}\} días de falta de pago\n- Al incumplir, el saldo total vence inmediatamente\n- El cliente sigue siendo responsable de todas las comparecencias judiciales independientemente del estado de pago\n\nFirma del Cliente: ______________     Fecha: ___________\nRepresentante de la Agencia: ____     Fecha: ___________`,
      variables: ["CLIENT_NAME", "CASE_NUMBER", "TOTAL_AMOUNT", "DOWN_PAYMENT", "DOWN_PAYMENT_DATE", "LATE_FEE", "GRACE_DAYS", "DEFAULT_DAYS"],
      isActive: true,
      createdAt: "2024-01-05",
      updatedAt: "2024-01-20"
    }
  ];

  const filteredTemplates = contractTemplates.filter(template => {
    const matchesSearch = !searchTerm || 
      (language === 'es' ? template.nameEs : template.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (language === 'es' ? template.descriptionEs : template.description).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !typeFilter || typeFilter === "all" || template.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getTypeLabel = (type: string) => {
    const labels = {
      'bail-agreement': language === 'es' ? 'Acuerdo de Fianza' : 'Bail Agreement',
      'indemnity': language === 'es' ? 'Indemnización' : 'Indemnity',
      'collateral': language === 'es' ? 'Garantía' : 'Collateral',
      'payment-plan': language === 'es' ? 'Plan de Pago' : 'Payment Plan',
      'power-of-attorney': language === 'es' ? 'Poder Legal' : 'Power of Attorney'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'bail-agreement': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'indemnity': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'collateral': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'payment-plan': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'power-of-attorney': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {language === 'es' ? 'Gestión de Contratos' : 'Contract Management'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'es' 
              ? 'Genere y gestione contratos legales precisos para su negocio'
              : 'Generate and manage accurate legal contracts for your business'
            }
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {language === 'es' ? 'Nueva Plantilla' : 'New Template'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'es' ? 'Plantillas de Contratos' : 'Contract Templates'}
          </CardTitle>
          <CardDescription>
            {language === 'es' 
              ? 'Gestione plantillas de contratos y genere documentos personalizados'
              : 'Manage contract templates and generate personalized documents'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'es' ? 'Buscar plantillas...' : 'Search templates...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={language === 'es' ? 'Tipo de contrato' : 'Contract type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === 'es' ? 'Todos los tipos' : 'All types'}
                </SelectItem>
                <SelectItem value="bail-agreement">
                  {language === 'es' ? 'Acuerdo de Fianza' : 'Bail Agreement'}
                </SelectItem>
                <SelectItem value="indemnity">
                  {language === 'es' ? 'Indemnización' : 'Indemnity'}
                </SelectItem>
                <SelectItem value="collateral">
                  {language === 'es' ? 'Garantía' : 'Collateral'}
                </SelectItem>
                <SelectItem value="payment-plan">
                  {language === 'es' ? 'Plan de Pago' : 'Payment Plan'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'es' ? 'Nombre' : 'Name'}</TableHead>
                <TableHead>{language === 'es' ? 'Tipo' : 'Type'}</TableHead>
                <TableHead>{language === 'es' ? 'Descripción' : 'Description'}</TableHead>
                <TableHead>{language === 'es' ? 'Variables' : 'Variables'}</TableHead>
                <TableHead>{language === 'es' ? 'Estado' : 'Status'}</TableHead>
                <TableHead>{language === 'es' ? 'Acciones' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    {language === 'es' ? template.nameEs : template.name}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(template.type)}>
                      {getTypeLabel(template.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {language === 'es' ? template.descriptionEs : template.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{template.variables.length} vars</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive 
                        ? (language === 'es' ? 'Activo' : 'Active')
                        : (language === 'es' ? 'Inactivo' : 'Inactive')
                      }
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Template Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate && (language === 'es' ? selectedTemplate.nameEs : selectedTemplate?.name)}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate && (language === 'es' ? selectedTemplate.descriptionEs : selectedTemplate?.description)}
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">
                  {language === 'es' ? 'Variables disponibles:' : 'Available variables:'}
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTemplate.variables.map((variable) => (
                    <Badge key={variable} variant="outline">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  {language === 'es' ? 'Vista previa del contrato:' : 'Contract preview:'}
                </Label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">
                    {language === 'es' ? selectedTemplate.contentEs : selectedTemplate.content}
                  </pre>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                  {language === 'es' ? 'Cerrar' : 'Close'}
                </Button>
                <Button>
                  {language === 'es' ? 'Generar Contrato' : 'Generate Contract'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}