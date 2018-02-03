FROM node:8.0.0

COPY . /app

WORKDIR ./app

EXPOSE 8888

CMD ["node","schedule.js"]