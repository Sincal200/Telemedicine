# Reestructuración del Servidor de Telemedicina

## Cambios Realizados

### 1. Separación de Responsabilidades

#### Antes:
- Todo el código de señalización WebSocket estaba en `signaling-server.js`
- Mezcla de lógica de API REST y WebSocket en un solo archivo

#### Después:
- **`signaling-server.js`**: Servidor principal de la API REST
- **`sockets/webrtc-signaling.js`**: Clase dedicada para manejo de WebSocket y señalización WebRTC
- **`routes/telemedicine.js`**: Rutas organizadas de la API de telemedicina
- **`config/signaling-config.js`**: Configuración centralizada

### 2. Nuevos Archivos Creados

#### `sockets/webrtc-signaling.js`
- Clase `WebRTCSignalingServer` que encapsula toda la lógica de señalización
- Manejo de salas, usuarios y mensajes WebRTC
- Métodos para broadcast y envío de mensajes específicos

#### `routes/telemedicine.js`
- Rutas organizadas para la API de telemedicina
- Endpoints para:
  - `/api/telemedicine/authenticate` - Autenticación
  - `/api/telemedicine/authorize` - Autorización
  - `/api/telemedicine/rooms/stats` - Estadísticas de salas
  - `/api/telemedicine/rooms/create` - Crear sala de consulta
  - `/api/telemedicine/rooms/join` - Unirse a sala
  - `/api/telemedicine/consultations/history` - Historial de consultas

#### `config/signaling-config.js`
- Configuración centralizada para WebSocket
- Configuración de salas y límites
- Configuración de logging

### 3. Estructura Actual

```
telemedicine/
├── signaling-server.js          # Servidor principal (API REST)
├── config/
│   ├── database.js
│   └── signaling-config.js      # Nueva configuración
├── routes/
│   └── telemedicine.js          # Nuevas rutas organizadas
├── sockets/
│   └── webrtc-signaling.js      # Nueva clase de señalización
├── controllers/
├── middleware/
├── models/
├── services/
└── utils/
```

### 4. Ventajas de la Nueva Estructura

1. **Separación de Responsabilidades**: API REST y WebSocket están separados
2. **Mantenibilidad**: Código más organizado y fácil de mantener
3. **Escalabilidad**: Fácil agregar nuevas funcionalidades a cada módulo
4. **Testabilidad**: Cada módulo se puede testear independientemente
5. **Reutilización**: La clase de señalización se puede usar en otros proyectos

### 5. Endpoints Disponibles

#### API REST (HTTP)
- `GET /authenticate` - Verificar autenticación
- `GET /authorize` - Verificar autorización (solo doctores)
- `GET /api/telemedicine/authenticate` - Autenticación con respuesta JSON
- `GET /api/telemedicine/authorize` - Autorización con respuesta JSON
- `GET /api/telemedicine/rooms/stats` - Estadísticas de salas activas
- `POST /api/telemedicine/rooms/create` - Crear nueva sala de consulta
- `POST /api/telemedicine/rooms/join` - Unirse a una sala
- `GET /api/telemedicine/consultations/history` - Historial de consultas

#### WebSocket
- Conexión: `ws://localhost:3002`
- Mensajes soportados:
  - `join-room` - Unirse a una sala
  - `leave-room` - Salir de una sala
  - `offer` - Oferta WebRTC
  - `answer` - Respuesta WebRTC
  - `candidate` - Candidato ICE

### 6. Próximos Pasos Recomendados

1. **Integrar con Base de Datos**: Conectar las rutas con la base de datos MySQL
2. **Middleware de Validación**: Agregar validación de datos de entrada
3. **Logging Mejorado**: Implementar sistema de logs más robusto
4. **Tests**: Crear tests unitarios e integración
5. **Documentación API**: Crear documentación Swagger/OpenAPI
6. **Rate Limiting**: Implementar límites de tasa para las APIs
7. **Autenticación WebSocket**: Mejorar la autenticación para conexiones WebSocket

### 7. Uso del Nuevo Sistema

#### Para conectarse vía WebSocket:
```javascript
const ws = new WebSocket('ws://localhost:3002');

// Unirse a una sala
ws.send(JSON.stringify({
    type: 'join-room',
    roomId: 'consultation-123',
    userId: 'user-456',
    userRole: 'doctor'
}));
```

#### Para usar la API REST:
```javascript
// Obtener estadísticas de salas
fetch('/api/telemedicine/rooms/stats', {
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
    }
})
.then(response => response.json())
.then(data => console.log(data));
```
