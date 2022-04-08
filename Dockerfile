FROM node:14.19.1-alpine

WORKDIR /app

RUN apk update && apk install cmake

COPY package*.json ./
COPY . .

RUN npm ci

CMD [ "node", "." ]


