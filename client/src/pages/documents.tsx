import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export default function Documents() {
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["/api/documents", { category: categoryFilter }],
    queryFn: () => api.getDocuments({ category: categoryFilter }),
  });

  // Calculate document statistics by category
  const documentStats = {
    contracts: documents.filter((d: any) => d.category === 'contract').length,
    courtPapers: documents.filter((d: any) => d.category === 'court_papers').length,
    identification: documents.filter((d: any) => d.category === 'identification').length,
    financial: documents.filter((d: any) => d.category === 'financial').length,
  };

  const filteredDocuments = categoryFilter && categoryFilter !== "all"
    ? documents.filter((doc: any) => doc.category === categoryFilter)
    : documents;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "contract":
        return "fas fa-file-contract text-blue-600";
      case "court_papers":
        return "fas fa-gavel text-purple-600";
      case "identification":
        return "fas fa-id-card text-green-600";
      case "financial":
        return "fas fa-receipt text-amber-600";
      default:
        return "fas fa-file text-gray-600";
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return "fas fa-file-pdf text-red-600";
    if (mimeType?.includes('image')) return "fas fa-file-image text-green-600";
    if (mimeType?.includes('word')) return "fas fa-file-word text-blue-600";
    return "fas fa-file text-gray-600";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "contract":
        return "Contract";
      case "court_papers":
        return "Court Papers";
      case "identification":
        return "Identification";
      case "financial":
        return "Financial";
      default:
        return category;
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Header
        title="Document Management"
        subtitle="Manage contracts, court papers, and client documents"
        showNewBondButton={false}
      />

      <div className="p-6 overflow-y-auto h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Document Management</h3>
            <p className="text-muted-foreground">Manage contracts, court papers, and client documents</p>
          </div>
          <Button data-testid="button-upload-document">
            <i className="fas fa-upload mr-2"></i>Upload Document
          </Button>
        </div>

        {/* Document Categories */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="stat-contracts" className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setCategoryFilter(categoryFilter === 'contract' ? '' : 'contract')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-file-contract text-blue-600 text-xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Contracts</h4>
              <p className="text-2xl font-bold text-foreground" data-testid="value-contracts">
                {documentStats.contracts}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-court-papers" className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setCategoryFilter(categoryFilter === 'court_papers' ? '' : 'court_papers')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-gavel text-purple-600 text-xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Court Papers</h4>
              <p className="text-2xl font-bold text-foreground" data-testid="value-court-papers">
                {documentStats.courtPapers}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-identification" className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setCategoryFilter(categoryFilter === 'identification' ? '' : 'identification')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-id-card text-green-600 text-xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Identification</h4>
              <p className="text-2xl font-bold text-foreground" data-testid="value-identification">
                {documentStats.identification}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-financial-docs" className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setCategoryFilter(categoryFilter === 'financial' ? '' : 'financial')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-receipt text-amber-600 text-xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Financial</h4>
              <p className="text-2xl font-bold text-foreground" data-testid="value-financial-docs">
                {documentStats.financial}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Document List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {categoryFilter ? `${getCategoryLabel(categoryFilter)} Documents` : 'Recent Documents'}
              </CardTitle>
              <div className="flex space-x-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48" data-testid="select-category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="contract">Contracts</SelectItem>
                    <SelectItem value="court_papers">Court Papers</SelectItem>
                    <SelectItem value="identification">Identification</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div>
                        <Skeleton className="h-4 w-48 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </div>
                ))
              ) : filteredDocuments.length > 0 ? (
                filteredDocuments.map((document: any) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`document-row-${document.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                        <i className={getFileIcon(document.mimeType)}></i>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-foreground" data-testid={`document-name-${document.id}`}>
                          {document.originalName}
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          {getCategoryLabel(document.category)} • Uploaded {formatDate(document.createdAt)} • {formatFileSize(document.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        className="text-primary hover:text-primary/80" 
                        title="View"
                        data-testid={`button-view-${document.id}`}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        className="text-muted-foreground hover:text-foreground" 
                        title="Download"
                        data-testid={`button-download-${document.id}`}
                      >
                        <i className="fas fa-download"></i>
                      </button>
                      <button 
                        className="text-muted-foreground hover:text-foreground" 
                        title="Share"
                        data-testid={`button-share-${document.id}`}
                      >
                        <i className="fas fa-share"></i>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-muted-foreground">
                    {categoryFilter ? (
                      <>
                        <i className={`${getCategoryIcon(categoryFilter)} text-4xl mb-4 block opacity-50`}></i>
                        <p className="text-lg mb-2">No {getCategoryLabel(categoryFilter).toLowerCase()} documents found</p>
                        <p className="text-sm">Upload your first {getCategoryLabel(categoryFilter).toLowerCase()} document to get started</p>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-file-alt text-4xl mb-4 block opacity-50"></i>
                        <p className="text-lg mb-2">No documents yet</p>
                        <p className="text-sm">Upload your first document to get started</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
