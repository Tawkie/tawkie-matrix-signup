import fastifyPlugin from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

async function postgresPlugin(fastify: FastifyInstance) {
  fastify.register(import('@fastify/postgres'), {
    connectionString: 'postgres://postgres:mysecretpassword@localhost/postgres'
  });
}

export default fastifyPlugin(postgresPlugin);

