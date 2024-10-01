import { FastifyPluginAsync } from "fastify";
import { FastifyInstance } from "fastify";
import { getUserByUsername } from "./queueStatus.js";
import { UserQueueState } from "../../plugins/postgres.js";
import { notifyWebhook } from "../../utils/hookshot.js";

type RequestQuery = {
  username: string;
};

export const deactivateUserSchema = {
  operationId: "deactivateUser",
  query: {
    type: "object",
    required: ["username"],
    properties: {
      username: { $ref: "https://tawkie.fr/common/matrixUsername" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
      },
    },
    400: { $ref: "https://tawkie.fr/common/HttpError" },
    500: { $ref: "https://tawkie.fr/common/HttpError" },
  },
};

const example: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.delete<{ Querystring: RequestQuery }>(
    "/deactivateUser",
    { schema: deactivateUserSchema },
    async function (request) {
      const username = request.query.username;

      const user = await getUserByUsername(fastify, username);

      if (!user || !user.userId) {
        throw fastify.httpErrors.badRequest("User not found");
      }

      await deactivateUser(fastify, user.userId);
      notifyWebhook(`🚡 User ${user.userId} (${user.username}) deactivated`);
      return user;
    },
  );
};

async function deactivateUser(fastify: FastifyInstance, userId: string) {
  const query = `UPDATE user_queue SET user_state = $1 WHERE user_uuid = $2;`;
  await fastify.pg.query(query, [UserQueueState.BLOCKED, userId]);
}

export default example;
