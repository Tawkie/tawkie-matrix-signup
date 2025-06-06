import fastifyPlugin from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { UserQueueState, UserQueueStateStrings } from './postgres.js';

async function commonSchemaPlugin(fastify: FastifyInstance) {
  fastify.addSchema({
    $id: 'https://tawkie.fr/common/uuid',
    title: 'UUIDv4',
    description: 'A UUID version 4 string',
    type: 'string',
    pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
    examples: ['df27bea8-8596-45a8-ab28-17a7332fd03a'],
  })
  fastify.addSchema({
    $id: 'https://tawkie.fr/common/matrixUsername',
    title: 'Matrix username',
    description: 'A Matrix username',
    type: 'string',
    pattern: '^[a-z0-9]{3,16}$',
    examples: ['bobby'],
  })
  fastify.addSchema({
    $id: 'https://tawkie.fr/common/userQueueState',
    title: 'User queue state',
    description: 'The state of a user in the queue',
    type: 'string',
    enum: Object.values(UserQueueStateStrings),
    examples: [UserQueueState.IN_QUEUE],
  })
}

export default fastifyPlugin(commonSchemaPlugin);
