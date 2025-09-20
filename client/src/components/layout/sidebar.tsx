import { Link, useLocation } from "wouter";

interface SidebarProps {
  currentUser?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export function Sidebar({ currentUser = { firstName: "John", lastName: "Smith", role: "Bail Agent" } }: SidebarProps) {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/", icon: "fas fa-tachometer-alt", label: "Dashboard" },
    { path: "/clients", icon: "fas fa-users", label: "Client Management" },
    { path: "/cases", icon: "fas fa-briefcase", label: "Case Management" },
    { path: "/bonds", icon: "fas fa-handshake", label: "Bond Tracking" },
    { path: "/financial", icon: "fas fa-dollar-sign", label: "Financial Management" },
    { path: "/documents", icon: "fas fa-file-alt", label: "Document Management" },
    { path: "/reports", icon: "fas fa-chart-bar", label: "Reports & Analytics" },
    { path: "/onboarding", icon: "fas fa-graduation-cap", label: "Training & Setup" },
    { path: "/settings", icon: "fas fa-cog", label: "Settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0 flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-shield-alt text-primary-foreground text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">BailBond Pro</h1>
            <p className="text-sm text-muted-foreground">Management System</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2 flex-1">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <div
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                isActive(item.path)
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <i className={`${item.icon} w-5`}></i>
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <i className="fas fa-user text-secondary-foreground text-sm"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="user-name">
              {currentUser.firstName} {currentUser.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="user-role">
              {currentUser.role}
            </p>
          </div>
          <button 
            className="text-muted-foreground hover:text-foreground"
            data-testid="logout-button"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
