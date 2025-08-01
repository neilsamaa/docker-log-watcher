import { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types/Container';

export const useWebSocket = (url: string, token: string | null) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN || !token) {
      return;
    }

    setConnectionStatus('connecting');
    setError(null);
    
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      // Authenticate WebSocket connection
      if (token) {
        ws.current?.send(JSON.stringify({
          action: 'authenticate',
          token: token
        }));
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const logEntry: LogEntry = JSON.parse(event.data);
        
        if (logEntry.type === 'authenticated') {
          setConnectionStatus('connected');
          setError(null);
        } else if (logEntry.type === 'error') {
          setError(logEntry.message || 'Unknown error');
          if (logEntry.message?.includes('authentication')) {
            setConnectionStatus('disconnected');
          }
        } else if (logEntry.type === 'log') {
          setLogs(prev => [...prev, logEntry]);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.current.onclose = () => {
      setConnectionStatus('disconnected');
    };

    ws.current.onerror = () => {
      setError('WebSocket connection error');
      setConnectionStatus('disconnected');
    };
  };

  const disconnect = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setConnectionStatus('disconnected');
  };

  const sendMessage = (message: any) => {
    ws.current?.send(JSON.stringify(message));
    // if (ws.current?.readyState === WebSocket.OPEN && connectionStatus === 'connected') {
    //   ws.current.send(JSON.stringify(message));
    // }
  };

  const clearLogs = () => {
    setLogs([]);
    setError(null);
  };

  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return {
    logs,
    connectionStatus,
    error,
    connect,
    disconnect,
    sendMessage,
    clearLogs
  };
};