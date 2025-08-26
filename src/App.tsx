import React, { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { ContainerSelector } from './components/ContainerSelector';
import { LogViewer } from './components/LogViewer';
import { useAuth } from './hooks/useAuth';
import { useContainers } from './hooks/useContainers';
import { useWebSocket } from './hooks/useWebSocket';
import { useGeminiAnalysis } from './hooks/useGeminiAnalysis';
import { AIAnalysisPanel } from './components/AIAnalysisPanel';
import { GeminiSetup } from './components/GeminiSetup';
import { Monitor, LogOut, User } from 'lucide-react';
import HeaderLogo from './assets/header-logo.png';

const WS_URL = window.location.protocol === 'https:'
  ? `wss://${window.location.host}/ws`
  : `ws://${window.location.host}/ws`;

function App() {
  const { user, loading: authLoading, error: authError, login, logout, getToken, isAuthenticated } = useAuth();
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(
    localStorage.getItem('gemini_api_key')
  );
  const { containers, filterInfo, loading, error, refetch } = useContainers(isAuthenticated);
  const { 
    logs, 
    connectionStatus, 
    error: wsError, 
    connect, 
    disconnect, 
    sendMessage, 
    clearLogs 
  } = useWebSocket(WS_URL, getToken());
  
  const {
    isInitialized: geminiInitialized,
    isAnalyzing,
    error: geminiError,
    analysisResult,
    performanceInsights,
    securityAnalysis,
    initializeService,
    analyzeErrors,
    generatePerformanceInsights,
    detectSecurityThreats,
    clearAnalysis
  } = useGeminiAnalysis(geminiApiKey);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Monitor className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} loading={authLoading} error={authError} />;
  }

  const handleContainerSelect = (containerName: string) => {
    // Stop current monitoring
    if (selectedContainer) {
      sendMessage({ action: 'stop' });
      disconnect();
    }

    setSelectedContainer(containerName);
    clearLogs();

    // Start new monitoring
    if (containerName) {
      connect();
      setTimeout(() => {
        sendMessage({ action: 'start', containerName });
      }, 300);
    }
  };

  const handleStopMonitoring = () => {
    sendMessage({ action: 'stop' });
    disconnect();
    setSelectedContainer('');
    clearLogs();
  };

  const handleGeminiApiKeySubmit = async (apiKey: string) => {
    setGeminiApiKey(apiKey);
    localStorage.setItem('gemini_api_key', apiKey);
    await initializeService();
  };

  const getLogStrings = () => {
    return logs.map(log => log.data || log.message || '').filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {/* <Monitor className="w-8 h-8 text-blue-600" /> */}
              <img src={HeaderLogo} alt="DockLens Logo" className="w-[200px]" />
              {/* <h1 className="text-xl font-bold text-gray-900">DockLens</h1> */}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.username}</span>
              </div>
              {selectedContainer && (
                <button
                  onClick={handleStopMonitoring}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Stop Monitoring
                </button>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Gemini AI Setup */}
          {!geminiInitialized && (
            <GeminiSetup
              onApiKeySubmit={handleGeminiApiKeySubmit}
              isInitializing={isAnalyzing}
              error={geminiError}
              isInitialized={geminiInitialized}
            />
          )}

          {/* AI Analysis Panel */}
          {geminiInitialized && selectedContainer && (
            <AIAnalysisPanel
              logs={getLogStrings()}
              isAnalyzing={isAnalyzing}
              analysisResult={analysisResult}
              performanceInsights={performanceInsights}
              securityAnalysis={securityAnalysis}
              error={geminiError}
              onAnalyzeErrors={analyzeErrors}
              onAnalyzePerformance={generatePerformanceInsights}
              onAnalyzeSecurity={detectSecurityThreats}
              onClearAnalysis={clearAnalysis}
            />
          )}

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
          {/* Container Selector */}
          <div className="lg:col-span-2">
            <ContainerSelector
              containers={containers}
              filterInfo={filterInfo}
              selectedContainer={selectedContainer}
              onContainerSelect={handleContainerSelect}
              onRefresh={refetch}
              loading={loading}
              error={error}
            />
          </div>

          {/* Log Viewer */}
          <div className="lg:col-span-5">
            <LogViewer
              logs={logs}
              containerName={selectedContainer}
              connectionStatus={connectionStatus}
              error={wsError}
              onClearLogs={clearLogs}
            />
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}

export default App;