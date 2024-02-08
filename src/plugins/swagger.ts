import fastifyPlugin from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

async function swaggerPlugin(fastify: FastifyInstance) {
  fastify.register(import('@fastify/swagger'), {
    swagger: {
      info: {
        title: 'Tawkie Matrix signup queue',
        description: 'API documentation for Tawkie Matrix signup queue',
        version: '1.0.0',
      },
      host: 'localhost:3000',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [],
      definitions: {},
      securityDefinitions: {}
    }
  });
}

export default fastifyPlugin(swaggerPlugin);




