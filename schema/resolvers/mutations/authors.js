const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { redis } = require('../../middleware');
const ObjectId = require('mongodb').ObjectId;
const { requiresAuth, checkBlacklistedToken } = require('../../middleware'); 

module.exports = {
      register: async (_, { author }, { Authors, signedInAuthor }) => {
        const existingUser = await Authors.findOne({"$or": [{"email": author.email}, {"name": author.name}]});
        if(existingUser) {
          throw new Error('Username or email has already been taken.');
        } else if(signedInAuthor) {
          throw new Error('Author is already registered and logged in.');
        }
        const { data } = await axios.get('https://picsum.photos/list');
        const imageURL = data[parseInt(Math.random() * data.length, 10)]["post_url"];
        author = { ...author, _id: ObjectId(), password: bcrypt.hashSync(author.password, 10), comments: [], stories: [], imageURL };
        await Authors.insertOne(author);
        return {
          author,
          token: jwt.sign({ name: author.name, email: author.email, id: author._id }, process.env.APP_SECRET)
        };
      },  
      deleteAuthor: requiresAuth("authors")(async (_, { authorId }, { Authors }) => {
        await Authors.findOneAndDelete({"_id": ObjectId(authorId)});
        return true;
      }),
      updateAuthor: requiresAuth("authors")(async (_, { authorId, author }, { Authors }) => {
        let conflictingAuthors = 
          await Authors.find({"$or": [{"email": author.email}, {"name": author.name}]}).toArray();
          conflictingAuthors = conflictingAuthors.filter(author => author._id.toString() !== authorId);
        if(conflictingAuthors.length) {
          throw new Error("Cannot use this name or email.");
        }
        const { value } = await Authors.findOneAndUpdate({"_id": ObjectId(authorId)}, {"$set": author}, {returnOriginal: false});
        return value;
      }),
      login: async (_, { email, password }, { Authors, signedInAuthor }) => {
        
        if(signedInAuthor) {
          throw new Error('Author is already logged in');
        }
        
        const author = await Authors.findOne({ email });
        if(!author || !bcrypt.compareSync(password, author.password)) {
          throw new Error('Email or password is invalid');
        }
        
        const token = await jwt.sign({ name: author.name, email: author.email, id: author._id }, process.env.APP_SECRET);
        // check for blacklisted token
        await checkBlacklistedToken(token);
        return {
          author,
          token
        };
      },
      logout: async (root, args, { signedInAuthor, token }) => {
        // no token = already logged out
        if(!signedInAuthor) {
          throw new Error('Author is already logged out.');
        }
        
        await checkBlacklistedToken(token);

        await redis.set(token, signedInAuthor.id.toString());
        
        return true;

      }
};