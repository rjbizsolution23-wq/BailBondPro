import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, Bell, Users, Zap } from "lucide-react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ContractManager } from "@/components/contracts/contract-manager";
import { NotificationSystem } from "@/components/workflows/notification-system";
import { TrainingSystem } from "@/components/training/training-system";
import { useLanguage } from "@/contexts/language-context";

export function OnboardingPage() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold">
          {language === 'es' ? 'Centro de Capacitación y Gestión' : 'Training & Management Center'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {language === 'es' 
            ? 'Sistema completo de incorporación, capacitación y procedimientos operativos estándar'
            : 'Complete onboarding, training, and standard operating procedures system'
          }
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Zap className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Resumen' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="wizard" data-testid="tab-wizard">
            <Users className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Configuración' : 'Setup Wizard'}
          </TabsTrigger>
          <TabsTrigger value="contracts" data-testid="tab-contracts">
            <FileText className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Contratos' : 'Contracts'}
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Notificaciones' : 'Workflows'}
          </TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-training">
            <BookOpen className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Capacitación' : 'Training'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                  <Users className="h-5 w-5" />
                  <span>{language === 'es' ? 'Configuración' : 'System Setup'}</span>
                </CardTitle>
                <CardDescription className="text-blue-600 dark:text-blue-400">
                  {language === 'es' 
                    ? 'Configuración guiada del sistema con asistente paso a paso'
                    : 'Guided system configuration with step-by-step wizard'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{language === 'es' ? 'Progreso' : 'Progress'}</span>
                    <Badge variant="secondary">0/5 {language === 'es' ? 'pasos' : 'steps'}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'es' 
                      ? 'Complete la configuración inicial para comenzar'
                      : 'Complete initial setup to get started'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <FileText className="h-5 w-5" />
                  <span>{language === 'es' ? 'Contratos' : 'Contract System'}</span>
                </CardTitle>
                <CardDescription className="text-green-600 dark:text-green-400">
                  {language === 'es' 
                    ? 'Generación automática de contratos legales precisos'
                    : 'Automated generation of accurate legal contracts'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{language === 'es' ? 'Plantillas' : 'Templates'}</span>
                    <Badge variant="secondary">3 {language === 'es' ? 'tipos' : 'types'}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'es' 
                      ? 'Fianza, indemnización, planes de pago'
                      : 'Bail, indemnity, payment plans'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-purple-700 dark:text-purple-300">
                  <Bell className="h-5 w-5" />
                  <span>{language === 'es' ? 'Flujos de Trabajo' : 'Workflow System'}</span>
                </CardTitle>
                <CardDescription className="text-purple-600 dark:text-purple-400">
                  {language === 'es' 
                    ? 'Notificaciones automáticas y gestión de procesos'
                    : 'Automated notifications and process management'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{language === 'es' ? 'Reglas Activas' : 'Active Rules'}</span>
                    <Badge variant="secondary">3 {language === 'es' ? 'reglas' : 'rules'}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'es' 
                      ? 'Recordatorios de corte, pagos, registros'
                      : 'Court reminders, payments, check-ins'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
                  <BookOpen className="h-5 w-5" />
                  <span>{language === 'es' ? 'Capacitación' : 'Training System'}</span>
                </CardTitle>
                <CardDescription className="text-orange-600 dark:text-orange-400">
                  {language === 'es' 
                    ? 'Módulos de capacitación y procedimientos operativos'
                    : 'Training modules and operating procedures'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{language === 'es' ? 'Módulos' : 'Modules'}</span>
                    <Badge variant="secondary">3 {language === 'es' ? 'módulos' : 'modules'}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'es' 
                      ? 'Legal, sistema, gestión de riesgos'
                      : 'Legal, system, risk management'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'es' ? 'Características del Sistema' : 'System Features'}</CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? 'Su sistema de gestión de fianzas más robusto incluye'
                  : 'Your most robust bail bonds management system includes'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">
                    {language === 'es' ? 'Características Principales' : 'Core Features'}
                  </h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>
                        {language === 'es' 
                          ? 'Soporte bilingüe completo (Inglés/Español)'
                          : 'Complete bilingual support (English/Spanish)'
                        }
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>
                        {language === 'es' 
                          ? 'Búsqueda inteligente con IA y procesamiento de lenguaje natural'
                          : 'AI-powered intelligent search with natural language processing'
                        }
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>
                        {language === 'es' 
                          ? 'Sistema de registro de clientes con verificación de fotos y GPS'
                          : 'Client check-in system with photo verification and GPS tracking'
                        }
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>
                        {language === 'es' 
                          ? 'Generación automática de contratos legales'
                          : 'Automated legal contract generation'
                        }
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">
                    {language === 'es' ? 'Características Avanzadas' : 'Advanced Features'}
                  </h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>
                        {language === 'es' 
                          ? 'Flujos de trabajo automáticos con notificaciones inteligentes'
                          : 'Automated workflows with intelligent notifications'
                        }
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>
                        {language === 'es' 
                          ? 'Sistema de capacitación interactivo con módulos'
                          : 'Interactive training system with modules'
                        }
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>
                        {language === 'es' 
                          ? 'Procedimientos operativos estándar (SOPs) integrados'
                          : 'Integrated standard operating procedures (SOPs)'
                        }
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>
                        {language === 'es' 
                          ? 'Asistente de configuración guiada para incorporación completa'
                          : 'Guided setup wizard for complete onboarding'
                        }
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wizard">
          <OnboardingWizard />
        </TabsContent>

        <TabsContent value="contracts">
          <ContractManager />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSystem />
        </TabsContent>

        <TabsContent value="training">
          <TrainingSystem />
        </TabsContent>
      </Tabs>
    </div>
  );
}