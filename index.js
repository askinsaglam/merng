const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');

const typeDefs = require('./graphql/typeDefs.js');
const resolvers = require('./graphql/resolvers');
const { MONGODB } = require('./config.js');

const server = new ApolloServer({ 
  typeDefs, 
  resolvers,
  context: ({ req }) => {
     return { req }
  }
});

mongoose
  .connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB Connected');

    const app = express();
    server.applyMiddleware({ app });
    return app.listen({ port: 4000 });
  })
  .then((res) => {
    console.log('Now browse to http://localhost:4000' + server.graphqlPath);
  });
