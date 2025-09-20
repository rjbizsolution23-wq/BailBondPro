import { useState, useEffect } from "react";
import { Bell, Clock, CheckCircle, AlertCircle, Calendar, User, FileText, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: 'court-reminder' | 'payment-due' | 'check-in-required' | 'document-expired' | 'system-alert';
  title: string;
  titleEs: string;
  message: string;
  messageEs: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'sent' | 'read' | 'dismissed';
  clientId?: string;
  caseId?: string;
  bondId?: string;
  scheduledFor: string;
  createdAt: string;
  sentAt?: string;
  readAt?: string;
  actionUrl?: string;
}

interface WorkflowRule {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  trigger: 'court-date' | 'payment-due' | 'check-in-overdue' | 'bond-created' | 'document-expires';
  condition: string;
  action: 'send-notification' | 'send-email' | 'send-sms' | 'create-task' | 'escalate';
  timing: string; // e.g., '3 days before', '1 hour after', etc.
  isActive: boolean;
  template: string;
  recipients: string[];
}

export function NotificationSystem() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("notifications");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);

  // Mock data - In production, this would come from your API
  const mockNotifications: Notification[] = [
    {
      id: "1",
      type: "court-reminder",
      title: "Court Date Reminder",
      titleEs: "Recordatorio de Fecha de Corte",
      message: "Maria González has a court appearance tomorrow at 9:00 AM",
      messageEs: "Maria González tiene una comparecencia mañana a las 9:00 AM",
      priority: "high",
      status: "pending",
      clientId: "client-1",
      caseId: "case-123",
      scheduledFor: "2024-01-20T08:00:00Z",
      createdAt: "2024-01-19T10:00:00Z",
      actionUrl: "/clients/client-1"
    },
    {
      id: "2", 
      type: "payment-due",
      title: "Payment Overdue",
      titleEs: "Pago Vencido",
      message: "John Smith's payment of $500 is 5 days overdue",
      messageEs: "El pago de John Smith de $500 tiene 5 días de atraso",
      priority: "critical",
      status: "sent",
      clientId: "client-2",
      bondId: "bond-456",
      scheduledFor: "2024-01-19T00:00:00Z",
      createdAt: "2024-01-15T00:00:00Z",
      sentAt: "2024-01-19T09:00:00Z",
      actionUrl: "/payments/bond-456"
    },
    {
      id: "3",
      type: "check-in-required",
      title: "Check-in Required",
      titleEs: "Registro Requerido",
      message: "Carlos Rodriguez missed his scheduled check-in",
      messageEs: "Carlos Rodriguez perdió su registro programado",
      priority: "medium",
      status: "read",
      clientId: "client-3",
      scheduledFor: "2024-01-18T12:00:00Z",
      createdAt: "2024-01-18T14:00:00Z",
      sentAt: "2024-01-18T14:05:00Z",
      readAt: "2024-01-18T15:30:00Z",
      actionUrl: "/check-ins/client-3"
    }
  ];

  const mockWorkflowRules: WorkflowRule[] = [
    {
      id: "rule-1",
      name: "Court Date Reminder",
      nameEs: "Recordatorio de Fecha de Corte",
      description: "Send notification 24 hours before court appearance",
      descriptionEs: "Enviar notificación 24 horas antes de la comparecencia",
      trigger: "court-date",
      condition: "24 hours before",
      action: "send-notification",
      timing: "24 hours before",
      isActive: true,
      template: "Court reminder template",
      recipients: ["client", "indemnitor", "agency"]
    },
    {
      id: "rule-2",
      name: "Payment Due Alert",
      nameEs: "Alerta de Pago Vencido",
      description: "Alert when payment is overdue",
      descriptionEs: "Alertar cuando el pago esté vencido",
      trigger: "payment-due",
      condition: "1 day overdue",
      action: "send-notification",
      timing: "Daily until paid",
      isActive: true,
      template: "Payment overdue template",
      recipients: ["client", "indemnitor"]
    },
    {
      id: "rule-3",
      name: "Check-in Reminder",
      nameEs: "Recordatorio de Registro",
      description: "Remind client to check in weekly",
      descriptionEs: "Recordar al cliente que se registre semanalmente",
      trigger: "check-in-overdue",
      condition: "2 hours overdue",
      action: "send-notification",
      timing: "Every 2 hours",
      isActive: true,
      template: "Check-in reminder template",
      recipients: ["client"]
    }
  ];

  useEffect(() => {
    setNotifications(mockNotifications);
    setWorkflowRules(mockWorkflowRules);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'court-reminder':
        return <Calendar className="h-4 w-4" />;
      case 'payment-due':
        return <DollarSign className="h-4 w-4" />;
      case 'check-in-required':
        return <User className="h-4 w-4" />;
      case 'document-expired':
        return <FileText className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'read':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, status: 'read' as const, readAt: new Date().toISOString() }
          : notification
      )
    );
    toast({
      title: language === 'es' ? 'Notificación marcada como leída' : 'Notification marked as read',
      description: language === 'es' ? 'La notificación ha sido marcada como leída' : 'The notification has been marked as read'
    });
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, status: 'dismissed' as const }
          : notification
      )
    );
    toast({
      title: language === 'es' ? 'Notificación descartada' : 'Notification dismissed',
      description: language === 'es' ? 'La notificación ha sido descartada' : 'The notification has been dismissed'
    });
  };

  const toggleWorkflowRule = (ruleId: string) => {
    setWorkflowRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, isActive: !rule.isActive }
          : rule
      )
    );
    toast({
      title: language === 'es' ? 'Regla actualizada' : 'Rule updated',
      description: language === 'es' ? 'La regla de flujo de trabajo ha sido actualizada' : 'Workflow rule has been updated'
    });
  };

  const pendingCount = notifications.filter(n => n.status === 'pending').length;
  const unreadCount = notifications.filter(n => n.status === 'sent').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {language === 'es' ? 'Sistema de Notificaciones' : 'Notification System'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'es' 
              ? 'Gestione notificaciones automáticas y flujos de trabajo'
              : 'Manage automated notifications and workflows'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {pendingCount > 0 && (
            <Badge variant="destructive">
              {pendingCount} {language === 'es' ? 'pendiente' + (pendingCount > 1 ? 's' : '') : 'pending'}
            </Badge>
          )}
          {unreadCount > 0 && (
            <Badge variant="secondary">
              {unreadCount} {language === 'es' ? 'no leída' + (unreadCount > 1 ? 's' : '') : 'unread'}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Notificaciones' : 'Notifications'}
          </TabsTrigger>
          <TabsTrigger value="workflows" data-testid="tab-workflows">
            <Clock className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Flujos de Trabajo' : 'Workflows'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <div className="grid gap-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className={`${
                notification.status === 'pending' ? 'border-l-4 border-l-yellow-500' : 
                notification.priority === 'critical' ? 'border-l-4 border-l-red-500' :
                notification.priority === 'high' ? 'border-l-4 border-l-orange-500' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">
                          {language === 'es' ? notification.titleEs : notification.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {language === 'es' ? notification.messageEs : notification.message}
                        </CardDescription>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          <Badge className={getStatusColor(notification.status)}>
                            {notification.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.scheduledFor).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {notification.status === 'sent' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                          data-testid={`button-mark-read-${notification.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {language === 'es' ? 'Marcar Leída' : 'Mark Read'}
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => dismissNotification(notification.id)}
                        data-testid={`button-dismiss-${notification.id}`}
                      >
                        {language === 'es' ? 'Descartar' : 'Dismiss'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'es' ? 'Reglas de Flujo de Trabajo' : 'Workflow Rules'}
              </CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? 'Configure reglas automáticas para notificaciones y acciones'
                  : 'Configure automatic rules for notifications and actions'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">
                          {language === 'es' ? rule.nameEs : rule.name}
                        </h4>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive 
                            ? (language === 'es' ? 'Activo' : 'Active')
                            : (language === 'es' ? 'Inactivo' : 'Inactive')
                          }
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {language === 'es' ? rule.descriptionEs : rule.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {language === 'es' ? 'Disparador:' : 'Trigger:'} {rule.trigger}
                        </span>
                        <span>
                          {language === 'es' ? 'Tiempo:' : 'Timing:'} {rule.timing}
                        </span>
                        <span>
                          {language === 'es' ? 'Acción:' : 'Action:'} {rule.action}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`rule-toggle-${rule.id}`} className="sr-only">
                        {language === 'es' ? 'Alternar regla' : 'Toggle rule'}
                      </Label>
                      <Switch
                        id={`rule-toggle-${rule.id}`}
                        checked={rule.isActive}
                        onCheckedChange={() => toggleWorkflowRule(rule.id)}
                        data-testid={`switch-rule-${rule.id}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}