const ObjectId = require('mongodb').ObjectId;
const { loggedIn, requiresAuth } = require('../../schema/middleware'); 

module.exports = {
      createComment: loggedIn()(async (_, { authorId, storyId, comment }, { Authors, Stories, Comments, signedInAuthor }) => {
        const commentId = ObjectId();
        const author = await Authors.findOne({"_id": ObjectId(authorId)});
        const story = await Stories.findOne({"_id": ObjectId(storyId)});
        if(!author || !story) {
          throw new Error("User or story doesn't exist for this comment.");
        } else if(!story.allowComments) {
          throw new Error('Story does not allow comments.');
        }
        const { ops } = await Comments.insertOne({ "_id": commentId, content: comment.content, author: author._id, story: story._id });
        await Stories.update({ "_id": storyId}, { $push: { comments: commentId } });
        await Authors.update({ "_id": authorId}, { $push: { comments: commentId } });
        return ops[0];
      }),
      updateComment: requiresAuth()(async (_, { commentId, comment }, { Comments }) => {
        const { value } = await Comments.findOneAndUpdate({"_id": ObjectId(commentId)}, {"$set": comment}, {returnOriginal: false});
        return value;
      }),
      deleteComment: requiresAuth()(async (_, { commentId }, { Comments }) => {
        await Comments.findOneAndDelete({"_id": ObjectId(commentId)});
        return true;
      })
};