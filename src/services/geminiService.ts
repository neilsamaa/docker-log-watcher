import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini AI Service for Log Analysis
export class GeminiLogAnalysisService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private isInitialized: boolean = false;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Using Gemini Pro for text-based log analysis
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async initialize(): Promise<boolean> {
    try {
      // Test the connection
      const result = await this.model.generateContent("Test connection");
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
      this.isInitialized = false;
      return false;
    }
  }

  // Preprocess logs for optimal Gemini analysis
  private preprocessLogs(logs: string[]): string {
    // Remove timestamps and format for analysis
    const cleanedLogs = logs
      .filter(log => log.trim().length > 0)
      .map(log => {
        // Remove Docker headers and timestamps
        return log.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z?\s*/, '')
                  .replace(/^.{8}/, '') // Remove Docker 8-byte header
                  .trim();
      })
      .filter(log => log.length > 0)
      .slice(-100); // Limit to last 100 logs for analysis

    return cleanedLogs.join('\n');
  }

  // Analyze logs for errors and anomalies
  async analyzeErrors(logs: string[]): Promise<LogAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('Gemini service not initialized');
    }

    const processedLogs = this.preprocessLogs(logs);
    
    const prompt = `
    Analyze the following Docker container logs and provide insights:

    LOGS:
    ${processedLogs}

    Please provide analysis in the following JSON format:
    {
      "summary": "Brief overview of log analysis",
      "errorCount": number,
      "warningCount": number,
      "criticalIssues": ["list of critical issues found"],
      "patterns": ["recurring patterns or anomalies"],
      "recommendations": ["actionable recommendations"],
      "sentiment": "healthy|warning|critical",
      "keyMetrics": {
        "errorRate": "percentage",
        "commonErrors": ["most frequent errors"],
        "timePatterns": "when issues occur most"
      }
    }

    Focus on:
    1. Error patterns and frequency
    2. Performance indicators
    3. Security concerns
    4. Anomalous behavior
    5. Resource usage patterns
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback if JSON parsing fails
      return {
        summary: text,
        errorCount: 0,
        warningCount: 0,
        criticalIssues: [],
        patterns: [],
        recommendations: [],
        sentiment: 'unknown' as LogSentiment,
        keyMetrics: {
          errorRate: '0%',
          commonErrors: [],
          timePatterns: 'No pattern detected'
        }
      };
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      throw new Error('Failed to analyze logs with Gemini AI');
    }
  }

  // Real-time log classification
  async classifyLogEntry(logEntry: string): Promise<LogClassification> {
    if (!this.isInitialized) {
      return { level: 'info', confidence: 0, category: 'general' };
    }

    const prompt = `
    Classify this single log entry:
    "${logEntry}"

    Respond with JSON:
    {
      "level": "error|warning|info|debug",
      "confidence": 0.0-1.0,
      "category": "security|performance|application|system|network",
      "severity": "low|medium|high|critical",
      "actionRequired": boolean,
      "description": "brief explanation"
    }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        level: 'info',
        confidence: 0.5,
        category: 'general',
        severity: 'low',
        actionRequired: false,
        description: 'Standard log entry'
      };
    } catch (error) {
      console.error('Log classification failed:', error);
      return {
        level: 'info',
        confidence: 0,
        category: 'general',
        severity: 'low',
        actionRequired: false,
        description: 'Classification failed'
      };
    }
  }

  // Generate performance insights
  async generatePerformanceInsights(logs: string[]): Promise<PerformanceInsights> {
    if (!this.isInitialized) {
      throw new Error('Gemini service not initialized');
    }

    const processedLogs = this.preprocessLogs(logs);
    
    const prompt = `
    Analyze these Docker container logs for performance insights:

    LOGS:
    ${processedLogs}

    Provide performance analysis in JSON format:
    {
      "overallHealth": "excellent|good|fair|poor|critical",
      "performanceScore": 0-100,
      "bottlenecks": ["identified bottlenecks"],
      "resourceUsage": {
        "cpu": "analysis of CPU usage patterns",
        "memory": "analysis of memory usage patterns",
        "io": "analysis of I/O patterns"
      },
      "trends": ["performance trends over time"],
      "optimizations": ["suggested optimizations"],
      "alerts": ["immediate attention items"]
    }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        overallHealth: 'unknown',
        performanceScore: 0,
        bottlenecks: [],
        resourceUsage: {
          cpu: 'No data available',
          memory: 'No data available',
          io: 'No data available'
        },
        trends: [],
        optimizations: [],
        alerts: []
      };
    } catch (error) {
      console.error('Performance analysis failed:', error);
      throw new Error('Failed to generate performance insights');
    }
  }

  // Security threat detection
  async detectSecurityThreats(logs: string[]): Promise<SecurityAnalysis> {
    if (!this.isInitialized) {
      throw new Error('Gemini service not initialized');
    }

    const processedLogs = this.preprocessLogs(logs);
    
    const prompt = `
    Analyze these logs for security threats and vulnerabilities:

    LOGS:
    ${processedLogs}

    Provide security analysis in JSON format:
    {
      "threatLevel": "low|medium|high|critical",
      "threatsDetected": ["list of detected threats"],
      "vulnerabilities": ["potential vulnerabilities"],
      "suspiciousActivities": ["unusual patterns"],
      "recommendations": ["security recommendations"],
      "complianceIssues": ["compliance-related findings"],
      "riskScore": 0-100
    }

    Look for:
    - Failed authentication attempts
    - Unusual access patterns
    - Error patterns indicating attacks
    - Data exfiltration indicators
    - Privilege escalation attempts
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        threatLevel: 'low',
        threatsDetected: [],
        vulnerabilities: [],
        suspiciousActivities: [],
        recommendations: [],
        complianceIssues: [],
        riskScore: 0
      };
    } catch (error) {
      console.error('Security analysis failed:', error);
      throw new Error('Failed to detect security threats');
    }
  }
}

// Type definitions
export interface LogAnalysisResult {
  summary: string;
  errorCount: number;
  warningCount: number;
  criticalIssues: string[];
  patterns: string[];
  recommendations: string[];
  sentiment: LogSentiment;
  keyMetrics: {
    errorRate: string;
    commonErrors: string[];
    timePatterns: string;
  };
}

export interface LogClassification {
  level: 'error' | 'warning' | 'info' | 'debug';
  confidence: number;
  category: 'security' | 'performance' | 'application' | 'system' | 'network' | 'general';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: boolean;
  description?: string;
}

export interface PerformanceInsights {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | 'unknown';
  performanceScore: number;
  bottlenecks: string[];
  resourceUsage: {
    cpu: string;
    memory: string;
    io: string;
  };
  trends: string[];
  optimizations: string[];
  alerts: string[];
}

export interface SecurityAnalysis {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  threatsDetected: string[];
  vulnerabilities: string[];
  suspiciousActivities: string[];
  recommendations: string[];
  complianceIssues: string[];
  riskScore: number;
}

export type LogSentiment = 'healthy' | 'warning' | 'critical' | 'unknown';