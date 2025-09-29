# 🚀 Guía de Despliegue en Render

## 📋 Prerrequisitos

1. **Cuenta de Render**: [render.com](https://render.com)
2. **MongoDB Atlas**: [mongodb.com/atlas](https://mongodb.com/atlas)
3. **Repositorio en GitHub**: Tu código debe estar en GitHub

## 🔧 Configuración de MongoDB Atlas

### 1. Crear Cluster
- Ve a [MongoDB Atlas](https://cloud.mongodb.com)
- Crea un nuevo cluster (gratis)
- Configura la región más cercana a tus usuarios

### 2. Configurar Acceso
- **Database Access**: Crea un usuario con permisos de lectura/escritura
- **Network Access**: Agrega `0.0.0.0/0` para permitir conexiones desde cualquier IP

### 3. Obtener Connection String
- Ve a "Connect" → "Connect your application"
- Copia la cadena de conexión
- Reemplaza `<password>` con la contraseña del usuario creado

## 🚀 Despliegue en Render

### Opción 1: Despliegue Automático con render.yaml

1. **Conectar Repositorio**:
   - Ve a [Render Dashboard](https://dashboard.render.com)
   - Click en "New" → "Blueprint"
   - Conecta tu repositorio de GitHub

2. **Configurar Variables de Entorno**:
   En el dashboard de Render, configura estas variables:

   | Variable | Valor | Descripción |
   |----------|-------|-------------|
   | `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/uml?retryWrites=true&w=majority` | Cadena de conexión a MongoDB Atlas |
   | `GROQ_API_KEY` | `gsk_...` | API Key de Groq (opcional, para chatbot) |
   | `FRONTEND_URL` | `https://tu-app.onrender.com` | URL de tu aplicación en producción |

3. **Desplegar**:
   - Render detectará automáticamente el archivo `render.yaml`
   - Creará dos servicios: la app Next.js y el servidor Socket.IO

### Opción 2: Despliegue Manual

#### Servicio 1: Aplicación Next.js
1. **Crear Web Service**:
   - Click en "New" → "Web Service"
   - Conecta tu repositorio
   - Configuración:
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Environment**: `Node`

2. **Variables de Entorno**:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/uml?retryWrites=true&w=majority
   GROQ_API_KEY=tu-groq-api-key
   FRONTEND_URL=https://tu-app.onrender.com
   ```

#### Servicio 2: Servidor Socket.IO
1. **Crear Web Service**:
   - Click en "New" → "Web Service"
   - Conecta tu repositorio
   - Configuración:
     - **Build Command**: `npm install`
     - **Start Command**: `node server/socket.js`
     - **Environment**: `Node`

2. **Variables de Entorno**:
   ```
   NODE_ENV=production
   SOCKET_PORT=10000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/uml?retryWrites=true&w=majority
   ```

## 🔄 Actualización del Cliente Socket.IO

Actualiza el hook `useSocketIO.ts` para usar la URL de producción:

```typescript
// En src/hooks/useSocketIO.ts
const socket = io(
  process.env.NODE_ENV === 'production' 
    ? 'https://tu-socket-server.onrender.com' 
    : 'http://localhost:3001', 
  {
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    timeout: 20000,
  }
);
```

## 📁 Archivos Creados/Modificados

### ✅ Archivos Nuevos
- `render.yaml` - Configuración de despliegue automático
- `Dockerfile` - Imagen Docker para Render
- `RENDER_DEPLOYMENT.md` - Esta guía

### ✅ Archivos Modificados
- `server/socket.js` - Configuración para Render
- `next.config.ts` - Output standalone para Render
- `package.json` - Scripts de build

## 🐛 Solución de Problemas

### Error de Conexión a MongoDB
```bash
# Verifica que MONGODB_URI esté configurada correctamente
# Asegúrate de que la IP esté en la whitelist de MongoDB Atlas
```

### Error de Socket.IO
```bash
# Verifica que el servidor Socket.IO esté ejecutándose
# Asegúrate de que CORS esté configurado correctamente
# Revisa los logs del servicio Socket.IO en Render
```

### Error de Build
```bash
# Verifica que todas las dependencias estén en package.json
# Asegúrate de que no haya errores de TypeScript
# Revisa los logs de build en Render
```

## 🔍 Verificación Post-Despliegue

1. **Aplicación Principal**: Verifica que la app Next.js cargue correctamente
2. **Socket.IO**: Prueba la colaboración en tiempo real
3. **MongoDB**: Verifica que los diagramas se guarden
4. **Chatbot**: Verifica que funcione (si está habilitado)

## 📊 Monitoreo

- **Render Dashboard**: Métricas de rendimiento y logs
- **MongoDB Atlas**: Monitoreo de la base de datos
- **Health Checks**: Render verifica automáticamente la salud de los servicios

## 🔄 Actualizaciones Futuras

Para actualizar la aplicación:
```bash
git add .
git commit -m "Update app"
git push origin main
# Render desplegará automáticamente
```

## 💡 Tips de Optimización

1. **MongoDB Indexes**: Asegúrate de tener índices en `diagramId`
2. **Render Free Tier**: Tiene limitaciones de tiempo de inactividad
3. **WebSockets**: Render soporta WebSockets nativamente
4. **Environment Variables**: Usa variables de entorno para diferentes ambientes

## 🆓 Limitaciones del Plan Gratuito

- **Sleep Mode**: Los servicios se duermen después de 15 minutos de inactividad
- **Build Time**: Máximo 90 minutos por build
- **Bandwidth**: 100GB por mes
- **CPU**: 0.1 CPU, 512MB RAM

## 🚀 Upgrade a Plan Pago

Para producción, considera upgrade a:
- **Starter Plan**: $7/mes por servicio
- **Professional Plan**: $25/mes por servicio
- Sin sleep mode, más recursos, mejor rendimiento

¡Tu aplicación UML está lista para producción en Render! 🎉
