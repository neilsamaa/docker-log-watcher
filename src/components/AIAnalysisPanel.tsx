import React, { useState } from 'react';
import { Brain, TrendingUp, Shield, AlertTriangle, CheckCircle, XCircle, Loader, Eye, EyeOff } from 'lucide-react';
import { LogAnalysisResult, PerformanceInsights, SecurityAnalysis } from '../services/geminiService';

interface AIAnalysisPanelProps {
  logs: string[];
  isAnalyzing: boolean;
  analysisResult: LogAnalysisResult | null;
  performanceInsights: PerformanceInsights | null;
  securityAnalysis: SecurityAnalysis | null;
  error: string | null;
  onAnalyzeErrors: (logs: string[]) => void;
  onAnalyzePerformance: (logs: string[]) => void;
  onAnalyzeSecurity: (logs: string[]) => void;
  onClearAnalysis: () => void;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  logs,
  isAnalyzing,
  analysisResult,
  performanceInsights,
  securityAnalysis,
  error,
  onAnalyzeErrors,
  onAnalyzePerformance,
  onAnalyzeSecurity,
  onClearAnalysis
}) => {
  const [activeTab, setActiveTab] = useState<'errors' | 'performance' | 'security'>('errors');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isCollapsed) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">AI Analysis</h3>
          </div>
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-white" />
            <h3 className="text-xl font-semibold text-white">AI-Powered Log Analysis</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearAnalysis}
              className="px-3 py-1 bg-white/20 text-white rounded-md hover:bg-white/30 transition-colors text-sm"
            >
              Clear
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-2 text-white hover:bg-white/20 rounded-md transition-colors"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onAnalyzeErrors(logs)}
            disabled={isAnalyzing || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Analyze Errors
          </button>
          <button
            onClick={() => onAnalyzePerformance(logs)}
            disabled={isAnalyzing || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Performance Insights
          </button>
          <button
            onClick={() => onAnalyzeSecurity(logs)}
            disabled={isAnalyzing || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Shield className="w-4 h-4" />
            Security Analysis
          </button>
        </div>
        
        {logs.length === 0 && (
          <p className="mt-3 text-sm text-gray-500">No logs available for analysis</p>
        )}
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="p-6 text-center">
          <Loader className="w-8 h-8 mx-auto mb-3 text-purple-600 animate-spin" />
          <p className="text-gray-600">Analyzing logs with Gemini AI...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 font-medium">Analysis Error</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results Tabs */}
      {(analysisResult || performanceInsights || securityAnalysis) && !isAnalyzing && (
        <>
          <div className="border-b border-gray-200">
            <nav className="flex">
              {analysisResult && (
                <button
                  onClick={() => setActiveTab('errors')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'errors'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Error Analysis
                </button>
              )}
              {performanceInsights && (
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'performance'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Performance
                </button>
              )}
              {securityAnalysis && (
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'security'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Security
                </button>
              )}
            </nav>
          </div>

          {/* Results Content */}
          <div className="p-6">
            {/* Error Analysis Results */}
            {activeTab === 'errors' && analysisResult && (
              <div className="space-y-6">
                <div className={`p-4 rounded-lg border ${getSentimentColor(analysisResult.sentiment)}`}>
                  <h4 className="font-semibold mb-2">Overall Assessment</h4>
                  <p className="text-sm">{analysisResult.summary}</p>
                  <div className="mt-3 flex gap-4 text-sm">
                    <span>Errors: {analysisResult.errorCount}</span>
                    <span>Warnings: {analysisResult.warningCount}</span>
                    <span>Error Rate: {analysisResult.keyMetrics.errorRate}</span>
                  </div>
                </div>

                {analysisResult.criticalIssues.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-red-600">Critical Issues</h4>
                    <ul className="space-y-2">
                      {analysisResult.criticalIssues.map((issue, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-600">Recommendations</h4>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Performance Analysis Results */}
            {activeTab === 'performance' && performanceInsights && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Overall Health</h4>
                    <p className={`text-lg font-bold ${getHealthColor(performanceInsights.overallHealth)}`}>
                      {performanceInsights.overallHealth.toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600">Score: {performanceInsights.performanceScore}/100</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Resource Usage</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>CPU:</strong> {performanceInsights.resourceUsage.cpu}</p>
                      <p><strong>Memory:</strong> {performanceInsights.resourceUsage.memory}</p>
                      <p><strong>I/O:</strong> {performanceInsights.resourceUsage.io}</p>
                    </div>
                  </div>
                </div>

                {performanceInsights.bottlenecks.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-orange-600">Identified Bottlenecks</h4>
                    <ul className="space-y-2">
                      {performanceInsights.bottlenecks.map((bottleneck, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{bottleneck}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {performanceInsights.optimizations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">Optimization Suggestions</h4>
                    <ul className="space-y-2">
                      {performanceInsights.optimizations.map((opt, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{opt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Security Analysis Results */}
            {activeTab === 'security' && securityAnalysis && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${getThreatColor(securityAnalysis.threatLevel)}`}>
                    <h4 className="font-semibold mb-2">Threat Level</h4>
                    <p className="text-lg font-bold">
                      {securityAnalysis.threatLevel.toUpperCase()}
                    </p>
                    <p className="text-sm opacity-75">Risk Score: {securityAnalysis.riskScore}/100</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Threats Detected</h4>
                    <p className="text-2xl font-bold text-red-600">{securityAnalysis.threatsDetected.length}</p>
                    <p className="text-sm text-gray-600">Active threats found</p>
                  </div>
                </div>

                {securityAnalysis.threatsDetected.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-red-600">Detected Threats</h4>
                    <ul className="space-y-2">
                      {securityAnalysis.threatsDetected.map((threat, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Shield className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{threat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {securityAnalysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-600">Security Recommendations</h4>
                    <ul className="space-y-2">
                      {securityAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};