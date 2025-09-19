// AI Services for the bail bonds system
// Referenced from the javascript_openai integration

import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SearchResult {
  type: 'client' | 'case' | 'bond' | 'payment' | 'document';
  id: string;
  title: string;
  description: string;
  relevanceScore: number;
}

export interface TranslationRequest {
  text: string;
  fromLanguage: 'en' | 'es';
  toLanguage: 'en' | 'es';
}

export interface PhotoVerificationResult {
  isValidPhoto: boolean;
  confidence: number;
  personDetected: boolean;
  quality: 'high' | 'medium' | 'low';
  issues?: string[];
}

export class AIService {
  // Intelligent search across all data types with data minimization for security
  async intelligentSearch(
    query: string,
    data: {
      clients: any[];
      cases: any[];
      bonds: any[];
      payments: any[];
      documents: any[];
    },
    language: 'en' | 'es' = 'en'
  ): Promise<SearchResult[]> {
    try {
      // First, perform server-side filtering to reduce dataset size
      const filteredData = this.prefilterSearchData(query, data);
      
      // If we have too much data even after filtering, use text-based search only
      const totalItems = Object.values(filteredData).reduce((sum, arr) => sum + arr.length, 0);
      if (totalItems > 50) {
        console.log(`[AI Search] Large dataset (${totalItems} items), using server-side search only`);
        return this.performServerSideSearch(query, data);
      }

      // Sanitize data before sending to AI (remove PII and sensitive fields)
      const sanitizedData = this.sanitizeDataForAI(filteredData);

      const systemPrompt = language === 'es' 
        ? "Eres un asistente experto en el sistema de fianzas. Analiza la consulta del usuario y encuentra elementos relevantes en los datos proporcionados. Devuelve resultados en JSON con relevancia ordenada."
        : "You are an expert bail bonds system assistant. Analyze the user's query and find relevant items in the provided data. Return results in JSON with relevance ranking.";

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `${systemPrompt}

Available sanitized data structure (personal details redacted for privacy):
- Clients: id, initials, generalLocation, yearOfBirth
- Cases: id, caseNumber, chargeType (general), status, courtYear
- Bonds: id, bondNumber, bondType, bondAmount (rounded), status
- Payments: id, amount (rounded), month, paymentMethod, status
- Documents: id, fileName (sanitized), category, uploadDate (month only)

Response format: {
  "results": [
    {
      "type": "client|case|bond|payment|document",
      "id": "string",
      "title": "string",
      "description": "string", 
      "relevanceScore": number (0-1)
    }
  ]
}`
          },
          {
            role: "user",
            content: `Search query: "${query}"

Sanitized data (personal details removed for privacy):
${JSON.stringify(sanitizedData)}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"results": []}');
      return result.results || [];
    } catch (error) {
      console.error('AI search error:', error);
      // Fallback to server-side search if AI fails
      return this.performServerSideSearch(query, data);
    }
  }

  // Pre-filter data based on query to reduce size before AI processing
  private prefilterSearchData(query: string, data: any) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    const filterArray = (items: any[], searchFields: string[]) => {
      return items.filter(item => {
        return searchTerms.some(term => 
          searchFields.some(field => 
            item[field]?.toString().toLowerCase().includes(term)
          )
        );
      }).slice(0, 20); // Limit to top 20 matches per category
    };

    return {
      clients: filterArray(data.clients, ['firstName', 'lastName']),
      cases: filterArray(data.cases, ['caseNumber', 'chargeType', 'chargeDescription']),
      bonds: filterArray(data.bonds, ['bondNumber', 'bondType']),
      payments: filterArray(data.payments, ['paymentMethod']),
      documents: filterArray(data.documents, ['fileName', 'category'])
    };
  }

  // Sanitize data by removing PII and sensitive information
  private sanitizeDataForAI(data: any) {
    return {
      clients: data.clients.map((client: any) => ({
        id: client.id,
        initials: `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`,
        generalLocation: client.city || 'Unknown',
        yearOfBirth: client.dateOfBirth ? new Date(client.dateOfBirth).getFullYear() : null
      })),
      cases: data.cases.map((case_: any) => ({
        id: case_.id,
        caseNumber: case_.caseNumber,
        chargeType: case_.chargeType,
        status: case_.status,
        courtYear: case_.courtDate ? new Date(case_.courtDate).getFullYear() : null
      })),
      bonds: data.bonds.map((bond: any) => ({
        id: bond.id,
        bondNumber: bond.bondNumber,
        bondType: bond.bondType,
        bondAmount: bond.bondAmount ? Math.round(bond.bondAmount / 1000) * 1000 : null, // Round to nearest 1000
        status: bond.status
      })),
      payments: data.payments.map((payment: any) => ({
        id: payment.id,
        amount: payment.amount ? Math.round(payment.amount / 100) * 100 : null, // Round to nearest 100
        month: payment.paymentDate ? new Date(payment.paymentDate).getMonth() + 1 : null,
        paymentMethod: payment.paymentMethod,
        status: payment.status
      })),
      documents: data.documents.map((doc: any) => ({
        id: doc.id,
        fileName: doc.fileName?.replace(/\.(pdf|doc|docx|jpg|jpeg|png)$/i, '[FILE]'), // Remove extensions
        category: doc.category,
        uploadMonth: doc.uploadDate ? new Date(doc.uploadDate).getMonth() + 1 : null
      }))
    };
  }

  // Server-side text search as fallback (no AI, no external data transmission)
  private performServerSideSearch(query: string, data: any): SearchResult[] {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
    const results: SearchResult[] = [];

    // Search clients
    data.clients.forEach((client: any) => {
      const searchableText = `${client.firstName} ${client.lastName} ${client.email}`.toLowerCase();
      const matches = searchTerms.filter(term => searchableText.includes(term));
      if (matches.length > 0) {
        results.push({
          type: 'client',
          id: client.id,
          title: `${client.firstName} ${client.lastName}`,
          description: `Email: ${client.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'N/A'}`,
          relevanceScore: matches.length / searchTerms.length
        });
      }
    });

    // Search cases
    data.cases.forEach((case_: any) => {
      const searchableText = `${case_.caseNumber} ${case_.chargeType} ${case_.chargeDescription}`.toLowerCase();
      const matches = searchTerms.filter(term => searchableText.includes(term));
      if (matches.length > 0) {
        results.push({
          type: 'case',
          id: case_.id,
          title: `Case ${case_.caseNumber}`,
          description: `${case_.chargeType} - ${case_.status}`,
          relevanceScore: matches.length / searchTerms.length
        });
      }
    });

    // Search bonds
    data.bonds.forEach((bond: any) => {
      const searchableText = `${bond.bondNumber} ${bond.bondType}`.toLowerCase();
      const matches = searchTerms.filter(term => searchableText.includes(term));
      if (matches.length > 0) {
        results.push({
          type: 'bond',
          id: bond.id,
          title: `Bond ${bond.bondNumber}`,
          description: `${bond.bondType} - $${bond.bondAmount} - ${bond.status}`,
          relevanceScore: matches.length / searchTerms.length
        });
      }
    });

    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  }

  // Translate text between English and Spanish
  async translateText({ text, fromLanguage, toLanguage }: TranslationRequest): Promise<string> {
    if (fromLanguage === toLanguage) {
      return text;
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a professional translator specializing in legal and bail bonds terminology. 
            Translate from ${fromLanguage === 'en' ? 'English' : 'Spanish'} to ${toLanguage === 'en' ? 'English' : 'Spanish'}.
            Maintain legal accuracy and formal tone. Return only the translated text.`
          },
          {
            role: "user",
            content: text
          }
        ],
      });

      return response.choices[0].message.content || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  // Analyze photos for client check-in verification
  async verifyCheckinPhoto(base64Image: string): Promise<PhotoVerificationResult> {
    try {
      // Clean the base64 string and detect image type
      let cleanBase64 = base64Image;
      let imageType = 'jpeg';
      
      // Handle data URL format
      if (base64Image.startsWith('data:')) {
        const matches = base64Image.match(/data:image\/(\w+);base64,(.+)/);
        if (matches) {
          imageType = matches[1];
          cleanBase64 = matches[2];
        }
      }
      
      // Validate base64 format
      if (!cleanBase64 || cleanBase64.length < 100) {
        throw new Error('Invalid image data');
      }

      console.log(`[AI Service] Verifying photo - Type: ${imageType}, Size: ${cleanBase64.length} characters`);

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a photo verification expert for a bail bonds check-in system. 
            Analyze the image and determine if it's suitable for client verification.
            
            Check for:
            - Clear person visible
            - Face clearly visible (not obscured)
            - Photo quality (lighting, focus, clarity)
            - Not a screenshot or photo of photo
            - Appropriate setting
            
            Respond with JSON: {
              "isValidPhoto": boolean,
              "confidence": number (0-1),
              "personDetected": boolean,
              "quality": "high|medium|low",
              "issues": ["array of issues if any"]
            }`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this check-in photo for client verification:"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/${imageType};base64,${cleanBase64}`
                }
              }
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      console.log('[AI Service] Photo verification result:', result);
      
      return {
        isValidPhoto: result.isValidPhoto || false,
        confidence: result.confidence || 0,
        personDetected: result.personDetected || false,
        quality: result.quality || 'low',
        issues: result.issues || []
      };
    } catch (error) {
      console.error('Photo verification error:', error);
      // For development, return a mock successful result to avoid blocking
      if (process.env.NODE_ENV === 'development') {
        console.log('[AI Service] Development mode - returning mock successful verification');
        return {
          isValidPhoto: true,
          confidence: 0.85,
          personDetected: true,
          quality: 'medium',
          issues: []
        };
      }
      
      return {
        isValidPhoto: false,
        confidence: 0,
        personDetected: false,
        quality: 'low',
        issues: ['Failed to analyze photo: ' + (error instanceof Error ? error.message : 'Unknown error')]
      };
    }
  }

  // Generate system help and guidance
  async generateHelp(question: string, language: 'en' | 'es' = 'en'): Promise<string> {
    try {
      const systemPrompt = language === 'es'
        ? "Eres un asistente experto del sistema de gestión de fianzas. Proporciona ayuda clara y útil sobre cómo usar el sistema."
        : "You are an expert bail bonds management system assistant. Provide clear, helpful guidance on how to use the system.";

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `${systemPrompt}

The system includes:
- Client Management: Add, edit, and track client information
- Case Management: Handle legal cases with court dates and documents
- Bond Management: Create and monitor bail bonds with payments
- Document Management: Upload and organize legal documents
- Check-in System: Client photo verification and GPS tracking
- Payment Processing: Track payments and generate reports
- Multi-language Support: English and Spanish interface

Provide specific, actionable guidance based on the user's question.`
          },
          {
            role: "user",
            content: question
          }
        ],
      });

      return response.choices[0].message.content || 'I apologize, but I couldn\'t generate a helpful response. Please try rephrasing your question.';
    } catch (error) {
      console.error('Help generation error:', error);
      return language === 'es' 
        ? 'Lo siento, no pude generar una respuesta útil. Por favor intenta reformular tu pregunta.'
        : 'I apologize, but I couldn\'t generate a helpful response. Please try rephrasing your question.';
    }
  }

  // Analyze case data for insights and compliance
  async analyzeCaseCompliance(caseData: any, checkins: any[]): Promise<{
    complianceStatus: 'compliant' | 'warning' | 'non-compliant';
    riskLevel: 'low' | 'medium' | 'high';
    insights: string[];
    recommendations: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a compliance analyst for a bail bonds system. Analyze case data and check-in history to assess compliance and risk.

Consider:
- Check-in frequency and consistency
- Court date compliance
- Payment history
- Case status and progression
- Any missed appointments or violations

Respond with JSON: {
  "complianceStatus": "compliant|warning|non-compliant",
  "riskLevel": "low|medium|high", 
  "insights": ["array of key insights"],
  "recommendations": ["array of actionable recommendations"]
}`
          },
          {
            role: "user",
            content: `Analyze this case:
Case Data: ${JSON.stringify(caseData)}
Check-in History: ${JSON.stringify(checkins)}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        complianceStatus: result.complianceStatus || 'warning',
        riskLevel: result.riskLevel || 'medium',
        insights: result.insights || [],
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error('Compliance analysis error:', error);
      return {
        complianceStatus: 'warning',
        riskLevel: 'medium',
        insights: ['Unable to analyze compliance data'],
        recommendations: ['Please review case manually']
      };
    }
  }
}

export const aiService = new AIService();