import express from 'express';
import { WebSocketServer } from 'ws';
import Docker from 'dockerode';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const AUTH_USERNAME = process.env.AUTH_USERNAME || 'admin';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'admin';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null;

// Hash the password for comparison
const hashedPassword = bcrypt.hashSync(AUTH_PASSWORD, 10);

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

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Get monitored containers from environment
const getMonitoredContainers = () => {
  const monitored = process.env.MONITORED_CONTAINERS || 'all';
  if (monitored.toLowerCase() === 'all' || monitored.trim() === '') {
    return null; // Return null to indicate all containers
  }
  return monitored.split(',').map(name => name.trim()).filter(name => name.length > 0);
};

// Get container states from environment
const getContainerStates = () => {
  const states = process.env.CONTAINER_STATES || 'all';
  if (states.toLowerCase() === 'all' || states.trim() === '') {
    return null; // Return null to indicate all states
  }
  return states.split(',').map(state => state.trim().toLowerCase()).filter(state => state.length > 0);
};

// Filter containers based on configuration
const filterContainers = (containers) => {
  const monitoredContainers = getMonitoredContainers();
  const containerStates = getContainerStates();
  
  let filtered = containers;
  
  // Filter by container names
  if (monitoredContainers) {
    filtered = filtered.filter(container => {
      const containerName = container.Names[0].replace('/', '');
      return monitoredContainers.some(monitored => 
        containerName.includes(monitored) || monitored.includes(containerName)
      );
    });
  }
  
  // Filter by container states
  if (containerStates) {
    filtered = filtered.filter(container => {
      return containerStates.includes(container.State.toLowerCase());
    });
  }
  
  return filtered;
};

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  if (username !== AUTH_USERNAME || !bcrypt.compareSync(password, hashedPassword)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign(
    { username, timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  res.json({ success: true, token });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Verify token endpoint
app.get('/api/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Gemini API key endpoint (optional - for server-side key management)
app.get('/api/gemini-key', authenticateToken, (req, res) => {
  if (GEMINI_API_KEY) {
    res.json({ apiKey: GEMINI_API_KEY });
  } else {
    res.status(404).json({ error: 'Gemini API key not configured on server' });
  }
});

// API endpoint to get running containers (protected)
app.get('/api/containers', authenticateToken, async (req, res) => {
  try {
    if (!dockerAvailable) {
      return res.status(503).json({ 
        error: 'Docker is not available. Please ensure Docker is running and accessible.',
        containers: []
      });
    }
    
    const containers = await docker.listContainers({ all: true });
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
    const containerStates = getContainerStates();
    
    res.json({
      containers: containerInfo,
      filter: monitoredContainers ? monitoredContainers.join(', ') : 'all',
      states: containerStates ? containerStates.join(', ') : 'all',
      total: containers.length,
      filtered: containerInfo.length
    });
  } catch (error) {
    console.error('Error fetching containers:', error);
    res.status(500).json({ error: 'Failed to fetch containers' });
  }
});

// WebSocket authentication
const authenticateWebSocket = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// WebSocket connection for real-time logs (secured)
wss.on('connection', (ws, req) => {
  console.log('Client attempting WebSocket connection');
  let logStream = null;
  let container = null;
  let authenticated = false;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle authentication
      if (data.action === 'authenticate') {
        const user = authenticateWebSocket(data.token);
        if (user) {
          authenticated = true;
          ws.send(JSON.stringify({
            type: 'authenticated',
            message: 'WebSocket authenticated successfully'
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'WebSocket authentication failed'
          }));
          ws.close();
        }
        return;
      }
      
      // Check authentication for other actions
      if (!authenticated) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'WebSocket not authenticated'
        }));
        return;
      }
      
      if (!dockerAvailable) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Docker is not available. Please ensure Docker is running and accessible.'
        }));
        return;
      }
      
      if (data.action === 'start' && data.containerName) {
        // Stop previous stream if exists
        if (logStream) {
          logStream.destroy();
        }

        // Find container by name
        const containers = await docker.listContainers({ all: true });
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
  console.log(`DockLens server running on port ${PORT}`);
  console.log(`Authentication: Username=${AUTH_USERNAME}`);
});