import express from 'express';

const router = express.Router();

// Middleware de autorización específico para telemedicina
const authorizationMiddleware = (requiredRole) => {
    return async (req, res, next) => {
        try {
            const availableRoles = req.user.realm_access.roles;
            if (!availableRoles.includes(requiredRole)) throw new Error();
            next();
        } catch (err) {
            res.status(403).send({ error: "access denied" });
        }
    };
};

// Rutas de autenticación
router.get("/authenticate", (req, res) => {
    // Ruta dummy, el api gateway está validando el token
    res.json({ 
        status: "success",
        message: "User authenticated",
        user: {
            id: req.user.sub,
            roles: req.user.realm_access.roles
        }
    });
});

router.get("/authorize", authorizationMiddleware("doctor"), (req, res) => {
    res.json({ 
        status: "success",
        message: "User authorized as doctor"
    });
});

// Rutas para gestión de salas (requiere rol de doctor)
router.get("/rooms/stats", authorizationMiddleware("doctor"), (req, res) => {
    // Esta función será inyectada desde el servidor principal
    if (req.signalingServer) {
        const stats = req.signalingServer.getRoomsStats();
        res.json({
            status: "success",
            data: stats
        });
    } else {
        res.status(500).json({
            status: "error",
            message: "Signaling server not available"
        });
    }
});

// Ruta para crear una nueva sala de consulta
router.post("/rooms/create", authorizationMiddleware("doctor"), (req, res) => {
    const { patientId, appointmentId } = req.body;
    
    if (!patientId || !appointmentId) {
        return res.status(400).json({
            status: "error",
            message: "patientId and appointmentId are required"
        });
    }
    
    const roomId = `consultation-${appointmentId}-${Date.now()}`;
    
    res.json({
        status: "success",
        data: {
            roomId,
            doctorId: req.user.sub,
            patientId,
            appointmentId,
            createdAt: new Date().toISOString()
        }
    });
});

// Ruta para unirse a una sala (para pacientes)
router.post("/rooms/join", authorizationMiddleware("patient"), (req, res) => {
    const { roomId } = req.body;
    
    if (!roomId) {
        return res.status(400).json({
            status: "error",
            message: "roomId is required"
        });
    }
    
    res.json({
        status: "success",
        data: {
            roomId,
            userId: req.user.sub,
            userRole: "patient",
            joinedAt: new Date().toISOString()
        }
    });
});

// Ruta para obtener el historial de consultas (solo doctores)
router.get("/consultations/history", authorizationMiddleware("doctor"), (req, res) => {
    // Aquí implementarías la lógica para obtener el historial desde la base de datos
    res.json({
        status: "success",
        data: {
            consultations: [
                // Ejemplo de estructura de datos
                {
                    id: "consultation-123",
                    patientId: "patient-456",
                    doctorId: req.user.sub,
                    startTime: "2025-01-15T10:00:00Z",
                    endTime: "2025-01-15T10:30:00Z",
                    status: "completed"
                }
            ]
        }
    });
});

export default router;
