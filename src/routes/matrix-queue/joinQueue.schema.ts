export const joinQueueSchema = {
  body: {
    type: 'object',
    properties: {
      userId: { '$ref': 'https://tawkie.fr/common/uuid' },
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        userId: { '$ref': 'https://tawkie.fr/common/uuid' },
        queuePosition: { type: 'integer' },
      }
    },
    400: { $ref: 'https://tawkie.fr/common/HttpError' },
    500: { $ref: 'https://tawkie.fr/common/HttpError' },
  }
}
