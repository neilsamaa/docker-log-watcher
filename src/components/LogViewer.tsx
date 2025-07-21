import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types/Container';
import { Terminal, Search, Trash2, Download, Pause, Play, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface LogViewerProps {
  logs: LogEntry[];
  containerName: string;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  error: string | null;
  onClearLogs: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  containerName,
  connectionStatus,
  error,
  onClearLogs
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter(log => 
    log.data?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
    }
  };

  const downloadLogs = () => {
    const logText = logs
      .map(log => `[${new Date(log.timestamp).toLocaleString()}] ${log.data || log.message}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${containerName}-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLogLevel = (logData: string) => {
    const lower = logData.toLowerCase();
    if (lower.includes('error') || lower.includes('err') || lower.includes('fatal') || lower.includes('exception')) {
      return { level: 'error', color: 'text-red-400', bg: 'bg-red-900/20', icon: AlertCircle };
    }
    if (lower.includes('warn') || lower.includes('warning')) {
      return { level: 'warning', color: 'text-yellow-400', bg: 'bg-yellow-900/20', icon: AlertTriangle };
    }
    if (lower.includes('info') || lower.includes('information')) {
      return { level: 'info', color: 'text-blue-400', bg: 'bg-blue-900/20', icon: Info };
    }
    if (lower.includes('debug') || lower.includes('trace')) {
      return { level: 'debug', color: 'text-gray-400', bg: 'bg-gray-900/20', icon: Terminal };
    }
    return { level: 'log', color: 'text-green-400', bg: 'bg-green-900/20', icon: Terminal };
  };

  const formatLogMessage = (message: string) => {
    // Split message into timestamp and content if it contains timestamp
    const timestampRegex = /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?)\s*(.*)$/;
    const match = message.match(timestampRegex);
    
    if (match) {
      return {
        timestamp: match[1],
        content: match[2] || message
      };
    }
    
    return {
      timestamp: null,
      content: message
    };
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'disconnected': return 'bg-red-500';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden h-full flex flex-col max-h-full">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-medium">
              {containerName || 'Select a container to view logs'}
            </h3>
            {containerName && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
                <span className="text-sm text-gray-400 capitalize">{connectionStatus}</span>
              </div>
            )}
          </div>
          
          {containerName && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`p-2 rounded-md transition-colors ${
                  autoScroll 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
              >
                {autoScroll ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={downloadLogs}
                className="p-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                title="Download logs"
                disabled={logs.length === 0}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClearLogs}
                className="p-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                title="Clear logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {containerName && (
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white placeholder-gray-400 rounded-md border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        )}
      </div>

      {/* Logs Display */}
      <div 
        ref={logsContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-gray-900 p-4 font-mono text-sm min-h-0"
        style={{ maxHeight: 'calc(100vh - 16rem)' }}
      >
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-md flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {!containerName ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Terminal className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a container to start monitoring logs</p>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg">
                {searchTerm ? `No logs found matching "${searchTerm}"` : 'No logs available'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {filteredLogs.map((log, index) => {
              const logLevel = getLogLevel(log.data || '');
              const formatted = formatLogMessage(log.data || log.message || '');
              const LogIcon = logLevel.icon;
              
              return (
                <div 
                  key={index} 
                  className={`mb-2 p-3 rounded-md border-l-4 ${logLevel.bg} border-l-${logLevel.color.replace('text-', '')}`}
                >
                  <div className="flex items-start gap-3">
                    <LogIcon className={`w-4 h-4 ${logLevel.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-400 text-xs font-medium">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${logLevel.bg} ${logLevel.color} border border-current/20`}>
                          {logLevel.level.toUpperCase()}
                        </span>
                        {formatted.timestamp && (
                          <span className="text-gray-500 text-xs">
                            {formatted.timestamp}
                          </span>
                        )}
                      </div>
                      <div className={`${logLevel.color} break-words leading-relaxed`}>
                        {formatted.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </>
        )}
      </div>
    </div>
  );
};