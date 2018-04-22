const chai = require('chai');
const { server } = require('../../server');
const { redis } = require('../../schema/middleware');
const expect = chai.expect;
const jwt = require('jsonwebtoken');
const mutations = require('../mutationDefs');
const queries = require('../queryDefs');
const { basicResponseBodyCheck } = require('../helpers');
const ObjectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');
const faker = require('faker');

chai.use(require('chai-http'));
let token, authorId;

describe('test author mutations', () => {
   it('should not save a duplicate email to the DB', (done) => {
      chai.request(server).post('/graphql')
      .send({
          query: mutations.register,
          variables: { author: { name: 'Test', email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD } }
      })
      .end((err, res) => {
         basicResponseBodyCheck(err, res, 'errors');
         expect(res.body.errors[0].message).to.be.equal('Username or email has already been taken.');
         done();
      });
   });
   
   it('should successfully register an author', (done) => {
      chai.request(server).post('/graphql')
      .send({
         query: mutations.register,
         variables: { author: { name: 'Albert Einstein', email: process.env.NEW_EMAIL, password: process.env.NEW_PASSWORD } }
      })
      .end((err, res) => {
         basicResponseBodyCheck(err, res, 'register');
         const { author } = res.body.data.register;
         expect(author).to.have.all.keys('name', 'email', '_id', 'imageURL', 'password', 'stories', 'comments');
         expect(author.name).to.be.equal('Albert Einstein');
         expect(author.email).to.be.equal(process.env.NEW_EMAIL);
         const verifyPassword = bcrypt.compareSync(process.env.NEW_PASSWORD, author.password);
         expect(verifyPassword).to.be.true;
         jwt.verify(res.body.data.register.token, process.env.APP_SECRET, (err, decoded) => {
             expect(err).to.be.null;
             expect(decoded.id).to.equal(author._id.toString());
             expect(decoded.email).to.equal(author.email);
         });
         authorId = author._id;
         token = res.body.data.register.token;
         // check that author was saved to DB
         chai.request(server).post('/graphql')
         .send({
            query: queries.getAuthor,
            variables: { authorId: author._id }
         })
         .end((err, res) => {
            basicResponseBodyCheck(err, res, 'author');
            expect(res.body.data.author.email).to.be.equal(author.email);
            expect(res.body.data.author.stories).to.be.a('array').and.to.have.lengthOf(0);
            expect(res.body.data.author.comments).to.be.a('array').and.to.have.lengthOf(0);
            done();
         });
        
      });
   });
   
   it('should not be able to update an author if not logged in', (done) => {
      chai.request(server).post('/graphql')
      .send({
         query: mutations.updateAuthor,
         variables: { authorId, author: { name: faker.name.findName(), email: faker.internet.email() } }
      })
      .end((err, res) => {
         basicResponseBodyCheck(err, res, 'errors');
         expect(res.body.errors[0].message).to.be.equal('Not logged in');
         done();
      });
   });
   
   it('should not be able to update an author with invalid authorization', (done) => {
      chai.request(server).post('/graphql')
      .send({
         query: queries.allAuthors
      })
      .end(async (err, res) => {
         if(err) throw err;
         // get another author's id
         const otherAuthor = res.body.data.authors.filter(author => author._id !== authorId)[0];
         chai.request(server).post('/graphql')
         .set('Authorization', `Bearer ${token}`)
         .send({
            query: mutations.updateAuthor,
            variables: { authorId: otherAuthor._id, author: { name: faker.name.findName(), email: faker.internet.email() } }
         })
         .end((err, res) => {
            basicResponseBodyCheck(err, res, 'errors');
            expect(res.body.errors[0].message).to.be.equal('Not authorized');
            done();
         });
      });
   });
   
   it('should update an author with proper authorization', (done) => {
      const name = faker.name.findName(), email = faker.internet.email();
      chai.request(server).post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({
         query: mutations.updateAuthor,
         variables: { authorId, author: { name, email } }
      })
      .end((err, res) => {
         basicResponseBodyCheck(err, res, 'updateAuthor');
         const { updateAuthor } = res.body.data;
         expect(updateAuthor.name).to.be.equal(name);
         expect(updateAuthor.email).to.be.equal(email);
         done();
      });
   });
   
   it('should not be able to delete an author without proper authorization', (done) => {
      chai.request(server).post('/graphql')
      .send({
         query: queries.allAuthors
      })
      .end((err, res) => {
         basicResponseBodyCheck(err, res, 'authors');
         const otherAuthor = res.body.data.authors.filter(author => author._id !== authorId)[0];
         chai.request(server).post('/graphql')
         .set('Authorization', `Bearer ${token}`)
         .send({
            query: mutations.deleteAuthor,
            variables: { authorId: otherAuthor._id }
         })
         .end((err, res) => {
            basicResponseBodyCheck(err, res, 'errors');
            expect(res.body.errors[0].message).to.be.equal('Not authorized');
            done();
         });
      });
   });
   
   it('should delete an author with proper authorization', (done) => {
      chai.request(server).post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({
         query: mutations.deleteAuthor,
         variables: { authorId }
      })
      .end((err, res) => {
         basicResponseBodyCheck(err, res, 'deleteAuthor');
         expect(res.body.data.deleteAuthor).to.be.true;
         chai.request(server).post('/graphql')
         .send({
            query: queries.getAuthor,
            variables: { authorId }
         })
         .end((err, res) => {
            basicResponseBodyCheck(err, res, 'author');
            expect(res.body.data.author).to.be.null;
            done();
         });
      });
   });
   
   it('should logout successfully', (done) => {
      chai.request(server).post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({
         query: mutations.logout
      })
      .end((err, res) => {
         basicResponseBodyCheck(err, res, 'logout');
         expect(res.body.data.logout).to.be.true;
         redis.exists(token, (err, reply) => {
            expect(err).to.be.null;
            expect(reply).to.be.equal(1);
            redis.del(token);
            done();
         });
      });
   });
   
});
