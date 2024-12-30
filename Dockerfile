FROM node:23

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 8000

CMD [ "npm", "run", "dev" ]