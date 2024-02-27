import fastifyPlugin from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { getServerVersion } from '../matrix/matrix.js';

async function pingMatrixPlugin(fastify: FastifyInstance) {
  try {
    const serverVersion = await getServerVersion();
    fastify.log.info('Matrix server version: ' + serverVersion);
  } catch (error) {
    fastify.log.error('Error pinging Matrix server:' + error);
  }
}

export default fastifyPlugin(pingMatrixPlugin);
