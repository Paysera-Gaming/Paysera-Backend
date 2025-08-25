import { configEnv } from './config/dotenv';
import express from 'express';
import http from 'http';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import csurf from 'csurf';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import globalErrorHandler from './middlewares/errorHandler';
import YAML from 'yamljs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import routerEmployee from './routes/employee.routes';
import routerDepartment from './routes/department.routes';
import routerAttendance from './routes/attendance.routes';
import routerAuth from './routes/auth.routes';
import sampleRouter from './routes/sample.routes';
import routerHoliday from './routes/holiday.routes';
import routerDepartmentSchedule from './routes/departmentSchedule.routes';
import routerPersonalSchedule from './routes/personalSchedule.routes';
import { httpLoggerMiddleware } from './middlewares/logger';
import routerAnnouncement from './routes/announcement.routes';
import { Server } from "socket.io";

const app = express();
const port = configEnv.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // Trust first proxy in production
    app.enable('trust proxy');
}

// Rate limiting to prevent brute-force attacks
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for preflight requests
});

// Essential Middleware
app.use(limiter); // Rate limiting
app.use(cookieParser()); // Parse cookies
app.use(cors({
    origin: [configEnv.ORIGIN,], // Reflect the request origin
    credentials: true, // Allow sending cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow your React app to make requests

})); // Enable CORS
app.options('*', cors({
    origin: [configEnv.ORIGIN,], // Reflect the request origin
    credentials: true, // Allow sending cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow your React app to make requests
})); // Handle preflight requests
app.use(httpLoggerMiddleware);
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies
app.use(helmet()); // Security headers with Helmet
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(compression()); // Compress responses
// app.use(csurf({ cookie: true })); // CSRF protection

// Routes   
app.use(sampleRouter);
app.use("/api", routerAuth);
app.use("/api/announcements", routerAnnouncement);
app.use("/api/employee", routerEmployee);
app.use("/api/department", routerDepartment);
app.use("/api/attendance", routerAttendance)
app.use("/api/department-schedule", routerDepartmentSchedule);
app.use("/api/personal-schedule", routerPersonalSchedule);
app.use("/api/holiday", routerHoliday);

// Docs
// Serve static files for Swagger UI
const swaggerDocument = YAML.load(path.resolve(__dirname, './docs/swagger.yaml'));
app.use('/swagger-ui', express.static(path.join(__dirname, '../node_modules/swagger-ui-dist')));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { customCssUrl: '/swagger-ui/swagger-ui.css' }));

// Handle Error Middleware
app.use(globalErrorHandler);

// 404 Error Middleware`
app.use((req, res, next) => {
    res.status(404).send({ error: 'Route Not Found' });
});

// Export the server for testing
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [configEnv.ORIGIN, 'https://x3lkcvjr-5173.asse.devtunnels.ms', 'https://x3lkcvjr-5173.asse.devtunnels.ms'],  // Allow your React app to connect
        methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow your React app to make requests
    },
})

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

if (configEnv.NODE_ENV !== 'test') {
    server.listen(port, () => {
        console.log(`Server is running on port 8080 http://localhost:${port} Origin ${configEnv.ORIGIN}`);
    });
}

export { server, io };
export default app;