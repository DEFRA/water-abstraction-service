FROM node:14.19.1

WORKDIR /app

RUN apt-get update && apt-get -y install cmake

COPY package*.json ./
COPY . .
RUN npm ci

CMD [ "node", "." ]