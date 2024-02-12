import { test } from 'node:test'
import * as assert from 'node:assert'
import Fastify from 'fastify'
import postgresPlugin from '../../src/plugins/postgres.js'

test('postgresPlugin works standalone', async () => {
  const fastify = Fastify()
  void fastify.register(postgresPlugin)
  await fastify.ready()

  const query = await fastify.pg.query('SELECT 1+1 AS result;')
  assert.equal(query.rows[0].result, 2)
})

test('postgresPlugin creates table', async () => {
  const fastify = Fastify()
  void fastify.register(postgresPlugin)
  await fastify.ready()

  assert.doesNotThrow(async () => fastify.pg.query('SELECT * FROM public.user_queue;'));
});
