FROM node:21 AS builder

WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . .

FROM node:21-alpine

WORKDIR /usr/src/app
COPY --from=builder /usr/src/app ./
EXPOSE 5000
CMD ["node", "server.js"]

