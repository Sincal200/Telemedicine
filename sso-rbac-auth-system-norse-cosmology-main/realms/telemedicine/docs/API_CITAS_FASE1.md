# API de Gestión de Citas - Sistema de Telemedicina

## Fase 1: Funcionalidad de Agenda Implementada

### Endpoints Disponibles

#### 1. Configuración Inicial del Sistema

**Configurar datos básicos:**
```http
POST /api/setup/datos-basicos
```

**Configurar datos de ejemplo:**
```http
POST /api/setup/datos-ejemplo
```

**Configuración completa:**
```http
POST /api/setup/completo
```

#### 2. Buscar Horarios Disponibles

**Endpoint:**
```http
GET /api/cita/horarios-disponibles
```

**Parámetros requeridos:**
- `especialidadId`: ID de la especialidad médica
- `fechaInicio`: Fecha de inicio (YYYY-MM-DD)
- `fechaFin`: Fecha de fin (YYYY-MM-DD)

**Parámetros opcionales:**
- `tipoCitaId`: ID del tipo de cita
- `personalMedicoId`: ID de un médico específico

**Ejemplo de petición:**
```bash
curl -X GET "http://localhost:3002/api/cita/horarios-disponibles?especialidadId=1&fechaInicio=2025-08-26&fechaFin=2025-08-30"
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "personalMedicoId": 1,
      "fechaHora": "2025-08-26 08:00:00",
      "duracionMinutos": 30,
      "medico": {
        "id": 1,
        "nombre": "Juan Pérez",
        "especialidad": "Medicina General"
      }
    }
  ],
  "total": 15,
  "filtros": {
    "especialidadId": 1,
    "fechaInicio": "2025-08-26",
    "fechaFin": "2025-08-30"
  }
}
```

#### 3. Programar Nueva Cita

**Endpoint:**
```http
POST /api/cita/programar
```

**Cuerpo de la petición:**
```json
{
  "pacienteId": 1,
  "personalMedicoId": 1,
  "fechaHora": "2025-08-26 08:00:00",
  "tipoCitaId": 1,
  "motivo": "Consulta médica general",
  "prioridadId": 1
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Cita programada exitosamente",
  "data": {
    "idCita": 1,
    "numero_cita": "25082600001",
    "paciente_id": 1,
    "personal_medico_id": 1,
    "fecha_hora": "2025-08-26T08:00:00.000Z",
    "estado_cita_id": 1,
    "paciente": { ... },
    "personal_medico": { ... }
  }
}
```

#### 4. Obtener Citas de un Paciente

**Endpoint:**
```http
GET /api/cita/paciente/:pacienteId
```

**Parámetros opcionales:**
- `estado`: Filtrar por estado de cita
- `desde`: Fecha desde (YYYY-MM-DD)
- `hasta`: Fecha hasta (YYYY-MM-DD)

**Ejemplo:**
```bash
curl -X GET "http://localhost:3002/api/cita/paciente/1?estado=1"
```

#### 5. Obtener Citas de un Médico

**Endpoint:**
```http
GET /api/cita/medico/:medicoId
```

**Parámetros opcionales:**
- `fecha`: Filtrar por fecha específica (YYYY-MM-DD)
- `estado`: Filtrar por estado de cita

**Ejemplo:**
```bash
curl -X GET "http://localhost:3002/api/cita/medico/1?fecha=2025-08-26"
```

#### 6. Cancelar Cita

**Endpoint:**
```http
PUT /api/cita/:id/cancelar
```

**Cuerpo de la petición:**
```json
{
  "motivo_cancelacion": "Paciente no puede asistir"
}
```

#### 7. Obtener Detalles de una Cita

**Endpoint:**
```http
GET /api/cita/:id
```

## Datos Configurados Automáticamente

### Estados de Cita
- **PROGRAMADA** (ID: 1): Cita programada
- **CONFIRMADA** (ID: 2): Cita confirmada por el paciente
- **EN_CURSO** (ID: 3): Cita en curso de atención
- **CANCELADA** (ID: 4): Cita cancelada
- **NO_ASISTIO** (ID: 5): Paciente no asistió
- **COMPLETADA** (ID: 6): Cita completada exitosamente

### Tipos de Cita
- **CONSULTA_GENERAL** (ID: 1): 30 minutos
- **TELEMEDICINA** (ID: 2): 20 minutos
- **SEGUIMIENTO** (ID: 3): 20 minutos
- **URGENCIA** (ID: 4): 45 minutos

### Prioridades
- **NORMAL** (ID: 1): Prioridad normal
- **ALTA** (ID: 2): Prioridad alta
- **URGENTE** (ID: 3): Prioridad urgente

### Especialidades de Ejemplo
- **Medicina General** (ID: 1)
- **Pediatría** (ID: 2)
- **Ginecología** (ID: 3)
- **Cardiología** (ID: 4)
- **Enfermería** (ID: 5)

## Datos de Ejemplo Incluidos

### Personal Médico
1. **Dr. Juan Pérez** - Medicina General
   - Disponible: Lunes a Viernes 8:00-12:00
   - Consultas de 30 minutos

2. **Dra. María González** - Pediatría
   - Disponible: Martes y Jueves 14:00-18:00
   - Consultas de 25 minutos

### Paciente de Ejemplo
- **Ana Martínez** - Expediente: EXP001

## Flujo de Uso Recomendado

1. **Configurar sistema inicial:**
   ```bash
   curl -X POST http://localhost:3002/api/setup/completo
   ```

2. **Buscar horarios disponibles:**
   ```bash
   curl -X GET "http://localhost:3002/api/cita/horarios-disponibles?especialidadId=1&fechaInicio=2025-08-26&fechaFin=2025-08-30"
   ```

3. **Programar cita:**
   ```bash
   curl -X POST http://localhost:3002/api/cita/programar \
     -H "Content-Type: application/json" \
     -d '{"pacienteId":1,"personalMedicoId":1,"fechaHora":"2025-08-26 08:00:00","tipoCitaId":1,"motivo":"Consulta general"}'
   ```

4. **Verificar cita creada:**
   ```bash
   curl -X GET http://localhost:3002/api/cita/paciente/1
   ```

## Características Implementadas

✅ **Búsqueda inteligente de horarios**: Calcula automáticamente slots disponibles basados en la configuración del médico
✅ **Validación de disponibilidad**: Verifica que el horario esté libre antes de reservar
✅ **Generación automática de números de cita**: Formato: YYMMDDXXXX
✅ **Transacciones**: Reserva atómica de horarios
✅ **Filtros flexibles**: Por especialidad, médico, fecha, tipo de cita
✅ **Gestión de estados**: Control completo del ciclo de vida de la cita
✅ **Información completa**: Incluye datos del paciente, médico y especialidad

## Próximas Fases

### Fase 2: Controladores Especializados
- Lista de espera
- Recordatorios automáticos
- Validaciones avanzadas

### Fase 3: Notificaciones y Comunicación
- Notificaciones push/email
- SMS de confirmación
- Integración con WhatsApp

## Notas Técnicas

- **Base de datos**: Utiliza las asociaciones definidas en Sequelize
- **Validaciones**: Incluye validaciones de fechas y disponibilidad
- **Manejo de errores**: Respuestas consistentes y descriptivas
- **Optimización**: Consultas optimizadas con includes apropiados
- **Escalabilidad**: Diseño preparado para múltiples centros de salud
