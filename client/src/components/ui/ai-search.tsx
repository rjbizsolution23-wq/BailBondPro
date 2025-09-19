import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Bot, Loader2, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/language-context";
import { api } from "@/lib/api";

interface SearchResult {
  type: 'client' | 'case' | 'bond' | 'payment' | 'document';
  id: string;
  title: string;
  description: string;
  relevanceScore: number;
}

export function AISearch() {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const searchMutation = useMutation({
    mutationFn: (searchQuery: string) => api.aiSearch(searchQuery, language),
    onSuccess: (data) => {
      setResults(data.results || []);
    },
    onError: (error) => {
      console.error('Search error:', error);
      setResults([]);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchMutation.mutate(query.trim());
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'client': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'case': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'bond': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'payment': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'document': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'client': return 'fas fa-user';
      case 'case': return 'fas fa-briefcase';
      case 'bond': return 'fas fa-handshake';
      case 'payment': return 'fas fa-credit-card';
      case 'document': return 'fas fa-file-alt';
      default: return 'fas fa-question';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <span>{t('search.placeholder')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={language === 'es' 
                ? "Pregúntame sobre clientes, casos o fianzas..."
                : "Ask me about clients, cases, or bonds..."
              }
              className="pl-10"
              disabled={searchMutation.isPending}
              data-testid="ai-search-input"
            />
          </div>
          <Button 
            type="submit" 
            disabled={!query.trim() || searchMutation.isPending}
            data-testid="ai-search-button"
          >
            {searchMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              {t('search.suggestions')} ({results.length})
            </h4>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {results.map((result, index) => (
                  <Card 
                    key={`${result.type}-${result.id}-${index}`}
                    className="cursor-pointer hover:bg-muted/50 transition-colors p-3"
                    data-testid={`search-result-${result.type}-${result.id}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <i className={`${getTypeIcon(result.type)} text-sm text-muted-foreground`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="text-sm font-medium truncate">
                            {result.title}
                          </h5>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getTypeColor(result.type)}`}
                            >
                              {t(`${result.type}s.title`).slice(0, -1)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(result.relevanceScore * 100)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* No Results */}
        {searchMutation.isSuccess && results.length === 0 && query && (
          <div className="text-center py-4 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('search.noResults')}</p>
            <p className="text-xs">{t('search.tryDifferent')}</p>
          </div>
        )}

        {/* Error State */}
        {searchMutation.isError && (
          <div className="text-center py-4 text-destructive">
            <p className="text-sm">{t('errors.generic')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}