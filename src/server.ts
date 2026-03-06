import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app: Express = express();
const PORT = process.env.PORT || 3000;
const DATA_SERVICE_URL = process.env.DATA_SERVICE_URL || "http://localhost:3001";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:8080";

app.use(cors({ origin: CLIENT_ORIGIN, methods: ["GET"] }));

app.use((req: Request, res: Response, next: NextFunction): void => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});



app.use(
  "/",
  createProxyMiddleware({
    target: DATA_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq: any, req: any) => {
        console.log(`[Proxy] Reenviando a: ${DATA_SERVICE_URL}${req.url}`);
      },
      error: (err: Error, req: Request, res: any) => {
        console.error("[Proxy Error]", err.message);
        if (res.status) {
          res.status(503).json({ error: "El servicio de datos no esta disponible" });
        }
      },
    },
  })
);

app.get("/health", (req: Request, res: Response<{ status: string; service: string }>): void => {
  res.json({ status: "ok", service: "gateway" });
});

app.listen(PORT, () => {
  console.log(`[gateway] Corriendo en http://localhost:${PORT}`);
  console.log(`[gateway] Proxy dirigiendo a: ${DATA_SERVICE_URL}`);
  console.log(`[gateway] CORS aceptando origen: ${CLIENT_ORIGIN}`);
});

