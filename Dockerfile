FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Tell Node what port to bind (your code still uses process.env.PORT)
ENV PORT=10004

EXPOSE 10004
CMD ["npm", "start"]
