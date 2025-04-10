FROM nginx:stable-alpine

WORKDIR /usr/share/nginx/html

RUN rm index.html

COPY . .

EXPOSE 80