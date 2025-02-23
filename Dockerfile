FROM node:22.14.0 AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:22.14.0

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/prisma ./prisma

RUN npm install

EXPOSE 8000

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node ./dist/index.js"]