import { FastifyPluginAsync } from "fastify";
import { FastifyInstance } from "fastify";
import { ensureInQueue } from "./queueStatus.js";
import { UserQueueState } from "../../plugins/postgres.js";
import { notifyWebhook } from "../../utils/hookshot.js";

type RequestQuery = {
  userId: string;
};

export const deactivateUserSchema = {
  operationId: "deactivateUser",
  query: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: { $ref: "https://tawkie.fr/common/uuid" },
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
      const userId = request.query.userId;

      await ensureInQueue(fastify, userId);

      await deactivateUser(fastify, userId);
      notifyWebhook(`🚡 User ${userId} deactivated`);
      return { success: true };
    },
  );
};

async function deactivateUser(fastify: FastifyInstance, userId: string) {
  const query = `UPDATE user_queue SET user_state = $1 WHERE user_uuid = $2;`;
  await fastify.pg.query(query, [UserQueueState.BLOCKED, userId]);
}

export default example;
