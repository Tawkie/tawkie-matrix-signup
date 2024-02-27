FROM node:18

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN npm run build:prod

EXPOSE 3000

ENV ADDRESS=0.0.0.0 PORT=3000
ENV NODE_ENV production

CMD ["node", "dist/server.js"]
