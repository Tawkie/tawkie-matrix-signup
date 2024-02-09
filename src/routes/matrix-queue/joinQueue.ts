import { FastifyPluginAsync } from "fastify"
import { joinQueueSchema } from "./joinQueue.schema.js"

const example: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', { schema: joinQueueSchema }, async function(request, reply) {
    // TODO
    return 'this is an example'
  })
}

export default example;
