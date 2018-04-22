const ObjectId = require('mongodb').ObjectId;

module.exports = {
    authors: (_, args, { Authors, token }) => {
        return Authors.find().toArray();
    },
    author: (_, { authorId }, { Authors }) => Authors.findOne({"_id": ObjectId(authorId)}),
};