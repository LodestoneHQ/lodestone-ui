# build image
FROM node:12 AS builder

# set working directory
WORKDIR /lodestone

# add `/lodestone/node_modules/.bin` to $PATH
ENV PATH /lodestone/backend/node_modules/.bin:/lodestone/frontend/node_modules/.bin:$PATH

# add frontend/backend
COPY ./frontend /lodestone/frontend
COPY ./backend /lodestone/backend

# install global dependencies
RUN npm install -g @angular/cli@latest \
    && npm install -g nodemon

# install frontend and backend dependencies
RUN cd /lodestone/frontend \
    && npm install \
    && cd /lodestone/backend \
    && npm install

# build frontend app (and copy into backend public directory)
RUN mkdir -p /lodestone/backend/public \
    && cd /lodestone/frontend \
    && npm run-script build-lodestone

FROM node:12-alpine

# set working directory
WORKDIR /lodestone
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD curl --silent --fail localhost:3000/api/v1/healthcheck || exit 1
RUN apk --no-cache add curl

COPY --from=builder /lodestone/backend /lodestone

CMD ["npm", "start"]

