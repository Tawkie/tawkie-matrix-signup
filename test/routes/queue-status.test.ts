import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'


test('matrix-queue/queueStatus requires body', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/matrix-queue/queueStatus',
    method: 'GET',
  })

  assert.equal(res.statusCode, 400)
})

test('matrix-queue/queueStatus requires valid uuid', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/matrix-queue/queueStatus',
    method: 'GET',
    query: {
      userId: 'foo-bar-3000'
    }
  })

  assert.equal(res.statusCode, 400)
})

test('matrix-queue/queueStatus adds to queue a valid uuid', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/matrix-queue/queueStatus',
    method: 'GET',
    query: {
      userId: 'df27bea8-8596-45a8-ab28-17a7332fd03a'
    }
  })
  const body = JSON.parse(res.body)

  assert.equal(res.statusCode, 200)
  assert.equal(body.userId, 'df27bea8-8596-45a8-ab28-17a7332fd03a')
  assert.equal(typeof body.queuePosition, 'number')
  assert.ok(body.queuePosition >= 0)
  assert.equal(body.userState, 'IN_QUEUE')
})

test('matrix-queue/queueStatus adding same uuid to queue returns same position', async (t) => {
  const app = await build(t)

  const request = {
    url: '/matrix-queue/queueStatus',
    method: 'GET',
    query: {
      userId: 'df27bea8-8596-45a8-ab28-17a7332fd032'
    }
  }

  // First request
  const res = await app.inject(request)
  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.body)
  assert.equal(body.userId, request.query.userId)
  assert.equal(typeof body.queuePosition, 'number')
  assert.ok(body.queuePosition >= 0)
  assert.equal(body.userState, 'IN_QUEUE')

  // Second request
  const res1 = await app.inject(request)
  assert.equal(res1.statusCode, 200)
  const body1 = JSON.parse(res1.body)
  assert.equal(body1.userId, request.query.userId)
  assert.equal(typeof body1.queuePosition, 'number')
  assert.ok(body1.queuePosition == body.queuePosition)
  assert.equal(body.userState, 'IN_QUEUE')
})
