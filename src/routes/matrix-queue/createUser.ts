import { FastifyPluginAsync } from "fastify"
import { FastifyInstance } from "fastify"
import { getUserFromQueue } from "./queueStatus.js"
import { UserQueueState, UserQueueStateStrings } from "../../plugins/postgres.js"
import { createUser } from "../../matrix/matrix.js"

type RequestBody = {
  userId: string
}

export const updateUsernameSchema = {
  operationId: 'updateUsername',
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

    const userMatrixId = user.username
    const status = await createUser(userMatrixId) // TODO server
    if (status === 200) {
      fastify.log.warn('createUser: Tried to create user ' + userId + ' but it already exists')
    } else if (status === 201) {
      fastify.log.info('createUser: Created user ' + userId)
    }
    // let fastify handle non 200/201 status codes

    try {
      await markUserAsCreated(fastify, userId)
      user.userState = UserQueueStateStrings[UserQueueState.CREATED]
    } catch (error) {
      fastify.log.error('createUser: Failed to mark user ' + userId + ' as created: ' + error)
      // If markUserAsCreated fails, createUser will 200 next time `/createUser` is called
    }
    return user
  })
}

async function markUserAsCreated(fastify: FastifyInstance, userId: string) {
  const query = `UPDATE user_queue SET user_state = ${UserQueueState.CREATED} WHERE user_uuid = $1;`
  await fastify.pg.query(query, [userId])
}


export default example;
