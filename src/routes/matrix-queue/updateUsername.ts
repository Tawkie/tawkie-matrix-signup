import { FastifyPluginAsync } from "fastify"
import { FastifyInstance } from "fastify"
import { ensureInQueue } from "./queueStatus.js"

type RequestBody = {
  userId: string
  username: string
}

export const updateUsernameSchema = {
  body: {
    type: 'object',
    required: ['userId', 'username'],
    properties: {
      userId: { '$ref': 'https://tawkie.fr/common/uuid' },
      username: { '$ref': 'https://tawkie.fr/common/matrixUsername' },
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        userId: { '$ref': 'https://tawkie.fr/common/uuid' },
      }
    },
    400: { $ref: 'https://tawkie.fr/common/HttpError' },
    500: { $ref: 'https://tawkie.fr/common/HttpError' },
  }
}

const example: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.put<{ Body: RequestBody }>('/updateUsername', { schema: updateUsernameSchema }, async function(request) {
    const userId = request.body.userId
    const username = request.body.username

    const queuePosition = await ensureInQueue(fastify, userId)
    await updateUsername(fastify, userId, username)

    return {
      userId,
      queuePosition,
      username,
    }
  })
}

async function updateUsername(fastify: FastifyInstance, userId: string, username: string) {
  const query = `UPDATE user_queue SET username = $1 WHERE user_uuid = $2;`
  await fastify.pg.query(query, [username, userId])
}


export default example;
