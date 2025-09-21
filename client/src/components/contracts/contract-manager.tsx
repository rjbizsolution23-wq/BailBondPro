import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileText, Download, Eye, Edit, Plus, Search, Filter } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

  // Fetch contract templates from API
  const { data: contractTemplates = [], isLoading: templatesLoading, error: templatesError } = useQuery<ContractTemplate[]>({
    queryKey: ['/api/contract-templates'],
  });

  // Download contract mutation
  const downloadContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      const response = await fetch(`/api/contracts/${contractId}/download`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract_${contractId}.html`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: language === 'es' ? 'Descarga exitosa' : 'Download successful',
        description: language === 'es' ? 'El contrato se ha descargado correctamente' : 'Contract downloaded successfully',
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: language === 'es' ? 'Error de descarga' : 'Download error',
        description: language === 'es' ? 'No se pudo descargar el contrato' : 'Failed to download contract',
      });
    }
  });

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

          {templatesLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">
                {language === 'es' ? 'Cargando plantillas...' : 'Loading templates...'}
              </div>
            </div>
          ) : templatesError ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-destructive">
                {language === 'es' ? 'Error al cargar las plantillas' : 'Error loading templates'}
              </div>
            </div>
          ) : (
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
                {filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {language === 'es' ? 'No se encontraron plantillas' : 'No templates found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template) => (
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
                        data-testid={`button-preview-${template.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-edit-${template.id}`}
                        onClick={() => {
                          toast({
                            title: language === 'es' ? 'Próximamente' : 'Coming Soon',
                            description: language === 'es' ? 'La edición de plantillas estará disponible pronto' : 'Template editing will be available soon',
                          });
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-download-${template.id}`}
                        onClick={() => {
                          toast({
                            title: language === 'es' ? 'Generar primero' : 'Generate First',
                            description: language === 'es' ? 'Primero genera un contrato para descargarlo' : 'Generate a contract first to download it',
                          });
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'es' ? 'Crear Nueva Plantilla' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              {language === 'es' 
                ? 'Cree una nueva plantilla de contrato para usar en documentos legales'
                : 'Create a new contract template to use in legal documents'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">
                  {language === 'es' ? 'Nombre (Inglés)' : 'Name (English)'}
                </Label>
                <Input
                  id="template-name"
                  placeholder={language === 'es' ? 'Ej: Acuerdo de Fianza' : 'e.g., Bail Agreement'}
                  data-testid="input-template-name"
                />
              </div>
              <div>
                <Label htmlFor="template-name-es">
                  {language === 'es' ? 'Nombre (Español)' : 'Name (Spanish)'}
                </Label>
                <Input
                  id="template-name-es"
                  placeholder={language === 'es' ? 'Ej: Bail Agreement' : 'e.g., Acuerdo de Fianza'}
                  data-testid="input-template-name-es"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="template-type">
                {language === 'es' ? 'Tipo de Contrato' : 'Contract Type'}
              </Label>
              <Select>
                <SelectTrigger data-testid="select-template-type">
                  <SelectValue placeholder={language === 'es' ? 'Seleccionar tipo' : 'Select type'} />
                </SelectTrigger>
                <SelectContent>
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
                  <SelectItem value="power-of-attorney">
                    {language === 'es' ? 'Poder Legal' : 'Power of Attorney'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-description">
                  {language === 'es' ? 'Descripción (Inglés)' : 'Description (English)'}
                </Label>
                <Textarea
                  id="template-description"
                  placeholder={language === 'es' ? 'Describa el propósito de esta plantilla...' : 'Describe the purpose of this template...'}
                  data-testid="textarea-template-description"
                />
              </div>
              <div>
                <Label htmlFor="template-description-es">
                  {language === 'es' ? 'Descripción (Español)' : 'Description (Spanish)'}
                </Label>
                <Textarea
                  id="template-description-es"
                  placeholder={language === 'es' ? 'Describe the purpose of this template...' : 'Describa el propósito de esta plantilla...'}
                  data-testid="textarea-template-description-es"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-content">
                  {language === 'es' ? 'Contenido (Inglés)' : 'Content (English)'}
                </Label>
                <Textarea
                  id="template-content"
                  rows={6}
                  placeholder={language === 'es' 
                    ? 'Ingrese el contenido del contrato en inglés...' 
                    : 'Enter the contract content in English...'}
                  data-testid="textarea-template-content"
                />
              </div>
              <div>
                <Label htmlFor="template-content-es">
                  {language === 'es' ? 'Contenido (Español)' : 'Content (Spanish)'}
                </Label>
                <Textarea
                  id="template-content-es"
                  rows={6}
                  placeholder={language === 'es' 
                    ? 'Enter the contract content in Spanish...' 
                    : 'Ingrese el contenido del contrato en español...'}
                  data-testid="textarea-template-content-es"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="template-variables">
                {language === 'es' ? 'Variables (separadas por coma)' : 'Variables (comma-separated)'}
              </Label>
              <Input
                id="template-variables"
                placeholder={language === 'es' 
                  ? 'clientName, bondAmount, courtDate' 
                  : 'clientName, bondAmount, courtDate'}
                data-testid="input-template-variables"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {language === 'es' 
                  ? 'Las variables se usarán como {{clientName}}, {{bondAmount}}, etc.'
                  : 'Variables will be used as {{clientName}}, {{bondAmount}}, etc.'}
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                data-testid="button-cancel-template"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button 
                data-testid="button-save-template"
                onClick={() => {
                  toast({
                    title: language === 'es' ? 'Próximamente' : 'Coming Soon',
                    description: language === 'es' 
                      ? 'La creación de plantillas estará disponible pronto' 
                      : 'Template creation will be available soon',
                  });
                  setShowCreateDialog(false);
                }}
              >
                {language === 'es' ? 'Crear Plantilla' : 'Create Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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