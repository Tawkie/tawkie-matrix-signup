import { FastifyPluginAsync } from "fastify"
import { FastifyInstance } from "fastify"

type RequestQuery = {
  userId: string
}

export const queueStatusSchema = {
  query: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { '$ref': 'https://tawkie.fr/common/uuid' },
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        userId: { '$ref': 'https://tawkie.fr/common/uuid' },
        username: { '$ref': 'https://tawkie.fr/common/matrixUsername' },
        queuePosition: { type: 'integer' },
      }
    },
    400: { $ref: 'https://tawkie.fr/common/HttpError' },
    500: { $ref: 'https://tawkie.fr/common/HttpError' },
  }
}

const example: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get<{ Querystring: RequestQuery }>('/queueStatus', { schema: queueStatusSchema }, async function(request) {
    const userId = request.query.userId
    const queuePosition = await ensureInQueue(fastify, userId)
    const username = await getUsername(fastify, userId)

    return {
      userId,
      queuePosition,
      username,
    }
  })
}

export async function ensureInQueue(fastify: FastifyInstance, userId: string) {
  // query should insert the user in the queue if not already in it
  // and return the position in the queue to avoid a race condition
  const query = `SELECT insert_user_in_queue_if_not_exists($1) AS queue_position;`
  // See /src/plugins/postgres.ts for the function spec

  // There should be exactly one row.
  // See /src/plugins/postgres.ts for the table spec
  const { rows } = await fastify.pg.query<{ position: number }>(query, [userId])

  return rows.length == 1 ? rows[0].queue_position : -1
}

async function getUsername(fastify: FastifyInstance, userId: string) {
  const query = `SELECT username FROM user_queue WHERE user_uuid = $1;`
  const { rows } = await fastify.pg.query<{ username: string }>(query, [userId])
  return rows.length == 1 ? rows[0].username : ""
}

export default example;
