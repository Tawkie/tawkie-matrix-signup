import { test } from 'node:test'
import * as assert from 'node:assert'
import Fastify from 'fastify'
import SwaggerPlugin from '../../src/plugins/swagger.js'

test('SwaggerPlugin works standalone', async () => {
  const fastify = Fastify()
  void fastify.register(SwaggerPlugin)

  const schema = {
    querystring: {
      type: 'object',
      properties: {
        search: { type: 'string' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          greeting: { type: 'string' }
        }
      }
    }
  }
  fastify.get('/demoEndpoint', { schema }, () => 'demoResponse')

  await fastify.ready()

  assert.ok(fastify.swagger({ yaml: true }).includes('Tawkie Matrix signup queue'))
})
