import fastifyPlugin from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export enum UserQueueState {
    NONE = 0,
    BLOCKED = 1,
    IN_QUEUE = 2,
    ACCEPTED = 3,
    CREATED = 4,
}

export const UserQueueStateStrings: { [key in UserQueueState]: string } = {
    [UserQueueState.NONE]: 'NONE',
    [UserQueueState.BLOCKED]: 'BLOCKED',
    [UserQueueState.IN_QUEUE]: 'IN_QUEUE',
    [UserQueueState.ACCEPTED]: 'ACCEPTED',
    [UserQueueState.CREATED]: 'CREATED',
};

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
    username VARCHAR(20) UNIQUE NULL,
    user_state INT NOT NULL DEFAULT ${UserQueueState.IN_QUEUE},
    matrix_instance VARCHAR(255) NULL
);
CREATE INDEX IF NOT EXISTS idx_user_queue_user_uuid ON public.user_queue(user_uuid);
`
    await fastify.pg.query(query);
    await ensureUserQueueFunctionExists(fastify);
}

async function ensureUserQueueFunctionExists(fastify: FastifyInstance) {
    const query = `
CREATE OR REPLACE FUNCTION insert_user_in_queue_if_not_exists(user_uuid_arg UUID)
RETURNS INTEGER AS $$
DECLARE
    v_queue_position INTEGER;
BEGIN
    -- Check if the user_uuid already exists
    SELECT queue_position INTO v_queue_position FROM user_queue WHERE user_uuid = user_uuid_arg;

    -- If not found, then insert
    IF v_queue_position IS NULL THEN
        INSERT INTO user_queue (user_uuid) VALUES (user_uuid_arg)
        RETURNING queue_position INTO v_queue_position;
    END IF;

    -- Return the queue_position (either existing or new)
    RETURN v_queue_position;
END;
$$ LANGUAGE plpgsql;
`
    // can be called with `SELECT insert_user_in_queue_if_not_exists('your-user-uuid-here');`
    await fastify.pg.query(query);
}

export default fastifyPlugin(postgresPlugin);
