FROM node:14.19.1-alpine

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npm ci

CMD [ "node", "." ]