import { FastifyPluginAsync } from "fastify"
import { FastifyInstance } from "fastify"
import { UserQueueState, UserQueueStateStrings } from "./../../plugins/postgres.js"

type RequestQuery = {
  userId: string
}

export type UserQueue = {
  userId: string
  username: string
  queuePosition: number
  userState: string
  serverName?: string
}

export const queueStatusSchema = {
  operationId: 'getQueueStatus',
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
        userState: { '$ref': 'https://tawkie.fr/common/userQueueState' },
        serverName: { type: 'string' },
      }
    },
    400: { $ref: 'https://tawkie.fr/common/HttpError' },
    500: { $ref: 'https://tawkie.fr/common/HttpError' },
  }
}

const queueStatus: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get<{ Querystring: RequestQuery }>('/queueStatus', { schema: queueStatusSchema }, async function(request) {
    const userId = request.query.userId

    await ensureInQueue(fastify, userId)
    return await getUserFromQueue(fastify, userId)
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

type UserQueueDatabaseModel = {
  username: string
  user_uuid: string
  queue_position: number
  user_state: UserQueueState
  matrix_instance: string
}

export async function getUserFromQueue(fastify: FastifyInstance, userId: string): Promise<UserQueue> {
  const query = `SELECT username, user_uuid, queue_position, user_state, matrix_instance FROM user_queue WHERE user_uuid = $1;`
  const { rows } = await fastify.pg.query<UserQueueDatabaseModel>(query, [userId])

  if (rows.length !== 1) {
    fastify.log.error(`getUserFromQueue: found 0 or multiple queue entries for user ${userId}`)
    return {
      username: "",
      queuePosition: -1,
      userState: UserQueueStateStrings[UserQueueState.NONE],
      userId: userId,
      serverName: "",
    }
  } else
    return {
      username: rows[0].username,
      queuePosition: rows[0].queue_position,
      userState: UserQueueStateStrings[rows[0].user_state as UserQueueState],
      userId: userId,
      serverName: rows[0].matrix_instance,
    }
}

export async function getUserByUsername(
  fastify: FastifyInstance,
  username: string,
): Promise<UserQueue> {
  const query = `SELECT username, user_uuid, queue_position, user_state, matrix_instance FROM user_queue WHERE username = $1;`;
  const { rows } = await fastify.pg.query<UserQueueDatabaseModel>(query, [
    username,
  ]);

  if (rows.length !== 1) {
    fastify.log.error(
      `getUserByUsername: found 0 or multiple queue entries for username ${username}`,
    );
    return {
      username: "",
      queuePosition: -1,
      userState: UserQueueStateStrings[UserQueueState.NONE],
      userId: "",
      serverName: "",
    };
  } else
    return {
      username: rows[0].username,
      queuePosition: rows[0].queue_position,
      userState: UserQueueStateStrings[rows[0].user_state as UserQueueState],
      userId: rows[0].user_uuid,
      serverName: rows[0].matrix_instance,
    };
}

export default queueStatus;
