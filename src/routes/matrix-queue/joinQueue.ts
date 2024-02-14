import { FastifyPluginAsync } from "fastify"
import { FastifyInstance } from "fastify"

type RequestBody = {
  userId: string
}

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
  fastify.post<{ Body: RequestBody }>('/joinQueue', { schema: joinQueueSchema }, async function(request) {
    const userId = request.body.userId
    const { rows } = await ensureInQueue(fastify, userId)

    // There should be exactly one row.
    // See /src/plugins/postgres.ts for the table spec

    return {
      userId,
      queuePosition: rows[0].queue_position
    }
  })
}

async function ensureInQueue(fastify: FastifyInstance, userId: string) {
  // query should insert the user in the queue if not already in it
  // and return the position in the queue to avoid a race condition
  const query = `SELECT insert_user_in_queue_if_not_exists($1) AS queue_position;`
  // See /src/plugins/postgres.ts for the function spec

  return fastify.pg.query<{ position: number }>(query, [userId])
}

export default example;
