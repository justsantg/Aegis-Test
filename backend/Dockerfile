FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y bash && rm -rf /var/lib/apt/lists/*
RUN npm i -g @nestjs/cli typescript ts-node

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
