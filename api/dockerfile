FROM node:14-alpine

# For handling Kernel signals properly
RUN apk add --no-cache tini

# Create the working directory, including the node_modules folder for the sake of assigning ownership in the next command
RUN mkdir -p /usr/src/app/node_modules

# Change ownership of the working directory to the node:node user:group
# This ensures that npm install can be executed successfully with the correct permissions
RUN chown -R node:node /usr/src/app

# Set the user to use when running this image
# Non previlage mode for better security (this user comes with official NodeJS image).
USER node

# Set the default working directory for the app
WORKDIR /usr/src/app

# Copy package.json, yarn.lock
# Copying this separately prevents re-running npm install on every code change.
COPY --chown=node:node package.json yarn.lock ./

# Install dependencies
RUN yarn

# Bundle app source
COPY --chown=node:node . ./

# Build files
RUN yarn build

# Environment variables after build since we need certain devDependencies on build
ENV NODE_ENV production

# Expose API port
EXPOSE 80

ENTRYPOINT ["/sbin/tini", "--"]

# Run the web service on container startup
CMD [ "yarn", "start:prod" ]
