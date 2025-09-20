import { useState, useEffect } from "react";
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Book, FileText, Users, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/language-context";

interface OnboardingStep {
  id: string;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  isCompleted: boolean;
  isRequired: boolean;
}

export function OnboardingWizard({ onComplete }: { onComplete?: () => void }) {
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to BailBond Pro',
      titleEs: 'Bienvenido a BailBond Pro',
      description: 'Learn the basics of your new bail bonds management system',
      descriptionEs: 'Aprende los conceptos básicos de tu nuevo sistema de gestión de fianzas',
      icon: <Book className="h-6 w-6" />,
      component: <WelcomeStep />,
      isCompleted: false,
      isRequired: true
    },
    {
      id: 'setup',
      title: 'System Setup',
      titleEs: 'Configuración del Sistema',
      description: 'Configure your company information and preferences',
      descriptionEs: 'Configura la información de tu empresa y preferencias',
      icon: <FileText className="h-6 w-6" />,
      component: <SystemSetupStep />,
      isCompleted: false,
      isRequired: true
    },
    {
      id: 'clients',
      title: 'Client Management',
      titleEs: 'Gestión de Clientes',
      description: 'Learn how to add and manage clients',
      descriptionEs: 'Aprende cómo agregar y gestionar clientes',
      icon: <Users className="h-6 w-6" />,
      component: <ClientManagementStep />,
      isCompleted: false,
      isRequired: true
    },
    {
      id: 'bonds',
      title: 'Bond Processing',
      titleEs: 'Procesamiento de Fianzas',
      description: 'Understanding the bond creation and tracking process',
      descriptionEs: 'Comprende el proceso de creación y seguimiento de fianzas',
      icon: <CreditCard className="h-6 w-6" />,
      component: <BondProcessingStep />,
      isCompleted: false,
      isRequired: true
    },
    {
      id: 'sops',
      title: 'Standard Operating Procedures',
      titleEs: 'Procedimientos Operativos Estándar',
      description: 'Review essential SOPs and compliance requirements',
      descriptionEs: 'Revisa los POE esenciales y requisitos de cumplimiento',
      icon: <CheckCircle className="h-6 w-6" />,
      component: <SOPsStep />,
      isCompleted: false,
      isRequired: true
    }
  ];

  const [currentSteps, setCurrentSteps] = useState(steps);
  const progress = (completedSteps.size / steps.length) * 100;

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => new Set([...Array.from(prev), stepId]));
    setCurrentSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, isCompleted: true } : step
      )
    );
  };

  const canProceed = currentSteps[currentStep]?.isCompleted || !currentSteps[currentStep]?.isRequired;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
    } else if (completedSteps.size === steps.length) {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const currentStepData = currentSteps[currentStep];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {language === 'es' ? 'Configuración Inicial' : 'Initial Setup'}
        </h1>
        <p className="text-muted-foreground mb-4">
          {language === 'es' 
            ? 'Complete estos pasos para configurar completamente su sistema'
            : 'Complete these steps to fully set up your system'
          }
        </p>
        <Progress value={progress} className="w-full" />
        <p className="text-sm text-muted-foreground mt-2">
          {completedSteps.size} {language === 'es' ? 'de' : 'of'} {steps.length} {language === 'es' ? 'pasos completados' : 'steps completed'}
        </p>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-center mb-8 overflow-x-auto">
        <div className="flex items-center space-x-4">
          {currentSteps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index < currentSteps.length - 1 ? 'after:w-8 after:h-px after:bg-border after:ml-4' : ''
              }`}
            >
              <div
                className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : step.isCompleted
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                {step.isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
                <span className="text-sm font-medium hidden md:block">
                  {language === 'es' ? step.titleEs : step.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {currentStepData.icon}
            </div>
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>{language === 'es' ? currentStepData.titleEs : currentStepData.title}</span>
                {currentStepData.isRequired && (
                  <Badge variant="destructive" className="text-xs">
                    {language === 'es' ? 'Requerido' : 'Required'}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {language === 'es' ? currentStepData.descriptionEs : currentStepData.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StepWrapper
            stepId={currentStepData.id}
            onComplete={() => markStepCompleted(currentStepData.id)}
          >
            {currentStepData.component}
          </StepWrapper>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'es' ? 'Anterior' : 'Previous'}
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!canProceed}
        >
          {isLastStep ? (language === 'es' ? 'Completar' : 'Complete') : (language === 'es' ? 'Siguiente' : 'Next')}
          {!isLastStep && <ArrowRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}

// Step wrapper to handle completion logic
function StepWrapper({ 
  children, 
  stepId, 
  onComplete 
}: { 
  children: React.ReactNode; 
  stepId: string; 
  onComplete: () => void; 
}) {
  return (
    <div>
      {children}
      <div className="mt-6">
        <Button onClick={onComplete}>
          Mark Step Complete
        </Button>
      </div>
    </div>
  );
}

// Individual Step Components
function WelcomeStep() {
  const { t, language } = useLanguage();
  
  return (
    <div className="space-y-6">
      <div className="prose dark:prose-invert max-w-none">
        <h3>{language === 'es' ? 'Bienvenido a su Sistema de Gestión de Fianzas' : 'Welcome to Your Bail Bonds Management System'}</h3>
        <p>
          {language === 'es' 
            ? 'Este sistema le ayudará a gestionar eficientemente todos los aspectos de su negocio de fianzas:'
            : 'This system will help you efficiently manage all aspects of your bail bonds business:'
          }
        </p>
        <ul>
          <li>{language === 'es' ? 'Gestión completa de clientes' : 'Complete client management'}</li>
          <li>{language === 'es' ? 'Seguimiento de casos y fechas de corte' : 'Case tracking and court dates'}</li>
          <li>{language === 'es' ? 'Procesamiento de fianzas y pagos' : 'Bond processing and payments'}</li>
          <li>{language === 'es' ? 'Gestión de documentos legales' : 'Legal document management'}</li>
          <li>{language === 'es' ? 'Registro de clientes con verificación de fotos' : 'Client check-ins with photo verification'}</li>
          <li>{language === 'es' ? 'Búsqueda inteligente con IA' : 'AI-powered intelligent search'}</li>
        </ul>
        <p>
          {language === 'es'
            ? 'El sistema está completamente traducido al español e inglés para servir mejor a sus clientes.'
            : 'The system is fully translated to Spanish and English to better serve your clients.'
          }
        </p>
      </div>
    </div>
  );
}

function SystemSetupStep() {
  const { language } = useLanguage();
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        {language === 'es' ? 'Configuración de la Empresa' : 'Company Setup'}
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {language === 'es' ? 'Información de la Empresa' : 'Company Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• {language === 'es' ? 'Nombre de la empresa' : 'Company name'}</li>
              <li>• {language === 'es' ? 'Información de contacto' : 'Contact information'}</li>
              <li>• {language === 'es' ? 'Número de licencia' : 'License number'}</li>
              <li>• {language === 'es' ? 'Logo y marca' : 'Logo and branding'}</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {language === 'es' ? 'Configuración del Sistema' : 'System Configuration'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• {language === 'es' ? 'Tarifas y comisiones' : 'Fees and commissions'}</li>
              <li>• {language === 'es' ? 'Configuración de pagos' : 'Payment settings'}</li>
              <li>• {language === 'es' ? 'Plantillas de documentos' : 'Document templates'}</li>
              <li>• {language === 'es' ? 'Configuración de notificaciones' : 'Notification settings'}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClientManagementStep() {
  const { language } = useLanguage();
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        {language === 'es' ? 'Gestión de Clientes' : 'Client Management'}
      </h3>
      <div className="prose dark:prose-invert max-w-none">
        <h4>{language === 'es' ? 'Proceso de Incorporación de Clientes:' : 'Client Onboarding Process:'}</h4>
        <ol>
          <li>{language === 'es' ? 'Recopilar información personal y de contacto' : 'Collect personal and contact information'}</li>
          <li>{language === 'es' ? 'Verificar identificación y antecedentes' : 'Verify identification and background'}</li>
          <li>{language === 'es' ? 'Documentar información del contacto de emergencia' : 'Document emergency contact information'}</li>
          <li>{language === 'es' ? 'Configurar el sistema de registro con fotos y GPS' : 'Set up photo and GPS check-in system'}</li>
          <li>{language === 'es' ? 'Explicar las obligaciones y requisitos' : 'Explain obligations and requirements'}</li>
        </ol>
        
        <h4>{language === 'es' ? 'Características Clave:' : 'Key Features:'}</h4>
        <ul>
          <li>{language === 'es' ? 'Búsqueda inteligente de clientes' : 'Intelligent client search'}</li>
          <li>{language === 'es' ? 'Seguimiento del historial completo' : 'Complete history tracking'}</li>
          <li>{language === 'es' ? 'Gestión de documentos' : 'Document management'}</li>
          <li>{language === 'es' ? 'Sistema de registro móvil' : 'Mobile check-in system'}</li>
        </ul>
      </div>
    </div>
  );
}

function BondProcessingStep() {
  const { language } = useLanguage();
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        {language === 'es' ? 'Procesamiento de Fianzas' : 'Bond Processing'}
      </h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">
            {language === 'es' ? 'Flujo de Trabajo de Fianzas:' : 'Bond Workflow:'}
          </h4>
          <ol className="text-sm space-y-2">
            <li>1. {language === 'es' ? 'Recibir llamada inicial' : 'Receive initial call'}</li>
            <li>2. {language === 'es' ? 'Verificar información del caso' : 'Verify case information'}</li>
            <li>3. {language === 'es' ? 'Calcular prima y garantía' : 'Calculate premium and collateral'}</li>
            <li>4. {language === 'es' ? 'Crear documentos de la fianza' : 'Create bond documents'}</li>
            <li>5. {language === 'es' ? 'Procesar pago' : 'Process payment'}</li>
            <li>6. {language === 'es' ? 'Presentar fianza en el tribunal' : 'Post bond at court'}</li>
            <li>7. {language === 'es' ? 'Monitorear cumplimiento' : 'Monitor compliance'}</li>
          </ol>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">
            {language === 'es' ? 'Características del Sistema:' : 'System Features:'}
          </h4>
          <ul className="text-sm space-y-2">
            <li>• {language === 'es' ? 'Cálculo automático de primas' : 'Automatic premium calculation'}</li>
            <li>• {language === 'es' ? 'Generación de contratos' : 'Contract generation'}</li>
            <li>• {language === 'es' ? 'Seguimiento de pagos' : 'Payment tracking'}</li>
            <li>• {language === 'es' ? 'Alertas de fechas de corte' : 'Court date alerts'}</li>
            <li>• {language === 'es' ? 'Gestión de garantías' : 'Collateral management'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function SOPsStep() {
  const { language } = useLanguage();
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        {language === 'es' ? 'Procedimientos Operativos Estándar' : 'Standard Operating Procedures'}
      </h3>
      <div className="grid gap-4">
        {[
          {
            title: language === 'es' ? 'Cumplimiento Legal' : 'Legal Compliance',
            items: [
              language === 'es' ? 'Verificar licencias actuales' : 'Verify current licenses',
              language === 'es' ? 'Mantener registros requeridos' : 'Maintain required records',
              language === 'es' ? 'Cumplir con regulaciones estatales' : 'Comply with state regulations'
            ]
          },
          {
            title: language === 'es' ? 'Gestión de Riesgos' : 'Risk Management',
            items: [
              language === 'es' ? 'Evaluar riesgo del cliente' : 'Assess client risk',
              language === 'es' ? 'Verificar garantías' : 'Verify collateral',
              language === 'es' ? 'Monitorear cumplimiento' : 'Monitor compliance'
            ]
          },
          {
            title: language === 'es' ? 'Seguridad de Datos' : 'Data Security',
            items: [
              language === 'es' ? 'Proteger información personal' : 'Protect personal information',
              language === 'es' ? 'Hacer copias de seguridad regulares' : 'Regular data backups',
              language === 'es' ? 'Controlar acceso al sistema' : 'Control system access'
            ]
          }
        ].map((section, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>• {item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}