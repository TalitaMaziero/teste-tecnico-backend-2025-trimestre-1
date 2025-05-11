FROM node:22-alpine

# Essa pasta será criada automaticamente DENTRO DO CONTAINER
WORKDIR /app

COPY package*.json ./
RUN npm install

# Copia sua pasta src e videos para o container
COPY ./src ./src
COPY ./videos /videos

# Vai para o diretório onde está server.js no container
WORKDIR /app/src

EXPOSE 3000

CMD ["node", "--watch", "server.js"]
