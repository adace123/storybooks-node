const chai = require('chai');
const { server } = require('../../server');
const { redis } = require('../../schema/middleware');
const expect = chai.expect;
const mutations = require('../mutationDefs');
const queries = require('../queryDefs');
const { basicResponseBodyCheck } = require('../helpers');

chai.use(require('chai-http'));
let token, authorId, storyId, noCommentStoryId, commentId, otherAuthorId;

describe('test comment mutations', () => {
  it('should not create a comment if not logged in', (done) => {
      chai.request(server).post('/graphql')
      .send({
          query: mutations.login,
          variables: { email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD }
      })
      .end((err, res) => {
          basicResponseBodyCheck(err, res, 'login');
          
          authorId = res.body.data.login.author._id;
          token = res.body.data.login.token;
          chai.request(server).post('/graphql')
          .set('Authorization', `Bearer ${token}`)
          .send({
              query: queries.allStories,
              variables: { authorId }
          })
          .end((err, res) => {
               basicResponseBodyCheck(err, res, 'stories');
               const { stories } = res.body.data;
               expect(stories.every(story => story.author._id === authorId)).to.be.true;
               stories.forEach(story => {
                   if(story.visibility !== 'PUBLIC') {
                       noCommentStoryId = story._id;
                   } else {
                       storyId = story._id;
                   }
               });
               
               chai.request(server).post('/graphql')
               .send({
                   query: mutations.createComment,
                   variables: { storyId, authorId, comment: { content: `Sample content for story with id ${storyId}` } }
               })
               .end((err, res) => {
                   basicResponseBodyCheck(err, res, 'errors');
                   expect(res.body.errors[0].message).to.be.equal('Not logged in');
                   done();
               });
          });
      });
  });
  
  it('should create a comment when logged in', (done) => {
      chai.request(server).post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({
          query: mutations.createComment,
          variables: { authorId, storyId, comment: { content: `Sample content for story with id ${storyId}` } }
      })
      .end((err, res) => {
          basicResponseBodyCheck(err, res, 'createComment');
          const { createComment } = res.body.data;
          expect(createComment.author._id).to.be.equal(authorId);
          expect(createComment.story._id).to.be.equal(storyId);
          commentId = createComment._id;
          chai.request(server).post('/graphql')
          .send({
             query: queries.getAuthor,
             variables: { authorId }
          })
          .end((err, res) => {
              basicResponseBodyCheck(err, res, 'author');
              expect(res.body.data.author.comments.some(comment => comment._id === commentId)).to.be.true;
              chai.request(server).post('/graphql')
              .send({
                  query: queries.getStory,
                  variables: { storyId }
              })
              .end((err, res) => {
                  basicResponseBodyCheck(err, res, 'story');
                  expect(res.body.data.story.comments.some(comment => comment._id === commentId)).to.be.true;
                  done();
              });
          });
      });
  });
  
  it('should not create a comment for a non-comment story', (done) => {
     chai.request(server).post('/graphql')
     .send({
         query: queries.allStories
     })
     .end((err, res) => {
       basicResponseBodyCheck(err, res, 'stories');
       const noCommentStory = res.body.data.stories.filter(story => !story.allowComments)[0];
       chai.request(server).post('/graphql')
       .set('Authorization', `Bearer ${token}`)
       .send({
           query: mutations.createComment,
           variables: { authorId, storyId: noCommentStory._id, comment: { content: 'This comment won\'t be saved.' } }
       })
       .end((err, res) => {
           basicResponseBodyCheck(err, res, 'errors');
           expect(res.body.errors[0].message).to.be.equal('Story does not allow comments.');
           done();
       });
     });
  });
  
  it('should not update a comment if not authorized', (done) => {
     chai.request(server).post('/graphql')
     .send({
         query: queries.allAuthors
     })
     .end((err, res) => {
         basicResponseBodyCheck(err, res, 'authors');
         const { authors } = res.body.data;
         const otherAuthor = authors.filter(author => author.comments.length && author._id !== authorId)[0];
         chai.request(server).post('/graphql')
         .set(`Authorization`, `Bearer ${token}`)
         .send({
             query: mutations.updateComment,
             variables: { commentId: otherAuthor.comments[0]._id, comment: { content: 'updated comment' } }
         })
         .end((err, res) => {
             basicResponseBodyCheck(err, res, 'errors');
             expect(res.body.errors[0].message).to.be.equal('Not authorized');
             done();
         });
     });
  });
  
  it('should update a comment with proper authorization', (done) => {
     chai.request(server).post('/graphql')
     .set('Authorization', `Bearer ${token}`)
     .send({
         query: mutations.updateComment,
         variables: { commentId, comment: { content: 'updated comment' } }
     })
     .end((err, res) => {
         basicResponseBodyCheck(err, res, 'updateComment');
         const { updateComment } = res.body.data;
         expect(updateComment.content).to.be.equal('updated comment');
         expect(updateComment._id).to.be.equal(commentId);
         expect(updateComment.story._id).to.be.equal(storyId);
         expect(updateComment.author._id).to.be.equal(authorId);
         done();
     });
  });
  
  it('should not delete a comment if not authorized', (done) => {
     chai.request(server).post('/graphql')
     .send({
         query: queries.allAuthors
     })
     .end((err, res) => {
         basicResponseBodyCheck(err, res, 'authors');
         const { authors } = res.body.data;
         const otherAuthor = authors.filter(author => author.comments.length && author._id !== authorId)[0];
         chai.request(server).post('/graphql')
         .set('Authorization', `Bearer ${token}`)
         .send({
             query: mutations.deleteComment,
             variables: { commentId: otherAuthor.comments[0]._id }
         })
         .end((err, res) => {
             basicResponseBodyCheck(err, res, 'errors');
             expect(res.body.errors[0].message).to.be.equal('Not authorized');
             done();
         });
     });
  });
  
  it('should delete a comment with proper authorization', (done) => {
     chai.request(server).post('/graphql')
     .set('Authorization', `Bearer ${token}`)
     .send({
         query: mutations.deleteComment,
         variables: { commentId }
     })
     .end((err, res) => {
         console.log(res.body);
         basicResponseBodyCheck(err, res, 'deleteComment');
         expect(res.body.data.deleteComment).to.be.true;
         chai.request(server).post('/graphql')
         .send({
             query: queries.getComment,
             variables: { commentId }
         })
         .end((err, res) => {
             basicResponseBodyCheck(err, res, 'comment');
             expect(res.body.data.comment).to.be.null;
             done();
         });
     });
  });
  
});