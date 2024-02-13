import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'

test('matrix-queue/joinQueue is loaded', async (t) => {
  console.log('matrix-queue/joinQueue is loading')
  const app = await build(t)
  console.log('matrix-queue/joinQueue is loaded')

  const res = await app.inject({
    url: '/matrix-queue/joinQueue'
  })
  console.log('matrix-queue/joinQueue is injected')

  assert.equal(res.payload, 'this is an example')
})
