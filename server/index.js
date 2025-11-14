const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

require('dotenv').config({ path: '../.env' });

const createRouter = require('./routes/router');
const generateApi = require("./database/api");
const { nowET, formatET, getTimezoneInfo } = require('./utils/timezone');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP in production to avoid blocking assets
  crossOriginEmbedderPolicy: false
}));
// Only log HTTP requests in production
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
}
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ride-request-app', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('Connected to MongoDB'))
// .catch(err => console.error('MongoDB connection error:', err));


init();

async function init()
{
  const api = await generateApi();

  const router = createRouter(api);
  app.use(`/api`, router);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
  });

  // Serve static files from React app
  const staticPath = path.join(__dirname, '../client/dist');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Serving static files from:', staticPath);
  
  app.use(express.static(staticPath));
  
  // Catch-all route to serve React app - must be last!
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`🌍 Server Timezone: ${getTimezoneInfo()}`);
    console.log(`🕐 Current Time nowET (ET): ${formatET(nowET())}`);
    console.log(`⚠️  Note: All ride scheduling uses Eastern Time (America/New_York)`);
    const tz = process.env.TZ || 'UTC';
    const now = new Date();
    try {
      console.log(`Current server time (${tz}): ${now.toLocaleString('en-US', { timeZone: tz })}`);
    } catch (err) {
      console.log(`Current server time (system locale): ${now.toString()}`);
      console.warn(`Unable to format server time with timezone "${tz}":`, err.message);
    }
    console.log(`Current server time (ISO): ${now.toISOString()}`);
  });
}