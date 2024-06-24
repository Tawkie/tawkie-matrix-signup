import { FastifyPluginAsync } from "fastify";
import { FastifyInstance } from "fastify";

export type ResponseType = {
  queueSize: number;
};

export const queueStatusSchema = {
  operationId: "getQueueStatus",
  response: {
    200: {
      type: "object",
      properties: {
        queueSize: { type: "integer" },
      },
    },
    500: { $ref: "https://tawkie.fr/common/HttpError" },
  },
};

const queueSize: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/queueSize", { schema: queueStatusSchema }, async function () {
    return await getQueueSize(fastify);
  });
};

type DatabaseModel = {
  queue_position: number;
};

export async function getQueueSize(
  fastify: FastifyInstance,
): Promise<ResponseType> {
  const query = `SELECT MAX(queue_position) FROM user_queue;`;
  const { rows } = await fastify.pg.query<DatabaseModel>(query);
  console.log(rows);

  if (rows.length !== 1) {
    fastify.log.error(
      `getQueueSize: failed to get queue size, got ${rows.length} rows`,
    );
    return {
      queueSize: -1,
    };
  } else
    return {
      queueSize: rows[0].max ?? 0,
    };
}

export default queueSize;
