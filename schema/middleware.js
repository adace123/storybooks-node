const ObjectId = require('mongodb').ObjectId;
const redis = require('redis').createClient();

const handleNotFound = (item, name) => {
    if(!item) {
        throw new Error(`${name} not found`);
    }
};

const checkValidID = (id) => {
    if(!ObjectId.isValid(id)) {
        console.log(id);
        throw new Error(`${id} is not a valid MongoDB Object ID`);
    }
};

const checkBlacklistedToken = async (token) => {
    const valid = await new Promise((res, rej) => redis.exists(token, (err, reply) => {
       if(err) rej(err);
       res(reply);
    }));
    if(valid === 1) {
        throw new Error('Invalid token');
    }
};

module.exports = {
    loggedIn: () => callback => {
        return (async (root, args, context) => {
            if(!context.signedInAuthor) {
                throw new Error('Not logged in');
            } else return callback(root, args, context);
        });
    },
    requiresAuth: (collection) => callback => {
        return (async (root, args, context) => {
            if(!context.signedInAuthor) {
                throw new Error('Not logged in');
            }

            await checkBlacklistedToken(context.token);
            Object.values(args).forEach(arg => typeof arg === 'string' && checkValidID(arg));
            
            let data;
            
            if(args.authorId) {
                const author = await context.Authors.findOne({ "_id": ObjectId(args.authorId) });
                data = author ? author._id : null;
            } else if(args.storyId) {
                const story = await context.Stories.findOne({ "_id": ObjectId(args.storyId) });
                data = story ? story.author : null;
            } else if(args.commentId) {
                const comment = await context.Comments.findOne({ "_id": ObjectId(args.commentId) });
                data = comment ? comment.author : null;
            }
            
            if(data.toString() !== context.signedInAuthor.id) {
                throw new Error('Not authorized');
            }
            
            return callback(root, args, context);
        });
    },
    handleNotFound,
    redis,
    checkBlacklistedToken
};