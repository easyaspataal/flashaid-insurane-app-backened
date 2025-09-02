import express from 'express';
import cors from 'cors';
import insuranceRoutes from './insuranceApi/insuranceRoutes.js';
import payuRoutes from './payU/payu.routes.js'; 
import { checkConnection } from './db/pgDb.js';

const app = express();

// ✅ Check DB connection on startup
checkConnection(); 

// ✅ Configure CORS
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://172.168.201.98:3000", // my mac ip address running in my android mobile browser           
    "https://uat-k42.insuranceapp.flashaid.in", 
    "https://expats.flashaid.in", 
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ Handle preflight requests explicitly
app.options('*', cors());

// ✅ Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ API Routes
app.use("/api/insurance", insuranceRoutes);
app.use("/api/payu", payuRoutes);



// ✅ Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'Insurance API Server is running', version: '1.0.0' });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ✅ 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}`);
  console.log(`🔗 API base: http://localhost:${PORT}/api/insurance`);
});




