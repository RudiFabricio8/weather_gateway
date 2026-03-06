"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const DATA_SERVICE_URL = process.env.DATA_SERVICE_URL || 'http://localhost:3001';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:8080';
app.use((0, cors_1.default)({
    origin: CLIENT_ORIGIN,
    methods: ['GET']
}));
// Middleware de registro de peticiones
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});
// Configuración del Proxy
app.use('/api/weather', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: DATA_SERVICE_URL,
    changeOrigin: true,
    on: {
        error: (err, req, res) => {
            console.error('[Proxy Error]', err.message);
            // Verificamos que res sea un objeto de respuesta válido antes de enviar
            if (res.status) {
                res.status(503).json({ error: 'El servicio de datos no está disponible' });
            }
        }
    }
}));
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gateway' });
});
app.listen(PORT, () => {
    console.log(`[gateway] Corriendo en http://localhost:${PORT}`);
    console.log(`[gateway] Proxy dirigiendo a: ${DATA_SERVICE_URL}`);
    console.log(`[gateway] CORS aceptando origen: ${CLIENT_ORIGIN}`);
});
