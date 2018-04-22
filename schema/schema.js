const { makeExecutableSchema } = require('graphql-tools');
const mutations = require('../resolvers/mutations/index');
const queries = require('../resolvers/queries/index');
const typeDefs = require('./types');

const resolvers = {...queries, ...mutations};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

module.exports = schema;
