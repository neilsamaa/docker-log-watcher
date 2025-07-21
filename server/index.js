import express from 'express';
import { WebSocketServer } from 'ws';
import Docker from 'dockerode';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Function to get Docker configuration based on platform
function getDockerConfig() {
  const platform = os.platform();
  
  if (process.env.DOCKER_SOCKET_PATH) {
    return { socketPath: process.env.DOCKER_SOCKET_PATH };
  }
  
  switch (platform) {
    case 'win32':
      return { socketPath: '//./pipe/docker_engine' };
    case 'darwin':
    case 'linux':
    default:
      return { socketPath: '/var/run/docker.sock' };
  }
}

// Initialize Docker connection with error handling
let docker;
let dockerAvailable = false;

try {
  docker = new Docker(getDockerConfig());
  // Test the connection
  await docker.ping();
  dockerAvailable = true;
  console.log('Docker connection established successfully');
} catch (error) {
  console.error('Docker connection failed:', error.message);
  console.log('Docker features will be disabled. Please ensure Docker is running and accessible.');
  dockerAvailable = false;
}

app.use(cors());
app.use(express.json());

// Get monitored containers from environment
const getMonitoredContainers = () => {
  const monitored = process.env.MONITORED_CONTAINERS || 'all';
  if (monitored.toLowerCase() === 'all' || monitored.trim() === '') {
    return null; // Return null to indicate all containers
  }
  return monitored.split(',').map(name => name.trim()).filter(name => name.length > 0);
};

// Filter containers based on configuration
const filterContainers = (containers) => {
  const monitoredContainers = getMonitoredContainers();
  
  if (!monitoredContainers) {
    return containers; // Return all containers
  }
  
  return containers.filter(container => {
    const containerName = container.Names[0].replace('/', '');
    return monitoredContainers.some(monitored => 
      containerName.includes(monitored) || monitored.includes(containerName)
    );
  });
};

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// API endpoint to get running containers
app.get('/api/containers', async (req, res) => {
  try {
    if (!dockerAvailable) {
      return res.status(503).json({ 
        error: 'Docker is not available. Please ensure Docker is running and accessible.',
        containers: []
      });
    }
    
    const containers = await docker.listContainers();
    const filteredContainers = filterContainers(containers);
    
    const containerInfo = filteredContainers.map(container => ({
      id: container.Id,
      name: container.Names[0].replace('/', ''),
      image: container.Image,
      status: container.Status,
      state: container.State,
      created: container.Created
    }));
    
    const monitoredContainers = getMonitoredContainers();
    res.json({
      containers: containerInfo,
      filter: monitoredContainers ? monitoredContainers.join(', ') : 'all',
      total: containers.length,
      filtered: containerInfo.length
    });
  } catch (error) {
    console.error('Error fetching containers:', error);
    res.status(500).json({ error: 'Failed to fetch containers' });
  }
});

// WebSocket connection for real-time logs
wss.on('connection', (ws) => {
  console.log('Client connected for log monitoring');
  let logStream = null;
  let container = null;

  ws.on('message', async (message) => {
    try {
      if (!dockerAvailable) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Docker is not available. Please ensure Docker is running and accessible.'
        }));
        return;
      }
      
      const data = JSON.parse(message.toString());
      
      if (data.action === 'start' && data.containerName) {
        // Stop previous stream if exists
        if (logStream) {
          logStream.destroy();
        }

        // Find container by name
        const containers = await docker.listContainers();
        const targetContainer = containers.find(c => 
          c.Names.some(name => name.replace('/', '') === data.containerName)
        );

        if (!targetContainer) {
          ws.send(JSON.stringify({
            type: 'error',
            message: `Container '${data.containerName}' not found`
          }));
          return;
        }

        container = docker.getContainer(targetContainer.Id);
        
        // Start log streaming
        logStream = await container.logs({
          follow: true,
          stdout: true,
          stderr: true,
          timestamps: true,
          tail: 100
        });

        logStream.on('data', (chunk) => {
          // Docker log format includes 8-byte header, so we need to parse it
          const logData = chunk.toString('utf8');
          const lines = logData.split('\n').filter(line => line.trim());
          
          lines.forEach(line => {
            if (line.length > 8) {
              // Remove Docker's 8-byte header
              const cleanLine = line.slice(8);
              ws.send(JSON.stringify({
                type: 'log',
                data: cleanLine,
                timestamp: new Date().toISOString(),
                containerName: data.containerName
              }));
            }
          });
        });

        logStream.on('error', (error) => {
          console.error('Log stream error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Log stream error: ' + error.message
          }));
        });

        ws.send(JSON.stringify({
          type: 'connected',
          containerName: data.containerName
        }));
      }

      if (data.action === 'stop') {
        if (logStream) {
          logStream.destroy();
          logStream = null;
        }
        ws.send(JSON.stringify({
          type: 'disconnected'
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (logStream) {
      logStream.destroy();
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    docker: dockerAvailable ? 'connected' : 'unavailable'
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Docker Log Monitor server running on port ${PORT}`);
});