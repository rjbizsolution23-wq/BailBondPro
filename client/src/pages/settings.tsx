import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export default function Settings() {
  const [activeCategory, setActiveCategory] = useState("users");

  // Mock user data since we don't have a users endpoint
  const users = [
    {
      id: "1",
      firstName: "John",
      lastName: "Smith", 
      email: "john.smith@bailbonds.com",
      role: "admin",
    },
    {
      id: "2",
      firstName: "Emily",
      lastName: "Martinez",
      email: "emily.martinez@bailbonds.com", 
      role: "agent",
    },
    {
      id: "3",
      firstName: "Michael",
      lastName: "Johnson",
      email: "michael.johnson@bailbonds.com",
      role: "staff",
    },
  ];

  const settingsCategories = [
    { id: "users", icon: "fas fa-users", label: "User Management" },
    { id: "system", icon: "fas fa-cog", label: "System Settings" },
    { id: "notifications", icon: "fas fa-bell", label: "Notifications" },
    { id: "api", icon: "fas fa-key", label: "API Configuration" },
    { id: "export", icon: "fas fa-file-export", label: "Data Export" },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-green-100 text-green-800" data-testid="badge-admin">Admin</Badge>;
      case "agent":
        return <Badge className="bg-blue-100 text-blue-800" data-testid="badge-agent">Agent</Badge>;
      case "staff":
        return <Badge className="bg-gray-100 text-gray-800" data-testid="badge-staff">Staff</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-unknown">{role}</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const renderUserManagement = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <Button data-testid="button-add-user">
            <i className="fas fa-plus mr-2"></i>Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg"
              data-testid={`user-row-${user.id}`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-medium">
                    {getInitials(user.firstName, user.lastName)}
                  </span>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-foreground" data-testid={`user-name-${user.id}`}>
                    {user.firstName} {user.lastName}
                  </h5>
                  <p className="text-xs text-muted-foreground" data-testid={`user-email-${user.id}`}>
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {getRoleBadge(user.role)}
                <div className="flex space-x-2">
                  <button 
                    className="text-muted-foreground hover:text-foreground" 
                    title="Edit"
                    data-testid={`button-edit-user-${user.id}`}
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    className="text-destructive hover:text-destructive/80" 
                    title="Delete"
                    data-testid={`button-delete-user-${user.id}`}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderSystemSettings = () => (
    <Card data-testid="card-system-settings">
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-border rounded-lg">
              <h5 className="text-sm font-medium text-foreground mb-2">Default Premium Rate</h5>
              <p className="text-xs text-muted-foreground mb-3">
                Default percentage rate applied to new bonds
              </p>
              <div className="flex items-center space-x-2">
                <input type="number" defaultValue="10" className="w-20 px-2 py-1 border border-input rounded text-sm" />
                <span className="text-sm">%</span>
                <Button size="sm" variant="outline">Update</Button>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h5 className="text-sm font-medium text-foreground mb-2">Business Hours</h5>
              <p className="text-xs text-muted-foreground mb-3">
                Operating hours for the business
              </p>
              <div className="flex items-center space-x-2">
                <input type="time" defaultValue="08:00" className="px-2 py-1 border border-input rounded text-sm" />
                <span className="text-sm">to</span>
                <input type="time" defaultValue="18:00" className="px-2 py-1 border border-input rounded text-sm" />
                <Button size="sm" variant="outline">Update</Button>
              </div>
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg">
            <h5 className="text-sm font-medium text-foreground mb-2">Company Information</h5>
            <p className="text-xs text-muted-foreground mb-3">
              Update company details for contracts and documents
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Company Name" className="px-3 py-2 border border-input rounded text-sm" />
              <input type="text" placeholder="License Number" className="px-3 py-2 border border-input rounded text-sm" />
              <input type="text" placeholder="Phone Number" className="px-3 py-2 border border-input rounded text-sm" />
              <input type="email" placeholder="Email Address" className="px-3 py-2 border border-input rounded text-sm" />
            </div>
            <Button className="mt-3">Save Changes</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderNotifications = () => (
    <Card data-testid="card-notifications">
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { id: "court-reminders", label: "Court Date Reminders", description: "Send reminders 24 hours before court dates" },
            { id: "payment-due", label: "Payment Due Notifications", description: "Notify when payments are due or overdue" },
            { id: "bond-status", label: "Bond Status Changes", description: "Alert when bond status changes" },
            { id: "new-clients", label: "New Client Notifications", description: "Notify when new clients are added" },
            { id: "system-alerts", label: "System Alerts", description: "Important system notifications and updates" },
          ].map((notification) => (
            <div key={notification.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <h5 className="text-sm font-medium text-foreground">{notification.label}</h5>
                <p className="text-xs text-muted-foreground">{notification.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderApiConfiguration = () => (
    <Card data-testid="card-api-config">
      <CardHeader>
        <CardTitle>API Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border border-border rounded-lg">
            <h5 className="text-sm font-medium text-foreground mb-2">Gibson AI API</h5>
            <p className="text-xs text-muted-foreground mb-3">
              Configuration for the Gibson AI integration
            </p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">API Endpoint</label>
                <input 
                  type="text" 
                  defaultValue="https://api.gibsonai.com" 
                  className="w-full px-3 py-2 border border-input rounded text-sm mt-1" 
                  readOnly 
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">API Key Status</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  <Button size="sm" variant="outline">Test Connection</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg">
            <h5 className="text-sm font-medium text-foreground mb-2">Rate Limiting</h5>
            <p className="text-xs text-muted-foreground mb-3">
              Configure API request limits
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Requests per minute</label>
                <input type="number" defaultValue="60" className="w-full px-3 py-2 border border-input rounded text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Burst limit</label>
                <input type="number" defaultValue="100" className="w-full px-3 py-2 border border-input rounded text-sm mt-1" />
              </div>
            </div>
            <Button className="mt-3" size="sm">Update Limits</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDataExport = () => (
    <Card data-testid="card-data-export">
      <CardHeader>
        <CardTitle>Data Export</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { id: "clients", label: "Client Data", description: "Export all client information and contact details" },
            { id: "bonds", label: "Bond Records", description: "Export bond history and payment information" },
            { id: "cases", label: "Case Information", description: "Export court cases and legal proceedings" },
            { id: "financial", label: "Financial Reports", description: "Export payment history and financial summaries" },
            { id: "documents", label: "Document Registry", description: "Export document metadata and file information" },
          ].map((exportType) => (
            <div key={exportType.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <h5 className="text-sm font-medium text-foreground">{exportType.label}</h5>
                <p className="text-xs text-muted-foreground">{exportType.description}</p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" data-testid={`button-export-${exportType.id}`}>
                  <i className="fas fa-download mr-1"></i>CSV
                </Button>
                <Button size="sm" variant="outline" data-testid={`button-export-json-${exportType.id}`}>
                  <i className="fas fa-download mr-1"></i>JSON
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 border border-border rounded-lg bg-muted/50">
          <h5 className="text-sm font-medium text-foreground mb-2">Full System Backup</h5>
          <p className="text-xs text-muted-foreground mb-3">
            Export complete system data including all records and configurations
          </p>
          <Button data-testid="button-full-backup">
            <i className="fas fa-database mr-2"></i>Generate Full Backup
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case "users":
        return renderUserManagement();
      case "system":
        return renderSystemSettings();
      case "notifications":
        return renderNotifications();
      case "api":
        return renderApiConfiguration();
      case "export":
        return renderDataExport();
      default:
        return renderUserManagement();
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header
        title="Settings"
        subtitle="System configuration and user management"
        showNewBondButton={false}
      />

      <div className="p-6 overflow-y-auto h-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Menu */}
          <Card data-testid="settings-menu">
            <CardHeader>
              <CardTitle>Settings Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-2">
                {settingsCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                      activeCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent"
                    }`}
                    data-testid={`nav-${category.id}`}
                  >
                    <i className={`${category.icon} w-5`}></i>
                    <span>{category.label}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Settings Content */}
          <div className="lg:col-span-2">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
