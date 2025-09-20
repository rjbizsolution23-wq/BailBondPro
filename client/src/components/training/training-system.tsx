import { useState, useEffect } from "react";
import { BookOpen, PlayCircle, CheckCircle, Award, Clock, Star, FileText, Video, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/language-context";

interface TrainingModule {
  id: string;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  category: 'legal-compliance' | 'system-usage' | 'client-service' | 'risk-management' | 'operations';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: string;
  progress: number; // 0-100
  sections: TrainingSection[];
}

interface TrainingSection {
  id: string;
  title: string;
  titleEs: string;
  type: 'video' | 'text' | 'quiz' | 'interactive';
  content: string;
  contentEs: string;
  isCompleted: boolean;
  duration: number;
}

interface SOP {
  id: string;
  title: string;
  titleEs: string;
  category: 'client-onboarding' | 'bond-processing' | 'payment-handling' | 'legal-compliance' | 'emergency-procedures';
  description: string;
  descriptionEs: string;
  content: string;
  contentEs: string;
  version: string;
  lastUpdated: string;
  isActive: boolean;
  steps: SOPStep[];
}

interface SOPStep {
  id: string;
  step: number;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  isRequired: boolean;
  estimatedTime: number;
  resources?: string[];
}

export function TrainingSystem() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("training");
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);

  // Mock training data
  const mockTrainingModules: TrainingModule[] = [
    {
      id: "module-1",
      title: "Bail Bonds Legal Framework",
      titleEs: "Marco Legal de Fianzas",
      description: "Understanding the legal foundation of bail bonds business",
      descriptionEs: "Comprenda el fundamento legal del negocio de fianzas",
      category: "legal-compliance",
      difficulty: "beginner",
      duration: 45,
      isRequired: true,
      isCompleted: false,
      progress: 0,
      sections: [
        {
          id: "section-1-1",
          title: "Introduction to Bail System",
          titleEs: "Introducción al Sistema de Fianzas",
          type: "video",
          content: "Overview of the US bail system and constitutional rights",
          contentEs: "Descripción general del sistema de fianzas de EE.UU. y derechos constitucionales",
          isCompleted: false,
          duration: 15
        },
        {
          id: "section-1-2",
          title: "State Regulations and Licensing",
          titleEs: "Regulaciones Estatales y Licencias",
          type: "text",
          content: "Understanding state-specific requirements and licensing procedures",
          contentEs: "Comprenda los requisitos específicos del estado y procedimientos de licencias",
          isCompleted: false,
          duration: 20
        },
        {
          id: "section-1-3",
          title: "Legal Compliance Quiz",
          titleEs: "Examen de Cumplimiento Legal",
          type: "quiz",
          content: "Test your knowledge of legal requirements",
          contentEs: "Pruebe su conocimiento de los requisitos legales",
          isCompleted: false,
          duration: 10
        }
      ]
    },
    {
      id: "module-2",
      title: "System Operation and Navigation",
      titleEs: "Operación y Navegación del Sistema",
      description: "Master the BailBond Pro system features and workflows",
      descriptionEs: "Domine las características y flujos de trabajo del sistema BailBond Pro",
      category: "system-usage",
      difficulty: "beginner",
      duration: 30,
      isRequired: true,
      isCompleted: false,
      progress: 25,
      sections: [
        {
          id: "section-2-1",
          title: "Dashboard Overview",
          titleEs: "Resumen del Panel",
          type: "interactive",
          content: "Navigate the main dashboard and key features",
          contentEs: "Navegue por el panel principal y características clave",
          isCompleted: true,
          duration: 10
        },
        {
          id: "section-2-2",
          title: "Client Management",
          titleEs: "Gestión de Clientes",
          type: "video",
          content: "Adding, editing, and managing client information",
          contentEs: "Agregar, editar y gestionar información de clientes",
          isCompleted: false,
          duration: 15
        },
        {
          id: "section-2-3",
          title: "AI Search Features",
          titleEs: "Características de Búsqueda IA",
          type: "interactive",
          content: "Using natural language search and AI assistance",
          contentEs: "Usar búsqueda de lenguaje natural y asistencia IA",
          isCompleted: false,
          duration: 5
        }
      ]
    },
    {
      id: "module-3",
      title: "Risk Assessment and Management",
      titleEs: "Evaluación y Gestión de Riesgos",
      description: "Learn to assess client risk and manage collateral effectively",
      descriptionEs: "Aprenda a evaluar el riesgo del cliente y gestionar garantías eficazmente",
      category: "risk-management",
      difficulty: "intermediate",
      duration: 60,
      isRequired: true,
      isCompleted: false,
      progress: 0,
      sections: [
        {
          id: "section-3-1",
          title: "Client Risk Factors",
          titleEs: "Factores de Riesgo del Cliente",
          type: "text",
          content: "Identifying and evaluating risk factors in potential clients",
          contentEs: "Identificar y evaluar factores de riesgo en clientes potenciales",
          isCompleted: false,
          duration: 25
        },
        {
          id: "section-3-2",
          title: "Collateral Evaluation",
          titleEs: "Evaluación de Garantías",
          type: "video",
          content: "Properly assessing and documenting collateral",
          contentEs: "Evaluar y documentar adecuadamente las garantías",
          isCompleted: false,
          duration: 20
        },
        {
          id: "section-3-3",
          title: "Risk Management Case Studies",
          titleEs: "Estudios de Caso de Gestión de Riesgos",
          type: "interactive",
          content: "Real-world scenarios and decision-making exercises",
          contentEs: "Escenarios del mundo real y ejercicios de toma de decisiones",
          isCompleted: false,
          duration: 15
        }
      ]
    }
  ];

  // Mock SOPs data
  const mockSOPs: SOP[] = [
    {
      id: "sop-1",
      title: "Client Intake and Onboarding",
      titleEs: "Recepción e Incorporación de Clientes",
      category: "client-onboarding",
      description: "Standard procedure for new client registration and verification",
      descriptionEs: "Procedimiento estándar para registro y verificación de nuevos clientes",
      content: `STANDARD OPERATING PROCEDURE: CLIENT INTAKE AND ONBOARDING

PURPOSE:
To ensure consistent, compliant, and thorough onboarding of all new clients.

SCOPE:
This procedure applies to all new clients seeking bail bond services.

RESPONSIBILITIES:
- Front desk staff: Initial contact and basic information collection
- Licensed agents: Risk assessment and contract execution
- Management: Final approval for high-risk cases

PROCEDURE:
See detailed steps below.

DOCUMENTATION REQUIRED:
- Government-issued photo ID
- Proof of residence
- Employment verification
- Financial information
- Emergency contact details`,
      contentEs: `PROCEDIMIENTO OPERATIVO ESTÁNDAR: RECEPCIÓN E INCORPORACIÓN DE CLIENTES

PROPÓSITO:
Asegurar la incorporación consistente, conforme y completa de todos los nuevos clientes.

ALCANCE:
Este procedimiento se aplica a todos los nuevos clientes que buscan servicios de fianza.

RESPONSABILIDADES:
- Personal de recepción: Contacto inicial y recolección de información básica
- Agentes licenciados: Evaluación de riesgo y ejecución de contratos
- Gerencia: Aprobación final para casos de alto riesgo

PROCEDIMIENTO:
Ver pasos detallados a continuación.

DOCUMENTACIÓN REQUERIDA:
- Identificación con foto emitida por el gobierno
- Comprobante de residencia
- Verificación de empleo
- Información financiera
- Detalles de contacto de emergencia`,
      version: "2.1",
      lastUpdated: "2024-01-15",
      isActive: true,
      steps: [
        {
          id: "step-1-1",
          step: 1,
          title: "Initial Contact",
          titleEs: "Contacto Inicial",
          description: "Receive call or walk-in client, gather basic case information",
          descriptionEs: "Recibir llamada o cliente que llega, recopilar información básica del caso",
          isRequired: true,
          estimatedTime: 10,
          resources: ["intake-form.pdf", "case-checklist.pdf"]
        },
        {
          id: "step-1-2",
          step: 2,
          title: "Identity Verification",
          titleEs: "Verificación de Identidad",
          description: "Verify client identity with government-issued photo ID",
          descriptionEs: "Verificar identidad del cliente con identificación con foto emitida por el gobierno",
          isRequired: true,
          estimatedTime: 5,
          resources: ["id-verification-guide.pdf"]
        },
        {
          id: "step-1-3",
          step: 3,
          title: "Risk Assessment",
          titleEs: "Evaluación de Riesgo",
          description: "Conduct comprehensive risk assessment using standardized criteria",
          descriptionEs: "Realizar evaluación integral de riesgo usando criterios estandarizados",
          isRequired: true,
          estimatedTime: 20,
          resources: ["risk-assessment-form.pdf", "scoring-matrix.pdf"]
        },
        {
          id: "step-1-4",
          step: 4,
          title: "Financial Verification",
          titleEs: "Verificación Financiera",
          description: "Verify client's financial capacity and collect required documentation",
          descriptionEs: "Verificar capacidad financiera del cliente y recopilar documentación requerida",
          isRequired: true,
          estimatedTime: 15,
          resources: ["financial-checklist.pdf"]
        },
        {
          id: "step-1-5",
          step: 5,
          title: "Contract Execution",
          titleEs: "Ejecución del Contrato",
          description: "Complete all necessary contracts and legal documents",
          descriptionEs: "Completar todos los contratos necesarios y documentos legales",
          isRequired: true,
          estimatedTime: 25,
          resources: ["bond-agreement.pdf", "indemnity-agreement.pdf"]
        }
      ]
    },
    {
      id: "sop-2",
      title: "Emergency Procedures - Client Non-Appearance",
      titleEs: "Procedimientos de Emergencia - No Comparecencia del Cliente",
      category: "emergency-procedures",
      description: "Actions to take when a client fails to appear in court",
      descriptionEs: "Acciones a tomar cuando un cliente no comparece en corte",
      content: `STANDARD OPERATING PROCEDURE: CLIENT NON-APPEARANCE

PURPOSE:
To minimize financial loss and legal complications when a client fails to appear in court.

IMMEDIATE ACTIONS REQUIRED:
This is a time-sensitive procedure that must be initiated immediately upon notification of non-appearance.

LEGAL IMPLICATIONS:
Failure to follow this procedure may result in bond forfeiture and significant financial loss.

TIMELINE:
All initial steps must be completed within 24 hours of notification.`,
      contentEs: `PROCEDIMIENTO OPERATIVO ESTÁNDAR: NO COMPARECENCIA DEL CLIENTE

PROPÓSITO:
Minimizar la pérdida financiera y complicaciones legales cuando un cliente no comparece en corte.

ACCIONES INMEDIATAS REQUERIDAS:
Este es un procedimiento sensible al tiempo que debe iniciarse inmediatamente al ser notificado de la no comparecencia.

IMPLICACIONES LEGALES:
No seguir este procedimiento puede resultar en pérdida de fianza y pérdida financiera significativa.

CRONOGRAMA:
Todos los pasos iniciales deben completarse dentro de 24 horas de la notificación.`,
      version: "1.5",
      lastUpdated: "2024-01-10",
      isActive: true,
      steps: [
        {
          id: "step-2-1",
          step: 1,
          title: "Immediate Notification Response",
          titleEs: "Respuesta Inmediata a Notificación",
          description: "Acknowledge court notification and document time of receipt",
          descriptionEs: "Confirmar notificación del tribunal y documentar hora de recepción",
          isRequired: true,
          estimatedTime: 5,
          resources: ["notification-log.pdf"]
        },
        {
          id: "step-2-2",
          step: 2,
          title: "Client Contact Attempt",
          titleEs: "Intento de Contacto con Cliente",
          description: "Attempt to contact client and indemnitor through all available means",
          descriptionEs: "Intentar contactar al cliente e indemnizador por todos los medios disponibles",
          isRequired: true,
          estimatedTime: 30,
          resources: ["contact-log-template.pdf", "emergency-contacts.pdf"]
        },
        {
          id: "step-2-3",
          step: 3,
          title: "Recovery Agent Deployment",
          titleEs: "Despliegue de Agente de Recuperación",
          description: "If unable to locate client, engage licensed recovery agent",
          descriptionEs: "Si no puede localizar al cliente, contratar agente de recuperación licenciado",
          isRequired: true,
          estimatedTime: 60,
          resources: ["recovery-agent-list.pdf", "deployment-authorization.pdf"]
        }
      ]
    }
  ];

  useEffect(() => {
    setTrainingModules(mockTrainingModules);
    setSops(mockSOPs);
  }, []);

  const getCategoryLabel = (category: string) => {
    const labels = {
      'legal-compliance': language === 'es' ? 'Cumplimiento Legal' : 'Legal Compliance',
      'system-usage': language === 'es' ? 'Uso del Sistema' : 'System Usage',
      'client-service': language === 'es' ? 'Servicio al Cliente' : 'Client Service',
      'risk-management': language === 'es' ? 'Gestión de Riesgos' : 'Risk Management',
      'operations': language === 'es' ? 'Operaciones' : 'Operations',
      'client-onboarding': language === 'es' ? 'Incorporación de Clientes' : 'Client Onboarding',
      'bond-processing': language === 'es' ? 'Procesamiento de Fianzas' : 'Bond Processing',
      'payment-handling': language === 'es' ? 'Manejo de Pagos' : 'Payment Handling',
      'emergency-procedures': language === 'es' ? 'Procedimientos de Emergencia' : 'Emergency Procedures'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'beginner': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'intermediate': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'advanced': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[difficulty as keyof typeof colors] || colors.beginner;
  };

  const completedModulesCount = trainingModules.filter(m => m.isCompleted).length;
  const totalRequiredModules = trainingModules.filter(m => m.isRequired).length;
  const overallProgress = trainingModules.length > 0 ? 
    trainingModules.reduce((acc, module) => acc + module.progress, 0) / trainingModules.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {language === 'es' ? 'Sistema de Entrenamiento y SOPs' : 'Training System & SOPs'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'es' 
              ? 'Módulos de entrenamiento y procedimientos operativos estándar'
              : 'Training modules and standard operating procedures'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {completedModulesCount} / {trainingModules.length} {language === 'es' ? 'completados' : 'completed'}
          </Badge>
          <Badge variant="outline">
            {Math.round(overallProgress)}% {language === 'es' ? 'progreso' : 'progress'}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="training" data-testid="tab-training">
            <BookOpen className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Entrenamiento' : 'Training'}
          </TabsTrigger>
          <TabsTrigger value="sops" data-testid="tab-sops">
            <FileText className="h-4 w-4 mr-2" />
            {language === 'es' ? 'SOPs' : 'SOPs'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-6">
          {/* Training Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>{language === 'es' ? 'Progreso de Entrenamiento' : 'Training Progress'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{language === 'es' ? 'Progreso General' : 'Overall Progress'}</span>
                    <span>{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{trainingModules.length}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'es' ? 'Total Módulos' : 'Total Modules'}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{completedModulesCount}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'es' ? 'Completados' : 'Completed'}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{totalRequiredModules}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'es' ? 'Requeridos' : 'Required'}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(trainingModules.reduce((acc, m) => acc + m.duration, 0) / 60)}h
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'es' ? 'Tiempo Total' : 'Total Time'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Modules */}
          <div className="grid gap-6">
            {trainingModules.map((module) => (
              <Card key={module.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2">
                        {module.isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <PlayCircle className="h-5 w-5 text-blue-600" />
                        )}
                        <span>{language === 'es' ? module.titleEs : module.title}</span>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {language === 'es' ? module.descriptionEs : module.description}
                      </CardDescription>
                      <div className="flex items-center space-x-4 mt-3">
                        <Badge className={getDifficultyColor(module.difficulty)}>
                          {module.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          {getCategoryLabel(module.category)}
                        </Badge>
                        {module.isRequired && (
                          <Badge variant="destructive">
                            {language === 'es' ? 'Requerido' : 'Required'}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {module.duration} {language === 'es' ? 'min' : 'min'}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedModule(module)}
                      data-testid={`button-start-module-${module.id}`}
                    >
                      {module.progress > 0 
                        ? (language === 'es' ? 'Continuar' : 'Continue')
                        : (language === 'es' ? 'Iniciar' : 'Start')
                      }
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{language === 'es' ? 'Progreso' : 'Progress'}</span>
                        <span>{module.progress}%</span>
                      </div>
                      <Progress value={module.progress} className="h-2" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {module.sections.length} {language === 'es' ? 'secciones' : 'sections'} • 
                      {module.sections.filter(s => s.isCompleted).length} {language === 'es' ? 'completadas' : 'completed'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sops" className="space-y-6">
          <div className="grid gap-6">
            {sops.map((sop) => (
              <Card key={sop.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>{language === 'es' ? sop.titleEs : sop.title}</span>
                        <Badge variant={sop.isActive ? "default" : "secondary"}>
                          v{sop.version}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {language === 'es' ? sop.descriptionEs : sop.description}
                      </CardDescription>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="outline">
                          {getCategoryLabel(sop.category)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {language === 'es' ? 'Actualizado:' : 'Updated:'} {new Date(sop.lastUpdated).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    <AccordionItem value={`overview-${sop.id}`}>
                      <AccordionTrigger>
                        {language === 'es' ? 'Resumen del Procedimiento' : 'Procedure Overview'}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="prose dark:prose-invert max-w-none text-sm">
                          <pre className="whitespace-pre-wrap">
                            {language === 'es' ? sop.contentEs : sop.content}
                          </pre>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value={`steps-${sop.id}`}>
                      <AccordionTrigger>
                        {language === 'es' ? 'Pasos Detallados' : 'Detailed Steps'} ({sop.steps.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          {sop.steps.map((step) => (
                            <Card key={step.id} className="border-l-4 border-l-blue-500">
                              <CardContent className="pt-4">
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                                      {step.step}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm">
                                      {language === 'es' ? step.titleEs : step.title}
                                      {step.isRequired && (
                                        <Badge variant="destructive" className="ml-2 text-xs">
                                          {language === 'es' ? 'Requerido' : 'Required'}
                                        </Badge>
                                      )}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {language === 'es' ? step.descriptionEs : step.description}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-2">
                                      <span className="text-xs text-muted-foreground flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {step.estimatedTime} {language === 'es' ? 'min' : 'min'}
                                      </span>
                                      {step.resources && step.resources.length > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                          {step.resources.length} {language === 'es' ? 'recursos' : 'resources'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}