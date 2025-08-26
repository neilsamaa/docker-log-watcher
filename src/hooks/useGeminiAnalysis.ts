import { useState, useCallback } from 'react';
import { GeminiLogAnalysisService, LogAnalysisResult, PerformanceInsights, SecurityAnalysis } from '../services/geminiService';

export const useGeminiAnalysis = (apiKey: string | null) => {
  const [service, setService] = useState<GeminiLogAnalysisService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<LogAnalysisResult | null>(null);
  const [performanceInsights, setPerformanceInsights] = useState<PerformanceInsights | null>(null);
  const [securityAnalysis, setSecurityAnalysis] = useState<SecurityAnalysis | null>(null);

  const initializeService = useCallback(async () => {
    if (!apiKey) {
      setError('Gemini API key not provided');
      return false;
    }

    if (apiKey.trim().length < 10) {
      setError('Invalid API key format. Please check your Gemini API key.');
      return false;
    }

    try {
      const geminiService = new GeminiLogAnalysisService(apiKey);
      const initialized = await geminiService.initialize();
      
      if (initialized) {
        setService(geminiService);
        setIsInitialized(true);
        setError(null);
        return true;
      } else {
        setError('Failed to initialize Gemini AI service');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown initialization error';
      setError(errorMessage);
      setService(null);
      setIsInitialized(false);
      return false;
    }
  }, [apiKey]);

  const analyzeErrors = useCallback(async (logs: string[]) => {
    if (!service || !isInitialized) {
      setError('Gemini service not initialized');
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await service.analyzeErrors(logs);
      setAnalysisResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [service, isInitialized]);

  const generatePerformanceInsights = useCallback(async (logs: string[]) => {
    if (!service || !isInitialized) {
      setError('Gemini service not initialized');
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await service.generatePerformanceInsights(logs);
      setPerformanceInsights(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Performance analysis failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [service, isInitialized]);

  const detectSecurityThreats = useCallback(async (logs: string[]) => {
    if (!service || !isInitialized) {
      setError('Gemini service not initialized');
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await service.detectSecurityThreats(logs);
      setSecurityAnalysis(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Security analysis failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [service, isInitialized]);

  const clearAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setPerformanceInsights(null);
    setSecurityAnalysis(null);
    setError(null);
  }, []);

  return {
    isInitialized,
    isAnalyzing,
    error,
    analysisResult,
    performanceInsights,
    securityAnalysis,
    initializeService,
    analyzeErrors,
    generatePerformanceInsights,
    detectSecurityThreats,
    clearAnalysis
  };
};