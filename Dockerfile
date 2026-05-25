FROM node:20-alpine

WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3010

CMD ["npm", "start"]