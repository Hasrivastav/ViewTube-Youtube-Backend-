import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API Documentation',
      version: '1.0.0',
      description: 'API documentation for your project',
    },
  },
  apis: ['./routes/*.js'], // Include all route files
};

const specs = swaggerJsdoc(options);

export default function (app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}
