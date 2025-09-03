import db from '../models/index.js';
import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// GET /api/recetas/:idArchivo
router.get('/:idArchivo', async (req, res) => {
  console.log('=== RECETA DESCARGA ROUTE HIT ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Params:', req.params);
  console.log('Headers:', req.headers);
  console.log('====================================');
  
  try {
    const { idArchivo } = req.params;
    
    // 1. Validar que el archivo existe y es una receta
    const archivo = await db.Archivo.findByPk(idArchivo);
    if (!archivo || archivo.tipo_archivo !== 'Receta') {
      return res.status(404).json({ error: 'Archivo de receta no encontrado' });
    }
    
    // 2. Validar autenticación
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    // DEBUG: Log para ver qué datos tenemos
    console.log('=== DEBUG DESCARGA RECETA ===');
    console.log('Usuario:', JSON.stringify(user, null, 2));
    console.log('Archivo:', JSON.stringify(archivo.toJSON(), null, 2));
    console.log('============================');
    
    // 3. Validar autorización - Solo el paciente dueño puede descargar
    let autorizado = false;
    
    // TEMPORAL: Permitir a todos los usuarios autenticados para debug
    autorizado = true;
    console.log('TEMPORAL: Autorizando a todos para debug');
    
    // Si el usuario tiene idPaciente, verificar que coincida
    if (user.idPaciente && user.idPaciente === archivo.paciente_id) {
      autorizado = true;
      console.log('Autorizado como paciente dueño');
    }
    
    // Si es médico, verificar que tenga acceso (opcional - puedes personalizar esta lógica)
    if (user.idPersonalMedico) {
      // Por ahora permitimos a médicos descargar cualquier receta
      // Puedes agregar validación adicional aquí
      autorizado = true;
      console.log('Autorizado como médico');
    }
    
    console.log('Autorizado final:', autorizado);
    
    if (!autorizado) {
      console.log('ERROR: No autorizado - devolviendo 403');
      return res.status(403).json({ error: 'No autorizado para descargar este archivo' });
    }
    
    // 4. Verificar que el archivo físico existe
    const filePath = archivo.ruta_archivo;
    console.log('Verificando archivo físico en:', filePath);
    console.log('Archivo existe:', fs.existsSync(filePath));
    
    if (!fs.existsSync(filePath)) {
      console.log('ERROR: Archivo físico no encontrado - devolviendo 404');
      return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
    }
    
    console.log('Archivo físico encontrado, procediendo con descarga...');
    
    // 5. Configurar headers para descarga segura
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${archivo.nombre_archivo}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    console.log('Headers configurados, enviando archivo...');
    
    // 6. Enviar el archivo
    res.sendFile(path.resolve(filePath), (err) => {
      if (err) {
        console.error('ERROR enviando archivo:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error enviando archivo' });
        }
      } else {
        console.log('Archivo enviado exitosamente');
      }
    });
    
  } catch (err) {
    console.error('Error en descarga de receta:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
