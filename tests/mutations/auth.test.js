const chai = require('chai');
const { server } = require('../../server');
const { redis } = require('../../schema/middleware');
const expect = chai.expect;
const jwt = require('jsonwebtoken');
const mutations = require('../mutationDefs');
const { basicResponseBodyCheck } = require('../helpers');

chai.use(require('chai-http'));
let token;

describe('test auth', () => {
    
    it('should throw an error when trying to login with incorrect username or email', (done) => {
      chai.request(server).post('/graphql').send({
          query: mutations.login,
          variables: { email: process.env.TEST_EMAIL + "dfsdfsdfas", password: process.env.TEST_PASSWORD + "wiotervszc" }
      }).end((err, res) => {
          basicResponseBodyCheck(err, res, 'errors');
          expect(res.body.data.login).to.be.null;
          expect(res.body.errors[0].message).to.equal('Email or password is invalid');
          done();
      });
    });
    
    it('should login successfully', (done) => {
      chai.request(server).post('/graphql')
      .send({
          query: mutations.login,
          variables: { email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD }
      })
      .end((err, res) => {
          basicResponseBodyCheck(err, res, 'login');
          expect(res.body.data.login.token).to.be.a('string');
          expect(res.body.data.login.author).to.be.a('object');
          jwt.verify(res.body.data.login.token, process.env.APP_SECRET, (err, decoded) => {
              expect(err).to.be.null;
              expect(decoded.id).to.equal(res.body.data.login.author._id.toString());
              expect(decoded.email).to.equal(process.env.TEST_EMAIL);
          });
          
          token = res.body.data.login.token;
          done();
      });
    });
    
    
    it('should not be able to login twice', (done) => {
       chai.request(server).post('/graphql')
       .set('Authorization', `Bearer ${token}`)
       .send({
         query: mutations.login  
       })
       .end((err, res) => {
           basicResponseBodyCheck(err, res, 'errors');
           expect(res.body.errors[0].message).to.be.equal('Author is already logged in');
           done();
       });
    });
    
    it('should logout a user successfully and prevent the old token from being used on subsequent requests', (done) => {
      chai.request(server).post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({
          query: mutations.logout
      })
      .end((err, res) => {
          if(err) throw err;
         expect(res.body.data.logout).to.be.true;
         redis.exists(token, (err, reply) => {
            if(err) throw err;
            expect(reply).to.be.equal(1);
         });
         chai.request(server).post('/graphql')
         .set('Authorization', `Bearer ${token}`)
         .send({
          query: mutations.logout
         })
         .end((err, res) => {
             if(err) throw err;
             basicResponseBodyCheck(err, res, 'errors');
             expect(res.body.errors).to.be.a('array');
             expect(res.body.data.logout).to.be.null;
             expect(res.body.errors[0].message).to.be.equal('Invalid token');
             redis.del(token);
             done();
         });
      });
        
    });
    
});
