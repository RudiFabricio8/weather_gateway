# 🔀 Gateway - API Gateway y Proxy

API Gateway que actúa como punto de entrada único, manejando CORS, enrutamiento y proxy hacia los servicios backend.

---

## 📋 Descripción

El Gateway es responsable de:
- Actuar como punto de entrada único para el frontend
- Configurar y manejar CORS (Cross-Origin Resource Sharing)
- Hacer proxy de peticiones hacia el data-service
- Registrar (logging) todas las peticiones entrantes
- Proveer health checks
- Manejar errores de servicios downstream

---

## 🛠️ Tecnologías

- **Node.js 18** - Runtime de JavaScript
- **Express 4.x** - Framework web
- **TypeScript 5** - Tipado estático
- **CORS** - Middleware de CORS
- **http-proxy-middleware** - Proxy inverso
- **dotenv** - Variables de entorno

---

## 📁 Estructura

```
gateway/
├── src/
│   └── server.ts          # Configuración del Gateway y proxy
├── dist/                  # Archivos compilados (generado)
├── node_modules/          # Dependencias (generado)
├── Dockerfile
├── .dockerignore
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Ejecución

### Con Docker (desde la raíz)
```bash
cd ..
docker-compose up gateway
```

### Localmente (desarrollo)
```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Ejecutar
npm start

# Modo desarrollo
npm run dev
```

---

## 🌐 Endpoints

### GET `/api/weather/current`

Proxy hacia el data-service para consultar clima.

**Query Parameters:**
- `city` (string, required) - Nombre de la ciudad

**Ejemplo de petición:**
```bash
curl "http://localhost:4000/api/weather/current?city=Monterrey"
```

**Respuesta exitosa (200):**
```json
{
  "name": "Monterrey",
  "main": {
    "temp": 25.3,
    "humidity": 60
  },
  "weather": [
    {
      "description": "cielo claro"
    }
  ],
  "wind": {
    "speed": 3.5
  },
  "_tempRounded": 25
}
```

**Respuestas de error:**

- **503 Service Unavailable** - Data-service no disponible
```json
{
  "error": "El servicio de datos no está disponible"
}
```

- Otros errores se proxy-an desde el data-service (400, 404, 500)

---

### GET `/health`

Health check del gateway.

**Ejemplo de petición:**
```bash
curl http://localhost:4000/health
```

**Respuesta (200):**
```json
{
  "status": "ok",
  "service": "gateway"
}
```

---

## 🔐 Variables de Entorno

Crear archivo `.env` en la raíz de `gateway/`:

```env
PORT=3000
DATA_SERVICE_URL=http://data-service:3001
CLIENT_ORIGIN=http://localhost:5000
```

| Variable | Descripción | Requerido | Default |
|----------|-------------|-----------|---------|
| `PORT` | Puerto del gateway | No | 3000 |
| `DATA_SERVICE_URL` | URL del data-service | No | http://localhost:3001 |
| `CLIENT_ORIGIN` | Origen permitido por CORS | No | http://localhost:8080 |

### Notas sobre Variables de Entorno

- **DATA_SERVICE_URL**: En Docker usa el nombre del servicio (`http://data-service:3001`)
- **CLIENT_ORIGIN**: Debe coincidir con el puerto del frontend
- **PORT**: Puerto interno del contenedor (se mapea externamente en docker-compose.yml)

---

## 📝 Scripts Disponibles

```json
{
  "build": "tsc",                       // Compilar TypeScript
  "start": "node dist/server.js",       // Ejecutar versión compilada
  "dev": "tsc && node dist/server.js"   // Compilar y ejecutar
}
```

---

## 🔍 Configuración CORS

El Gateway maneja CORS para permitir peticiones desde el frontend:

```typescript
app.use(cors({
    origin: CLIENT_ORIGIN,     // Solo permite este origen
    methods: ['GET']           // Solo permite método GET
}));
```

### ¿Por qué CORS en el Gateway?

- **Seguridad**: Controla qué dominios pueden acceder al API
- **Centralización**: Un solo punto de configuración de CORS
- **Protección**: El data-service no necesita exponer CORS públicamente

---

## 🔄 Configuración del Proxy

```typescript
app.use('/api/weather', createProxyMiddleware({
    target: DATA_SERVICE_URL,
    changeOrigin: true,
    on: {
        error: (err, req, res) => {
            console.error('[Proxy Error]', err.message);
            res.status(503).json({ 
                error: 'El servicio de datos no está disponible' 
            });
        }
    }
}));
```

### Funcionamiento

| Petición al Gateway | Proxy hacia Data-service |
|---------------------|--------------------------|
| `/api/weather/current?city=Madrid` | `/current?city=Madrid` |
| `/api/weather/forecast` | `/forecast` |

El middleware elimina el prefijo `/api/weather` antes de hacer proxy.

---

## 📊 Logging

Todas las peticiones son registradas automáticamente:

```
[2026-03-06T03:26:27.986Z] GET /api/weather/current?city=Monterrey
[2026-03-06T03:26:28.123Z] GET /health
```

### Formato de logs

```typescript
console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
```

---

## 🧪 Pruebas

### Probar CORS
```bash
# Desde el navegador (mismo origen que CLIENT_ORIGIN)
fetch('http://localhost:4000/api/weather/current?city=Madrid')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Probar proxy
```bash
# Petición directa al gateway
curl "http://localhost:4000/api/weather/current?city=Monterrey"

# Comparar con petición directa al data-service
curl "http://localhost:4001/current?city=Monterrey"
```

### Probar manejo de errores
```bash
# Detener data-service y probar
docker stop api_terceros-data-service-1
curl "http://localhost:4000/api/weather/current?city=Madrid"
# Debe devolver error 503
```

---

## 🐳 Docker

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### .dockerignore
```
node_modules
dist
*.log
.env.local
```

---

## 🔗 Dependencias

```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "http-proxy-middleware": "^3.0.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^4.17.25",
    "@types/node": "^20.19.37",
    "typescript": "^5.3.3"
  }
}
```

---

## 🏗️ Arquitectura

```
┌─────────────┐
│  Frontend   │
│  :5000      │
└──────┬──────┘
       │
       │ HTTP (CORS permitido)
       ▼
┌─────────────────────┐
│     Gateway         │
│     :4000           │
│                     │
│  • CORS Config      │
│  • Proxy Middleware │
│  • Request Logging  │
│  • Error Handling   │
└──────┬──────────────┘
       │
       │ HTTP Proxy
       ▼
┌─────────────────────┐
│   Data-service      │
│   :4001             │
└─────────────────────┘
```

---

## ⚙️ Configuración Avanzada

### Agregar nuevos proxies

```typescript
// Proxy para otro servicio
app.use('/api/users', createProxyMiddleware({
    target: 'http://user-service:3002',
    changeOrigin: true
}));
```

### Agregar autenticación (ejemplo)

```typescript
// Middleware de autenticación
app.use('/api/*', (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    // Validar token...
    next();
});
```

### Agregar rate limiting (ejemplo)

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // máximo 100 peticiones
});

app.use('/api/', limiter);
```

---

## 🔒 Seguridad

### Implementada
- ✅ CORS configurado con origen específico
- ✅ Métodos HTTP restringidos (solo GET)
- ✅ Manejo de errores sin exponer stack traces
- ✅ Variables de entorno para configuración

### Recomendaciones adicionales
- [ ] Agregar rate limiting
- [ ] Implementar autenticación (JWT)
- [ ] Agregar HTTPS en producción
- [ ] Implementar helmet.js para headers de seguridad
- [ ] Agregar validación de entrada

---

## 📈 Mejoras Futuras

- [ ] Agregar cache de respuestas
- [ ] Implementar circuit breaker
- [ ] Agregar métricas (Prometheus)
- [ ] Implementar load balancing
- [ ] Agregar tests de integración
- [ ] Logging estructurado (Winston)

---

## 🤝 Integración

Este servicio se integra con:
- **Frontend**: Recibe peticiones HTTP desde el navegador
- **Data-service**: Hace proxy de peticiones hacia el backend

**Beneficios del Gateway:**
- Punto de entrada único
- Desacoplamiento entre frontend y backend
- Facilita cambios en la arquitectura backend
- Centraliza seguridad y logging

---

## 👨‍💻 Mantenimiento

### Actualizar dependencias
```bash
npm update
```

### Verificar vulnerabilidades
```bash
npm audit
npm audit fix
```

### Recompilar después de cambios
```bash
npm run build
```

### Ver logs en Docker
```bash
docker logs api_terceros-gateway-1 -f
```

---

## 🐛 Troubleshooting

### Error: CORS blocked
**Problema:** Frontend no puede hacer peticiones  
**Solución:** Verificar que `CLIENT_ORIGIN` coincida con el puerto del frontend

### Error: 503 Service Unavailable
**Problema:** Gateway no puede comunicarse con data-service  
**Solución:** Verificar que data-service esté corriendo y `DATA_SERVICE_URL` sea correcta

### Error: Cannot GET /api/weather/current
**Problema:** Ruta incorrecta en el proxy  
**Solución:** Verificar configuración de `createProxyMiddleware`

---

**Gateway - Parte del proyecto WeatherSOA** 🔀
