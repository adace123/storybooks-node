const chai = require('chai');
const { server } = require('../../server');
const expect = chai.expect;
const queries = require('../queryDefs');
const { ObjectId } = require('mongodb');

chai.use(require('chai-http'));
let commentId;

const { checkStrings, basicResponseBodyCheck } = require('../helpers');

describe('test comment queries', () => {
   it('should return all comments', (done) => {
      chai.request(server).post('/graphql')
      .send({
          query: queries.allComments
      })
      .end((err, res) => {
          basicResponseBodyCheck(err, res, 'comments');
          
          res.body.data.comments.every(comment => {
              
            expect(comment).to.have.all.keys('_id', 'content', 'story', 'author');
            checkStrings([comment.content, comment.author.name, comment.story.title]);
            expect(ObjectId.isValid(comment._id)).to.be.true;
            expect(comment.story.comments.some(c => c._id === comment._id)).to.be.true;
            expect(comment.author.comments.some(c => c._id === comment._id)).to.be.true;
          });
          commentId = res.body.data.comments[0]._id;
          done();
      });
   });
   
  it('should return a single comment', (done) => {
      chai.request(server).post('/graphql')
      .send({
          query: queries.getComment,
          variables: { commentId }
      })
      .end((err, res) => {
          const comment = res.body.data.comment;
          basicResponseBodyCheck(err, res, 'comment');
          expect(comment).to.be.a('object');
          expect(comment).to.have.all.keys('_id', 'content', 'story', 'author');
          checkStrings([comment.content, comment.author.name, comment.story.title]);
          expect(ObjectId.isValid(comment._id)).to.be.true;
          done();
      });
  });
   
});