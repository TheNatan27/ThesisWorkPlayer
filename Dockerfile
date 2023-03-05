FROM node:latest

COPY / /APP

WORKDIR /APP

RUN npx playwright install chromium

RUN npx playwright install-deps

EXPOSE 30552

ENTRYPOINT [ "npm","test" ] 
