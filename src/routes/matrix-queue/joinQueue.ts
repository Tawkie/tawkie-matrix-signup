import { FastifyPluginAsync } from "fastify"

export const joinQueueSchema = {
  body: {
    type: 'object',
    properties: {
      userId: { '$ref': 'https://tawkie.fr/common/uuid' },
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        userId: { '$ref': 'https://tawkie.fr/common/uuid' },
        queuePosition: { type: 'integer' },
      }
    },
    400: { $ref: 'https://tawkie.fr/common/HttpError' },
    500: { $ref: 'https://tawkie.fr/common/HttpError' },
  }
}

const example: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post('/', { schema: joinQueueSchema }, async function(request, reply) {
    // TODO
    return 'this is an example'
  })
}

export default example;
