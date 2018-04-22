const { ObjectId } = require('mongodb');
const { requiresAuth } = require('../../schema/middleware');
const visibilityOptions = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
  UNPUBLISHED: "UNPUBLISHED"
};

module.exports = {
     createStory: requiresAuth()(async (_, { authorId, story }, { Stories, Authors }) => {
        const storyId = ObjectId();
        if(story.visibility !== visibilityOptions.PUBLIC) {
          story.allowComments = false;
        }
        await Authors.update({ "_id": authorId }, { $push: { stories: ObjectId(storyId) } });
        const { ops } = await Stories.insertOne({ ...story, _id: storyId, author: ObjectId(authorId), comments: [] });
        return ops[0];
      }),
      updateStory: requiresAuth()(async (_, { storyId, story }, { Stories, signedInAuthor }) => {
        if(story.visibility !== visibilityOptions.PUBLIC && story.allowComments) {
          story.allowComments = false;
        }
        const { value } = await Stories.findOneAndUpdate({"_id": ObjectId(storyId)}, {"$set": story}, {returnOriginal: false});
        return value;
      }),
      deleteStory: requiresAuth()(async (_, { storyId }, { Stories, signedInAuthor }) => {
        await Stories.findOneAndDelete({ "_id": ObjectId(storyId) });
        return true;
      }),
};