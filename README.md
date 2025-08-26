# DockeLens

A real-time web-based Docker container log monitoring application with manual container selection.

## Features

- 🐳 Real-time Docker container log streaming
- 🧠 AI-powered log analysis with Google Gemini
- 🎯 Manual container selection by name
- 🔍 Live log search and filtering
- 📱 Responsive design for all devices
- 🎨 Terminal-like interface with syntax highlighting
- 📥 Export logs to text files
- ⏸️ Auto-scroll control
- 🔄 Real-time container status updates
- 🔐 Authentication system with secure login
- 🏷️ Log filtering by level (error, warning, info, debug)
- 🔒 Secure WebSocket connections with JWT tokens
- ⚙️ Container state filtering (running, stopped, etc.)

### AI Analysis Features
- 🤖 Intelligent error pattern detection
- 📊 Performance bottleneck identification  
- 🛡️ Security threat analysis
- 💡 Automated recommendations
- 📈 Real-time log classification
- 🎯 Anomaly detection

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server (client + server)
npm run dev
```

### Docker Deployment

#### Option 1: Docker Compose (Recommended)

```bash
# Build and start with docker-compose
docker-compose up --build -d

# View logs
docker-compose logs -f docklens

# To monitor specific containers, edit docker-compose.yml:
# MONITORED_CONTAINERS=nginx,postgres,redis

# Stop services
docker-compose down
```

#### Option 2: Manual Docker Build

```bash
# Build the application
npm run build

# Build Docker image
docker build -t docklens .

# Run container
docker run -d \
  --name docklens \
  -p 3001:3001 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  docklens
```

### Production Commands

```bash
# Build for production
npm run build

# Start production server
npm start

# Build Docker image
npm run build:docker
```

## Environment Variables

### Core Configuration
- `NODE_ENV`: Set to 'production' for production builds (default: development)
- `PORT`: Server port (default: 3001)
- `DOCKER_SOCKET_PATH`: Path to Docker socket (default: /var/run/docker.sock)

### Container Filtering
- `MONITORED_CONTAINERS`: Container name filter
  - `all` or empty: Show all containers (default)
  - `container1,container2`: Show only specified containers
  - Supports partial name matching
- `CONTAINER_STATES`: Container state filter
  - `all` or empty: Show containers in all states (default)
  - `running,stopped,exited`: Show only containers in specified states
  - Available states: running, stopped, exited, paused, restarting, removing, dead, created

### Authentication & Security
- `AUTH_USERNAME`: Login username (default: admin)
- `AUTH_PASSWORD`: Login password (default: changeme)
- `JWT_SECRET`: Secret key for JWT tokens (default: auto-generated, change in production)

### AI Analysis (Optional)
- `GEMINI_API_KEY`: Google Gemini API key for AI-powered log analysis
  - Get your key from [Google AI Studio](https://makersuite.google.com/app/apikey)
  - Can also be configured in the web interface

## Docker Socket Access

The application requires access to the Docker daemon socket (`/var/run/docker.sock`) to:
- List running containers
- Stream container logs in real-time
- Monitor container status

**Security Note**: Mounting the Docker socket gives the container significant privileges. Only run this in trusted environments.

## API Endpoints

- `POST /api/login` - User authentication
- `POST /api/logout` - User logout
- `GET /api/verify` - Verify authentication token
- `GET /api/containers` - List filtered containers (requires authentication)
- `GET /api/health` - Health check endpoint
- `GET /api/gemini-key` - Get server-configured Gemini API key (optional)
- `WebSocket /ws` - Real-time log streaming (requires authentication)

## AI Analysis Setup

### Option 1: Web Interface Setup (Recommended)
1. Login to DockLens dashboard
2. Click "Setup Gemini AI Analysis" 
3. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
4. Enter the key and click "Connect Gemini AI"

### Option 2: Server Environment Variable
Set `GEMINI_API_KEY` in your environment or docker-compose.yml:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### AI Analysis Capabilities
- **Error Analysis**: Detect patterns, categorize errors, identify root causes
- **Performance Insights**: Find bottlenecks, resource usage patterns, optimization suggestions  
- **Security Analysis**: Threat detection, vulnerability assessment, compliance checking
- **Real-time Classification**: Automatic log level and category detection
- **Intelligent Recommendations**: Actionable insights based on log patterns

## Security Features

- **Authentication Required**: All API endpoints and WebSocket connections require valid authentication
- **JWT Tokens**: Secure token-based authentication with configurable expiration
- **Password Hashing**: Passwords are hashed using bcrypt for secure storage
- **Secure Cookies**: HTTP-only cookies for token storage in production
- **WebSocket Security**: Token-based WebSocket authentication

## Log Filtering

The application automatically detects and categorizes log levels:
- **Error**: Lines containing 'error', 'err', 'fatal', 'exception'
- **Warning**: Lines containing 'warn', 'warning'
- **Info**: Lines containing 'info', 'information'
- **Debug**: Lines containing 'debug', 'trace'
- **Log**: All other log entries

Users can filter logs by level using the filter dropdown in the log viewer.

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

## License

MIT