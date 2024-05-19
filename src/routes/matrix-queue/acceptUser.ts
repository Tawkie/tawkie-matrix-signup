import { FastifyPluginAsync } from "fastify"
import { FastifyInstance } from "fastify"
import { ensureInQueue, getUserFromQueue } from "./queueStatus.js"
import { UserQueueState, UserQueueStateStrings } from "../../plugins/postgres.js"
import { notifyWebhook } from "../../utils/hookshot.js"
import { sendAcceptanceMail } from "../../utils/mail.js"

type RequestBody = {
  userId: string
  email: string
}

export const acceptUserSchema = {
  operationId: 'acceptUser',
  body: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { '$ref': 'https://tawkie.fr/common/uuid' },
      email: { type: 'string' },
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
    const email = request.body.email

    await ensureInQueue(fastify, userId)

    const user = await getUserFromQueue(fastify, userId)
    if (user.userState !== UserQueueStateStrings[UserQueueState.IN_QUEUE]) {
      fastify.log.warn(`Illegal : User ${userId} tried to get accepted while not in the queue. State: ${user.userState}`)
      throw fastify.httpErrors.badRequest('User is not in the queue')
    }
    await acceptUser(fastify, userId, user.username)
    user.userState = UserQueueStateStrings[UserQueueState.ACCEPTED]

    if (email) {
      // run this in parallel, not needed for the response
      sendAcceptanceMail(email, user.username).catch((error) => {
        fastify.log.error(error, `Failed to send acceptance mail to ${email}`)
        notifyWebhook(`❌ Failed to send acceptance mail to ${user.username}`)
      })
    } else {
      fastify.log.warn(`User ${userId} (${user.username}) was accepted without email`)
      notifyWebhook(`❌ Failed to send acceptance mail to ${user.username}, no email provided`)
    }

    return user
  })
}

async function acceptUser(fastify: FastifyInstance, userId: string, username: string): Promise<void> {
  const query = `UPDATE user_queue SET user_state = ${UserQueueState.ACCEPTED} WHERE user_uuid = $1;`
  await fastify.pg.query(query, [userId])

  // notify in parallel, not needed for the response
  notifyWebhook(`👌 User ${userId} (${username}) was accepted.'`).catch((error) => {
    fastify.log.error(error, `Failed to notify webhook about user ${userId} (${username}) acceptance`)
  })
}


export default example;
