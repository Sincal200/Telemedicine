import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Telemedicine',
            version: '1.0.0',
            description: 'Documentación de la API REST de Telemedicine',
        },
    },
    apis: ['./routes/*.js'], // Aquí se buscarán los comentarios JSDoc
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };