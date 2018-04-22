const jwt = require('jsonwebtoken');

const visibilityOptions = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
  UNPUBLISHED: "UNPUBLISHED"
};

const ObjectId = require('mongodb').ObjectId;

module.exports = {
    stories: async (_, { authorId }, { Stories, signedInAuthor }) => {
        if(!authorId) {
            return Stories.find({"visibility": visibilityOptions.PUBLIC}).toArray();
        }
        else if(signedInAuthor && authorId === signedInAuthor.id) {
            console.log('signed in author, returning stories');
            return Stories.find({"author": ObjectId(authorId)}).toArray();
        }
        console.log('my public stories');
        return Stories.find({"author": ObjectId(authorId), "visibility": visibilityOptions.PUBLIC}).toArray();
      },
    story: async (_, { storyId }, { Stories, signedInAuthor }) => {
        const story = await Stories.findOne({"_id": ObjectId(storyId)});
        if(story && story.visibility !== visibilityOptions.PUBLIC) {
            if(!signedInAuthor) {
                throw new Error('Not logged in');
            } else if(signedInAuthor.id !== story.author.toString()) {
                throw new Error('Not authorized');
            }
        }
        return story;
    }
};