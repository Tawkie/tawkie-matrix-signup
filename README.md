# Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)
This project was bootstrapped with Fastify-CLI.

## Available Scripts

Environment variables :
- `MATRIX_ADMIN_BASE_URL` : Base url to call the Matrix API. default : `http://127.0.0.1:8008/_synapse/`
- `MATRIX_ADMIN_ACCESS_TOKEN` : Admin access token, see [docs][synapse-making-admin-api-request].
  default : `syt_foobar`
- `TAWKIE_SIGNUP_POSTGRES_URI` : Postgres database uri. See test section below on how to start a local postgres db.
  default : `postgres://postgres:mysecretpassword@localhost/postgres`

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

## Running a local postgres instance

A postgres database is required for the service to function. Start a local postgres instance with the command below. Note : the storage is ephemeral.

```
docker run --rm -it -p 5432:5432 --name some-postgres -e POSTGRES_PASSWORD=mysecretpassword -d postgres
```

## Building and running docker image

Build :

```
npm run build:prod
docker build -t tawkie-matrix-signup .
```

Create docker network and connect local postgres database :

```
docker network create --driver=bridge tawkie
docker network connect tawkie some-postgres
```

Run :

```
docker run -it --rm \
  -e TAWKIE_SIGNUP_POSTGRES_URI=postgres://postgres:mysecretpassword@some-postgres/postgres \
  -p 3000:3000 \
  --network=tawkie \
  tawkie-matrix-signup
```

## Learn More

If you run into weird problems, try `rm -rf dist/` before loosing your sanity.

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).
