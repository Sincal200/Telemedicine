import db from '../models/index.js';
import { Router } from 'express';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const router = Router();

// OPTIONS para manejar preflight CORS
router.options('/:idConsulta/generar-receta', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// POST /api/consulta/:idConsulta/generar-receta
router.post('/:idConsulta/generar-receta', async (req, res) => {
  // Configurar CORS headers
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  const { idConsulta } = req.params;
  console.log('=== GENERAR RECETA PDF ===');
  console.log('ID Consulta:', idConsulta);
  console.log('Usuario:', req.user ? 'autenticado' : 'no autenticado');
  
  try {
    // 1. Buscar la consulta y su receta
    const consulta = await db.Consulta.findByPk(idConsulta);
    console.log('Consulta encontrada:', consulta ? 'Sí' : 'No');
    console.log('Tiene receta_medica:', consulta?.receta_medica ? 'Sí' : 'No');
    
    if (!consulta || !consulta.receta_medica) {
      return res.status(404).json({ error: 'Consulta o receta no encontrada' });
    }

    // 2. Generar PDF
    const doc = new PDFDocument();
    const recetaDir = '/usr/src/app/archivos_recetas'; // Usar ruta absoluta del contenedor
    if (!fs.existsSync(recetaDir)) {
      console.log('Creando directorio de recetas:', recetaDir);
      fs.mkdirSync(recetaDir, { recursive: true });
    }
    const fileName = `receta_consulta_${idConsulta}_${Date.now()}.pdf`;
    const filePath = path.join(recetaDir, fileName);
    
    console.log('Generando PDF en:', filePath);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(18).text('Receta Médica', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(consulta.receta_medica);
    doc.end();

    stream.on('finish', async () => {
      try {
        console.log('PDF creado exitosamente:', filePath);
        console.log('Verificando que el archivo existe:', fs.existsSync(filePath));
        
        // 3. Generar idArchivo de máximo 10 dígitos (ej: random entre 1000000000 y 9999999999)
        let idArchivo;
        let exists = true;
        // Rango seguro para INT MySQL signed: 1000000000 a 2147483647
        while (exists) {
          idArchivo = Math.floor(1000000000 + Math.random() * (2147483647 - 1000000000 + 1));
          exists = await db.Archivo.findByPk(idArchivo);
        }
        console.log('ID de archivo generado:', idArchivo);
        
        // Obtener paciente_id desde la consulta
        let paciente_id = null;
        if (consulta.cita_id) {
          const cita = await db.Cita.findByPk(consulta.cita_id);
          paciente_id = cita?.paciente_id || null;
        }
        console.log('Paciente ID obtenido:', paciente_id);
        
        const archivoCreado = await db.Archivo.create({
          idArchivo,
          consulta_id: idConsulta,
          paciente_id,
          nombre_archivo: fileName,
          ruta_archivo: filePath,
          tipo_archivo: 'Receta',
          creado_por: req.user?.idUsuario || 1 // Ajusta según tu auth
        });
        
        console.log('Registro de archivo creado en BD:', archivoCreado.toJSON());
        res.json({ ok: true, fileName, filePath, idArchivo, paciente_id });
      } catch (error) {
        console.error('Error en el callback finish del stream:', error);
        res.status(500).json({ error: 'Error creando registro del archivo: ' + error.message });
      }
    });
    
    stream.on('error', (error) => {
      console.error('Error en el stream de escritura:', error);
      res.status(500).json({ error: 'Error escribiendo archivo PDF: ' + error.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
