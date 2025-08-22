FROM node:18-alpine

# Create app directory
RUN mkdir -p /usr/src/app
#Set the created directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json /usr/src/app/

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . /usr/src/app

EXPOSE 10040

# Change this to whatever is the executable, it could be either server.js or app.js
CMD [ "npm", "start" ]