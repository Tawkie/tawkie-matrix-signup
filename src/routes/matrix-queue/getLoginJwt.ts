import { FastifyPluginAsync } from "fastify"
import { FastifyInstance } from "fastify"
import { ensureInQueue, getUserFromQueue } from "./queueStatus.js"
import { UserQueueState, UserQueueStateStrings } from "../../plugins/postgres.js"
import jwt from "jsonwebtoken"
import { readFileSync } from 'fs';

type RequestQuery = {
  userId: string
}

let privateKey: Buffer | undefined = undefined;
try {
  const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH || '../../../../private_key.pem'
  privateKey = readFileSync(privateKeyPath)
} catch (err) {
  console.error('Error reading private key', err);
}

export const getLoginJwtSchema = {
  operationId: 'getLoginJwt',
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
        userState: { '$ref': 'https://tawkie.fr/common/userQueueState' },
        queuePosition: { type: 'integer' },
        serverName: { type: 'string' },
        loginJwt: { type: 'string' },
      }
    },
    400: { $ref: 'https://tawkie.fr/common/HttpError' },
    500: { $ref: 'https://tawkie.fr/common/HttpError' },
  }
}

// Create JWT used for synapse login
// https://matrix-org.github.io/synapse/latest/jwt.html
const example: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get<{ Querystring: RequestQuery }>('/getLoginJwt', { schema: getLoginJwtSchema }, async function(request) {
    const userId = request.query.userId

    await ensureInQueue(fastify, userId)

    const user = await getUserFromQueue(fastify, userId)
    if (user.userState !== UserQueueStateStrings[UserQueueState.CREATED]) {
      fastify.log.warn(`Illegal : User ${userId} tried to get login JWT without being CREATED. State: ${user.userState}`)
      throw fastify.httpErrors.badRequest('User is not in the correct state')
    }

    if (!user.serverName) {
      fastify.log.warn(`Illegal : User ${userId} tried to get login JWT without a server name`)
      throw fastify.httpErrors.badRequest('User does not have a server name')
    }

    const loginJwt = getLoginJwt(fastify, user.username, user.serverName)

    fastify.log.info(`User ${userId} (username ${user.username} requested login JWT for server ${user.serverName}`)

    // TODO document all this s
    return {
      ...user,
      loginJwt: loginJwt
    }
  })
}

function getLoginJwt(fastify: FastifyInstance, username: string, serverName: string) {
  // Use asymmetric encryption to sign the JWT

  if (!privateKey) {
    throw fastify.httpErrors.internalServerError('Private key not found');
  }

  const payload = {
    exp: Math.floor(Date.now() / 1000) + 60, // jwt expires in 60 seconds
    iat: Math.floor(Date.now() / 1000),
    sub: username,
    iss: process.env.JWT_ISSUER || 'staging.tawkie.fr', //TODO add to ansible
    aud: [serverName],
  }

  return jwt.sign(payload, privateKey, { algorithm: 'RS256' })
}


export default example;
