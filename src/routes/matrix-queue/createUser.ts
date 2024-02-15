import { FastifyPluginAsync } from "fastify"
import { FastifyInstance } from "fastify"
import { getUserFromQueue } from "./queueStatus.js"
import { UserQueueState, UserQueueStateStrings } from "../../plugins/postgres.js"

type RequestBody = {
  userId: string
}

export const updateUsernameSchema = {
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
      }
    },
    400: { $ref: 'https://tawkie.fr/common/HttpError' },
    500: { $ref: 'https://tawkie.fr/common/HttpError' },
  }
}

const example: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.put<{ Body: RequestBody }>('/createUser', { schema: updateUsernameSchema }, async function(request) {
    const userId = request.body.userId

    const user = await getUserFromQueue(fastify, userId)

    if (user.queuePosition == -1) {
      throw fastify.httpErrors.badRequest('User is not in the queue')
    }

    if (!user.username) {
      throw fastify.httpErrors.badRequest('User does not have a username')
    }

    if (user.userState === UserQueueStateStrings[UserQueueState.CREATED]) {
      throw fastify.httpErrors.badRequest('User is already created')
    }

    if (user.userState !== UserQueueStateStrings[UserQueueState.ACCEPTED]) {
      throw fastify.httpErrors.badRequest('User is not in the accepted state')
    }

    // TODO actually create the user
    await markUserAsCreated(fastify, userId)
    // TODO How to deal with the state if the Matrix user is succesfully created but the markUserAsCreated fails?
    // TODO write tests
    return user
  })
}

async function markUserAsCreated(fastify: FastifyInstance, userId: string) {
  const query = `UPDATE user_queue SET user_state = ${UserQueueState.CREATED} WHERE user_uuid = $1;`
  await fastify.pg.query(query, [userId])
}


export default example;
