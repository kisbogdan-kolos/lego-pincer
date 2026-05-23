# syntax=docker/dockerfile:1

# Build the frontend from source
FROM node:20 AS build-frontend

WORKDIR /frontend
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend .
RUN npm run build

# Build the application from source
FROM golang:1.26 AS build-backend

WORKDIR /app

COPY ./backend .
RUN go mod download

RUN CGO_ENABLED=0 GOOS=linux go build -o /lego-pincer

# Deploy the application binary into a lean image
FROM alpine AS build-release-stage

RUN apk add --no-cache tzdata

WORKDIR /

COPY --from=build-backend /lego-pincer /lego-pincer
COPY --from=build-backend /app/rooms.json /rooms.json
COPY --from=build-frontend /frontend/dist /dist

ENV FRONTEND_DIR=./dist
ENV ROOM_JSON_PATH=./rooms.json

EXPOSE 8080

ENTRYPOINT ["/lego-pincer"]
