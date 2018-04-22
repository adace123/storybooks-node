const chai = require('chai');
const { server } = require('../../server');
const { redis } = require('../../schema/middleware');
const expect = chai.expect;
const mutations = require('../mutationDefs');
const queries = require('../queryDefs');
const { basicResponseBodyCheck } = require('../helpers');
const faker = require('faker');

chai.use(require('chai-http'));
let token, authorId, storyId;

describe('test story mutations', () => {
   it('should not create a story with invalid authorization', (done) => {
       chai.request(server).post('/graphql')
       .send({
           query: mutations.login,
           variables: { email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD }
       })
       .end((err, res) => {
           basicResponseBodyCheck(err, res, 'login');
           token = res.body.data.login.token;
           authorId = res.body.data.login.author._id;
           chai.request(server).post('/graphql')
           .send({
               query: queries.allAuthors
           })
           .end((err, res) => {
              basicResponseBodyCheck(err, res, 'authors');
              const otherAuthor = res.body.data.authors.filter(author => author._id !== authorId && author.stories.length > 0)[0];
              chai.request(server)
              .post('/graphql')
              .set('Authorization', `Bearer ${token}`)
              .send({
                  query: mutations.createStory,
                  variables: { authorId: otherAuthor._id, story: { title: faker.lorem.words(), content: faker.lorem.sentence(), allowComments: true, visibility: 'PUBLIC' } }
              }).end((err, res) => {
                  basicResponseBodyCheck(err, res, 'errors');
                  expect(res.body.errors[0].message).to.be.equal('Not authorized');
                  done();
              });
              
           });
       });
   });
   
   it('should not create a story with invalid token', (done) => {
      chai.request(server).post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({
          query: mutations.logout,
      })
      .end((err, res) => {
          basicResponseBodyCheck(err, res, 'logout');
          expect(res.body.data.logout).to.be.true;
          chai.request(server)
              .post('/graphql')
              .set('Authorization', `Bearer ${token}`)
              .send({
                  query: mutations.createStory,
                  variables: { authorId, story: { title: faker.lorem.words(), content: faker.lorem.sentence(), allowComments: true, visibility: 'PUBLIC' } }
              }).end((err, res) => {
                  basicResponseBodyCheck(err, res, 'errors');
                  expect(res.body.errors[0].message).to.be.equal('Invalid token');
                  redis.del(token);
                  done();
              });
      });
   });
   
   it('should create a story with valid authorization and token', (done) => {
       const title = faker.lorem.words(), content = faker.lorem.sentence();
       chai.request(server).post('/graphql')
       .set('Authorization', `Bearer ${token}`)
       .send({
           query: mutations.createStory,
           variables: { authorId, story: { title, content, allowComments: true, visibility: 'PUBLIC' } }
       })
       .end((err, res) => {
           basicResponseBodyCheck(err, res, 'createStory');
           const { createStory } = res.body.data;
           expect(createStory.title).to.be.equal(title);
           expect(createStory.content).to.be.equal(content);
           expect(createStory.visibility).to.be.equal('PUBLIC');
           expect(createStory.allowComments).to.be.true;
           expect(createStory.author._id).to.be.equal(authorId);
           expect(createStory.comments).to.be.a('array').and.to.have.lengthOf(0);
           storyId = createStory._id;
           chai.request(server).post('/graphql')
           .send({
               query: queries.getAuthor,
               variables: { authorId }
           })
           .end((err, res) => {
               basicResponseBodyCheck(err, res, 'author');
               expect(res.body.data.author.stories.some(story => story.title === title && story.content === content)).to.be.true;
               done();
           });
       });
   });
   
  it('should not update a story with invalid authorization', (done) => {
      const title = faker.lorem.words(), content = faker.lorem.sentence();
      chai.request(server).post('/graphql')
      .send({
          query: queries.allAuthors
      })
      .end((err, res) => {
          basicResponseBodyCheck(err, res, 'authors');
          const otherId = res.body.data.authors.filter(author => author._id !== authorId && author.stories.length)[0].stories[0]._id;
          chai.request(server).post('/graphql')
          .set('Authorization', `Bearer ${token}`)
          .send({
              query: mutations.updateStory,
              variables: { storyId: otherId, story: { title, content } }
          })
          .end((err, res) => {
              basicResponseBodyCheck(err, res, 'errors');
              expect(res.body.errors[0].message).to.be.equal('Not authorized');
              done();
          });
      });
  });
   
  it('should update a story', (done) => {
      const title = faker.lorem.words(), content = faker.lorem.sentence();
      chai.request(server).post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({
          query: mutations.updateStory,
          variables: { storyId, story: { title, content, visibility: 'PRIVATE', allowComments: true } }
      })
      .end((err, res) => {
          basicResponseBodyCheck(err, res, 'updateStory');
          const { updateStory } = res.body.data;
          expect(updateStory.title).to.be.equal(title);
          expect(updateStory.content).to.be.equal(content);
          expect(updateStory.visibility).to.be.equal('PRIVATE');
          expect(updateStory.allowComments).to.be.false;
          done();
      });
  });
  
  it('should not delete a story with invalid authorization', (done) => {
      chai.request(server).post('/graphql')
      .send({
          query: queries.allAuthors
      })
      .end((err, res) => {
          basicResponseBodyCheck(err, res, 'authors');
          const otherId = res.body.data.authors.filter(author => author._id !== authorId && author.stories.length)[0].stories[0]._id;
          chai.request(server).post('/graphql')
          .set('Authorization', `Bearer ${token}`)
          .send({
              query: mutations.deleteStory,
              variables: { storyId: otherId }
          })
          .end((err, res) => {
              basicResponseBodyCheck(err, res, 'errors');
              expect(res.body.errors[0].message).to.be.equal('Not authorized');
              done();
          });
      });
  });
  
  it('should not return a private story to an unauthorized user', (done) => {
     chai.request(server).post('/graphql')
     .set('Authorization', `Bearer ${token}`)
     .send({
         query: mutations.logout
     })
     .end((err, res) => {
         basicResponseBodyCheck(err, res, 'logout');
         expect(res.body.data.logout).to.be.true;
         chai.request(server).post('/graphql')
         .send({
             query: mutations.login,
             variables: { email: 'larry@gmail.com', password: 'Cadare12' }
         })
         .end((err, res) => {
             basicResponseBodyCheck(err, res, 'login');
             const otherToken = res.body.data.login.token;
             chai.request(server).post('/graphql')
             .set('Authorization', `Bearer ${otherToken}`)
             .send({
                 query: queries.getStory,
                 variables: { storyId }
             })
             .end((err, res) => {
                 basicResponseBodyCheck(err, res, 'errors');
                 expect(res.body.errors[0].message).to.be.equal('Not authorized');
                 redis.del(token);
                done();
             });
             
         });
     });
  });
  
  it('should return a private story to an authorized user', (done) => {
     chai.request(server).post('/graphql')
     .set('Authorization', `Bearer ${token}`)
     .send({
         query: queries.getStory,
         variables: { storyId }
     })
     .end((err, res) => {
         basicResponseBodyCheck(err, res, 'story');
         expect(res.body.data.story.visibility).to.be.equal('PRIVATE');
         done();
     });
  });
  
  it('should delete a story with valid authorization and token', (done) => {
     chai.request(server).post('/graphql')
     .set('Authorization', `Bearer ${token}`)
     .send({
         query: mutations.deleteStory,
         variables: { storyId }
     })
     .end((err, res) => {
         basicResponseBodyCheck(err, res, 'deleteStory');
         expect(res.body.data.deleteStory).to.be.true;
         chai.request(server).post('/graphql')
         .send({
             query: queries.getStory,
             variables: { storyId }
         })
         .end((err, res) => {
             basicResponseBodyCheck(err, res, 'story');
             expect(res.body.data.story).to.be.null;
             done();
         });
         
     });
  });
   
});
