import fastifyPlugin from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

async function postgresPlugin(fastify: FastifyInstance) {
  const uri = process.env.TAWKIE_SIGNUP_POSTGRES_URI ?? 'postgres://postgres:mysecretpassword@localhost/postgres';
  fastify.register(import('@fastify/postgres'), {
    connectionString: uri,
  });
  fastify.register(ensureTableExists);
}

async function ensureTableExists(fastify: FastifyInstance) {
  const query = `
CREATE TABLE IF NOT EXISTS public.user_queue (
    queue_position SERIAL PRIMARY KEY,
    user_uuid UUID UNIQUE NOT NULL,
    username VARCHAR(255),
    accepted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_user_queue_user_uuid ON public.user_queue(user_uuid);
`
  await fastify.pg.query(query);
}


export default fastifyPlugin(postgresPlugin);
