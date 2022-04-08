FROM node:14.19.1-alpine

WORKDIR /app

RUN apk update && apk -y install cmake

COPY package*.json ./
COPY . .

RUN npm ci

CMD [ "node", "." ]


