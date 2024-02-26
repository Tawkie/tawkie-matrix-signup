import { FastifyPluginAsync } from "fastify"
import { FastifyInstance } from "fastify"
import { ensureInQueue, getUserFromQueue } from "./queueStatus.js"
import { UserQueueState, UserQueueStateStrings } from "../../plugins/postgres.js"

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

    const user = await getUserFromQueue(fastify, userId)
    if (user.userState !== UserQueueStateStrings[UserQueueState.IN_QUEUE]) {
      fastify.log.warn(`Illegal : User ${userId} tried to update its username while not in the queue. State: ${user.userState}`)
      throw fastify.httpErrors.badRequest('User is not in the queue')
    }
    await updateUsername(fastify, userId, username)
    user.username = username

    return user
  })
}

async function updateUsername(fastify: FastifyInstance, userId: string, username: string) {
  const query = `UPDATE user_queue SET username = $1 WHERE user_uuid = $2;`
  await fastify.pg.query(query, [username, userId])
}


export default example;
