import { FastifyPluginAsync } from "fastify"
import { FastifyInstance } from "fastify"
import { getUserFromQueue } from "./queueStatus.js"
import { UserQueueState, UserQueueStateStrings } from "../../plugins/postgres.js"
import { createUser, matrixServerList } from "../../matrix/matrix.js"

type RequestBody = {
  userId: string
  serverName: string
}

export const updateUsernameSchema = {
  operationId: 'updateUsername',
  body: {
    type: 'object',
    required: ['userId', 'serverName'],
    properties: {
      userId: { '$ref': 'https://tawkie.fr/common/uuid' },
      serverName: { type: 'string' },
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
  fastify.put<{ Body: RequestBody }>('/createUser', { schema: updateUsernameSchema }, async function(request) {
    const userId = request.body.userId
    const serverName = request.body.serverName

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

    if (!matrixServerList.includes(serverName)) {
      throw fastify.httpErrors.badRequest('Server name is not recognised')
    }

    const userMatrixId = user.username
    const status = await createUser(userMatrixId, serverName) // TODO server
    if (status === 200) {
      fastify.log.warn('createUser: Tried to create user ' + userId + ' but it already exists')
    } else if (status === 201) {
      fastify.log.info('createUser: Created user ' + userId)
    }
    // let fastify handle non 200/201 status codes

    try {
      await markUserAsCreated(fastify, userId, serverName)
      user.userState = UserQueueStateStrings[UserQueueState.CREATED]
      user.serverName = serverName
    } catch (error) {
      fastify.log.error('createUser: Failed to mark user ' + userId + ' as created: ' + error)
      // If markUserAsCreated fails, createUser will 200 next time `/createUser` is called
    }
    return user
  })
}

async function markUserAsCreated(fastify: FastifyInstance, userId: string, serverName: string) {
  const query = `UPDATE user_queue SET user_state = ${UserQueueState.CREATED}, matrix_instance = $2 WHERE user_uuid = $1;`
  await fastify.pg.query(query, [userId, serverName])
}


export default example;
