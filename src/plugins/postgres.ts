import fastifyPlugin from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

async function postgresPlugin(fastify: FastifyInstance) {
  const uri = process.env.TAWKIE_SIGNUP_POSTGRES_URI ?? 'postgres://postgres:mysecretpassword@localhost/postgres';
  fastify.register(import('@fastify/postgres'), {
    connectionString: uri,
  });
}

export default fastifyPlugin(postgresPlugin);
