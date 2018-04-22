require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const { redis } = require('./schema/middleware');
const jwt = require('jsonwebtoken');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const schema = require('./schema/schema');

let mongo, Authors, Stories, Comments;

const app = express();
app.use(bodyParser.text({ type: 'application/graphql' }));
app.use(bodyParser.json());

app.use(cors());

app.use(async (req, res, next) => {
  
  if(req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    const token = req.headers.authorization.split(' ')[1];
    await jwt.verify(token, process.env.APP_SECRET, (err, decoded) => {
      if(!err) {
        req.author = decoded;
      } 
    });
  }
  next();
});

app.use('/graphql', graphqlExpress(async req => {
  if(!mongo) {
    try {
      mongo = await MongoClient.connect(process.env.MONGO_URL);
      Authors = mongo.db('storybooks').collection('authors');
      Stories = mongo.db('storybooks').collection('stories');
      Comments = mongo.db('storybooks').collection('comments');
    } catch(e) {
      throw new Error(`Could not connect: ${e}`);
    }
  }

  return {
    schema,
    context: {
      Stories,
      Authors,
      Comments,
      signedInAuthor: req.author,
      token: req.headers.authorization && req.headers.authorization.split(' ')[1]
    }
  };
}));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

const server = app.listen(process.env.PORT, () => {
  console.log('listening');
});

module.exports = {
  server
};
