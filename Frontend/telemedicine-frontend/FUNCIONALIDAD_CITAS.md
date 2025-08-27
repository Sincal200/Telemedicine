# Integración de Gestión de Citas - Frontend

## Nuevas Funcionalidades Implementadas

### 📅 **Gestión Completa de Citas**

#### 1. **Programar Citas** (`/citas`)
- **Búsqueda de horarios disponibles** por especialidad y fecha
- **Selección visual** de horarios disponibles
- **Confirmación de cita** con motivo de consulta
- **Validaciones** en tiempo real

#### 2. **Visualización de Citas**
- **Lista de próximas citas** con información detallada
- **Historial de citas** anteriores
- **Estados de cita** con colores e iconos distintivos
- **Acciones disponibles** según el estado y timing

#### 3. **Cancelación de Citas**
- **Cancelación con confirmación** para evitar errores
- **Validaciones de tiempo** (no se puede cancelar con menos de 2 horas)
- **Actualización automática** de la lista

### 🔧 **Componentes Creados**

#### `ProgramarCita.jsx`
- Modal para buscar y programar nuevas citas
- Integración con API de horarios disponibles
- Formulario con validaciones
- Agrupación de horarios por fecha

#### `MisCitas.jsx`
- Lista completa de citas del usuario
- Separación entre próximas citas e historial
- Acciones contextuales (iniciar consulta, cancelar)
- Estados visuales con colores y tags

#### `ResumenCitas.jsx`
- Componente compacto para el dashboard
- Muestra las próximas 3 citas
- Navegación rápida a gestión completa

#### `GestionCitas.jsx`
- Página principal de gestión de citas
- Tabs organizados por funcionalidad
- Diferente vista para médicos y pacientes

### 🌐 **Servicio de API**

#### `citaService.js`
- **Singleton service** para todas las operaciones de citas
- **Manejo automático** de tokens y headers
- **Gestión de errores** centralizada
- **Métodos implementados**:
  - `buscarHorariosDisponibles()`
  - `programarCita()`
  - `obtenerCitasPaciente()` / `obtenerCitasMedico()`
  - `cancelarCita()`
  - `obtenerCita()`
  - `obtenerEspecialidades()`
  - `obtenerTiposCita()`

### 🎨 **Estados de Cita**

| Estado | Color | Icono | Descripción |
|--------|-------|-------|-------------|
| **Programada** | Azul | 🕒 | Cita agendada |
| **Confirmada** | Verde | ✅ | Confirmada por paciente |
| **En Curso** | Naranja | 🔄 | Consulta activa |
| **Cancelada** | Rojo | ❌ | Cita cancelada |
| **No Asistió** | Gris | ⚠️ | Paciente no asistió |
| **Completada** | Cian | ✅ | Consulta finalizada |

### 🚀 **Navegación**

#### Rutas Agregadas:
- `/citas` - Gestión completa de citas

#### Integración en Dashboard:
- **Botón "Gestionar Citas"** en acciones rápidas
- **Resumen de próximas citas** en panel principal
- **Navegación contextual** según rol (doctor/paciente)

### 🔐 **Roles y Permisos**

#### **Pacientes**:
- ✅ Programar nuevas citas
- ✅ Ver sus citas
- ✅ Cancelar citas (con restricciones de tiempo)
- ✅ Iniciar videoconsulta (cuando corresponde)

#### **Médicos**:
- ✅ Ver agenda del día
- ✅ Ver todas sus consultas
- ✅ Ver información de pacientes
- 🔄 Gestión de disponibilidad (próximamente)

### 📱 **Responsive Design**

- **Adaptable** a dispositivos móviles y desktop
- **Cards responsive** que se ajustan al tamaño de pantalla
- **Navegación optimizada** para touch y mouse

### 🛠️ **Configuración**

#### Variables de Entorno (`.env`):
```bash
VITE_API_URL=http://localhost:8081/api/telemedicine
VITE_TENANT=telemedicine
```

#### Dependencias Agregadas:
- `dayjs` - Manejo de fechas

### 🔄 **Flujo de Usuario**

#### **Para Pacientes**:
1. **Dashboard** → Ver resumen de próximas citas
2. **"Gestionar Citas"** → Ir a gestión completa
3. **"Nueva Cita"** → Abrir modal de programación
4. **Seleccionar especialidad y fechas** → Buscar horarios
5. **Elegir horario** → Confirmar con motivo
6. **Cita programada** → Actualización automática

#### **Para Médicos**:
1. **Dashboard** → Ver consultas del día
2. **"Mis Consultas"** → Ver agenda completa
3. **Gestionar pacientes** y horarios disponibles

### 🎯 **Próximas Mejoras**

- [ ] **Vista de calendario** para médicos
- [ ] **Gestión de disponibilidad** médica
- [ ] **Notificaciones push** para recordatorios
- [ ] **Historial médico** integrado
- [ ] **Reportes y estadísticas**
- [ ] **Integración con videollamadas** automática

### 🐛 **Debugging**

#### URLs de la API:
- Horarios: `GET /api/telemedicine/cita/horarios-disponibles`
- Programar: `POST /api/telemedicine/cita/programar`
- Mis citas: `GET /api/telemedicine/cita/paciente/{id}`
- Cancelar: `PUT /api/telemedicine/cita/{id}/cancelar`

#### Verificar en DevTools:
1. **Network** → Verificar llamadas a la API
2. **Console** → Ver errores de JavaScript
3. **Application** → Verificar token en sessionStorage

---

## 🎉 **¡Integración Completada!**

La funcionalidad de gestión de citas está completamente integrada al frontend, proporcionando una experiencia fluida y profesional para la programación y gestión de consultas médicas.
