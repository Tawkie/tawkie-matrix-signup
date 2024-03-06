import { FastifyPluginAsync } from "fastify"
import { FastifyInstance } from "fastify"
import { ensureInQueue, getUserFromQueue } from "./queueStatus.js"
import { UserQueueState, UserQueueStateStrings } from "../../plugins/postgres.js"

type RequestBody = {
  userId: string
}

export const acceptUserSchema = {
  operationId: 'acceptUser',
  body: {
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
        userState: { '$ref': 'https://tawkie.fr/common/userQueueState' },
        queuePosition: { type: 'integer' },
        serverName: { type: 'string' },
      }
    },
    400: { $ref: 'https://tawkie.fr/common/HttpError' },
    500: { $ref: 'https://tawkie.fr/common/HttpError' },
  }
}

const example: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.put<{ Body: RequestBody }>('/acceptUser', { schema: acceptUserSchema }, async function(request) {
    const userId = request.body.userId

    await ensureInQueue(fastify, userId)

    const user = await getUserFromQueue(fastify, userId)
    if (user.userState !== UserQueueStateStrings[UserQueueState.IN_QUEUE]) {
      fastify.log.warn(`Illegal : User ${userId} tried to get accepted while not in the queue. State: ${user.userState}`)
      throw fastify.httpErrors.badRequest('User is not in the queue')
    }
    await acceptUser(fastify, userId)
    user.userState = UserQueueStateStrings[UserQueueState.ACCEPTED]

    return user
  })
}

async function acceptUser(fastify: FastifyInstance, userId: string) {
  const query = `UPDATE user_queue SET user_state = ${UserQueueState.ACCEPTED} WHERE user_uuid = $1;`
  await fastify.pg.query(query, [userId])
}


export default example;
