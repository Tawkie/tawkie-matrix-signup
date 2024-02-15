import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'


test('matrix-queue/createUser requires body', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/matrix-queue/createUser',
    method: 'PUT',
  })

  assert.equal(res.statusCode, 400)
})

test('matrix-queue/createUser requires valid uuid', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/matrix-queue/createUser',
    method: 'PUT',
    query: {
      userId: 'foo-bar-3000',
    }
  })

  assert.equal(res.statusCode, 400)
})

test('matrix-queue/createUser fails if username not set', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/matrix-queue/createUser',
    method: 'PUT',
    query: {
      userId: 'df27bea8-8596-45a8-ab28-17a733255554',
    }
  })

  assert.equal(res.statusCode, 400)
})

test('matrix-queue/createUser fails if not accepted', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/matrix-queue/createUser',
    method: 'PUT',
    query: {
      userId: 'df27bea8-8596-45a8-ab28-17a733255555',
    }
  })

  // because User.userState !== 'ACCEPTED'
  assert.equal(res.statusCode, 400)
})

test('matrix-queue/createUser creates account', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/matrix-queue/updateUsername',
    method: 'PUT',
    body: {
      userId: 'df27bea8-8596-45a8-ab28-17a7332fd03a',
      username: 'foobar3000',
    }
  })
  const body = JSON.parse(res.body)

  assert.equal(res.statusCode, 200)
  assert.equal(body.userId, 'df27bea8-8596-45a8-ab28-17a7332fd03a')
  assert.equal(typeof body.queuePosition, 'number')
  assert.ok(body.queuePosition >= 0)
  assert.equal(body.username, 'foobar3000')
  assert.equal(body.userState, 'IN_QUEUE') // TODO

  const res1 = await app.inject({
    url: '/matrix-queue/queueStatus',
    method: 'GET',
    query: {
      userId: 'df27bea8-8596-45a8-ab28-17a7332fd03a'
    },
  })
  const body1 = JSON.parse(res1.body)

  assert.equal(res1.statusCode, 200)
  assert.equal(body1.userId, 'df27bea8-8596-45a8-ab28-17a7332fd03a')
  assert.equal(typeof body1.queuePosition, 'number')
  assert.ok(body1.queuePosition === body.queuePosition)
  assert.equal(body1.username, 'foobar3000')
  assert.equal(body.userState, 'IN_QUEUE')
  // TODO asserted matrix created
})
