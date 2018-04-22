const authors = require('./authors'),
stories = require('./stories'),
comments = require('./comments');

const visibilityOptions = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
  UNPUBLISHED: "UNPUBLISHED"
};

module.exports = {
    Visibility: (root, args, context) => visibilityOptions,
  	Author: {
      stories: async ({ _id }, args, { Stories, signedInAuthor }) => {
        if(signedInAuthor && signedInAuthor.id === _id.toString()) {
          return Stories.find({ author: _id }).toArray();
        }
        return Stories.find({ author: _id, visibility: visibilityOptions.PUBLIC }).toArray();
      },
      comments: ({ _id, comments }, args, { Comments }) => Comments.find({ author: _id }).toArray()
    },
  	Story: {
      author: ({ author }, args, { Authors }) => Authors.findOne({"_id": author}),
      comments: ({ _id }, args, { Comments }) => Comments.find({ story: _id }).toArray() 
    },
  	Comment: {
      author: ({ author }, args, { Authors }) => Authors.findOne({ "_id": author }),
      story: ({ story }, args, { Stories }) => Stories.findOne({ "_id": story })
    },
    Query: {
      ...authors, ...stories, ...comments
    }
};
