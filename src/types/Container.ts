export interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  created: number;
}

export interface LogEntry {
  type: 'log' | 'error' | 'connected' | 'disconnected';
  data?: string;
  message?: string;
  timestamp: string;
  containerName?: string;
}