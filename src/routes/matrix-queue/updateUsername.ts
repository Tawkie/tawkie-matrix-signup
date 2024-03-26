import { FastifyPluginAsync } from "fastify"
import { FastifyInstance } from "fastify"
import { ensureInQueue, getUserFromQueue } from "./queueStatus.js"
import { UserQueueState, UserQueueStateStrings } from "../../plugins/postgres.js"
import { DatabaseError } from "pg-protocol"

type RequestBody = {
  userId: string
  username: string
}

export const updateUsernameSchema = {
  operationId: 'updateUsername',
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
        serverName: { type: 'string' },
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

    if (usernameIsEmpty(username)) {
      throw fastify.httpErrors.badRequest('Username cannot be empty')
    }

    await ensureInQueue(fastify, userId)

    const user = await getUserFromQueue(fastify, userId)
    if (user.userState !== UserQueueStateStrings[UserQueueState.IN_QUEUE]) {
      fastify.log.warn(`Illegal : User ${userId} tried to update its username while not in the queue. State: ${user.userState}`)
      throw fastify.httpErrors.badRequest('User is not in the queue')
    }
    try {
      await updateUsername(fastify, userId, username)
    } catch (e) {
      if (e instanceof DatabaseError && e.code && e.code === '23505') {
        fastify.log.warn(`User ${userId} tried to update its username to ${username} but it is already taken`)
        throw fastify.httpErrors.badRequest('Username already taken')
      } else
        throw e
    }
    user.username = username

    return user
  })
}

async function updateUsername(fastify: FastifyInstance, userId: string, username: string) {
  const query = `UPDATE user_queue SET username = $1 WHERE user_uuid = $2;`
  await fastify.pg.query(query, [username, userId])
}

function usernameIsEmpty(username: string): boolean {
  return username === null || username === undefined || username === '' || username === 'undefined'
}


export default example;
