FROM node:12.16-alpine

# Create app directory
WORKDIR /web/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# install node dependencies with clean slate
RUN rm -rf node_modules
RUN yarn

# Bundle app source
COPY . .

EXPOSE 80
CMD [ "yarn", "start" ]
