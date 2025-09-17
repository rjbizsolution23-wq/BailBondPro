import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  subtitle: string;
  onNewBond?: () => void;
  showNewBondButton?: boolean;
}

export function Header({ title, subtitle, onNewBond, showNewBondButton = true }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="page-title">{title}</h2>
          <p className="text-muted-foreground" data-testid="page-subtitle">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search clients, cases..."
              className="w-64"
              data-testid="global-search-input"
            />
            <i className="fas fa-search absolute right-3 top-3 text-muted-foreground"></i>
          </div>
          <button 
            className="relative p-2 text-muted-foreground hover:text-foreground"
            data-testid="notifications-button"
          >
            <i className="fas fa-bell"></i>
            <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full"></span>
          </button>
          {showNewBondButton && (
            <Button onClick={onNewBond} data-testid="new-bond-button">
              <i className="fas fa-plus mr-2"></i>New Bond
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
