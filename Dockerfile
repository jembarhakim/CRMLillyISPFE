FROM node:22.16.0 as build

WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

FROM node:22.16.0 as production

WORKDIR /usr/src/app

# Copy built application
COPY --from=build /usr/src/app/.output ./.output
COPY --from=build /usr/src/app/package.json ./

# Install only production dependencies
RUN yarn install --production --frozen-lockfile

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
