FROM node:8.0.0

COPY . /app

WORKDIR ./app

RUN npm install

EXPOSE 8888

CMD ["node","schedule.js"]