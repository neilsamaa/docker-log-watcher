import React, { useState } from 'react';
import { ContainerSelector } from './components/ContainerSelector';
import { LogViewer } from './components/LogViewer';
import { useContainers } from './hooks/useContainers';
import { useWebSocket } from './hooks/useWebSocket';
import { Monitor } from 'lucide-react';

const WS_URL = process.env.NODE_ENV === 'production' 
  ? `ws://${window.location.host}/ws` 
  : 'ws://localhost:3001';

function App() {
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const { containers, filterInfo, loading, error, refetch } = useContainers();
  const { 
    logs, 
    connectionStatus, 
    error: wsError, 
    connect, 
    disconnect, 
    sendMessage, 
    clearLogs 
  } = useWebSocket(WS_URL);

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
      }, 100);
    }
  };

  const handleStopMonitoring = () => {
    sendMessage({ action: 'stop' });
    disconnect();
    setSelectedContainer('');
    clearLogs();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Monitor className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Docker Log Monitor</h1>
            </div>
            {selectedContainer && (
              <button
                onClick={handleStopMonitoring}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Stop Monitoring
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
    </div>
  );
}

export default App;