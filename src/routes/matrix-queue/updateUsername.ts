import { FastifyPluginAsync } from "fastify"
import { FastifyInstance } from "fastify"
import { ensureInQueue, getUserFromQueue } from "./queueStatus.js"

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
        username: { '$ref': 'https://tawkie.fr/common/matrixUsername' },
        userState: { '$ref': 'https://tawkie.fr/common/userQueueState' },
        queuePosition: { type: 'integer' },
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

    await ensureInQueue(fastify, userId)
    await updateUsername(fastify, userId, username)

    const user = await getUserFromQueue(fastify, userId)

    return user
  })
}

async function updateUsername(fastify: FastifyInstance, userId: string, username: string) {
  const query = `UPDATE user_queue SET username = $1 WHERE user_uuid = $2;`
  await fastify.pg.query(query, [username, userId])
}


export default example;
