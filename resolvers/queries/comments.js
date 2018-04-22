const ObjectId = require('mongodb').ObjectId;

module.exports = {
    comments: (_, args, { Comments }) => Comments.find().toArray(),
    comment: (_, { commentId }, { Comments }) => Comments.findOne({"_id": ObjectId(commentId)}),
};