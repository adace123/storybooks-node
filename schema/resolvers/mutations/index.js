const authors = require('./authors');
const stories = require('./stories');
const comments = require('./comments');

module.exports = {
  Mutation: {
      ...authors,
      ...stories,
      ...comments
  }  
};