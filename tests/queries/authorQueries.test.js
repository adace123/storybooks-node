const chai = require('chai');
const { server } = require('../../server');
const expect = chai.expect;
const queries = require('../queryDefs');

chai.use(require('chai-http'));
let authorId;

const { checkArrays, checkStrings, checkStories, basicResponseBodyCheck } = require('../helpers');

describe('author queries', () => {
    
    it('should return all authors', (done) => {
       chai.request(server).post('/graphql')
       .send({
           query: queries.allAuthors
       })
       .end((err, res) => {
          basicResponseBodyCheck(err, res, 'authors');
          expect(res.body.data.authors).not.to.be.empty;
          res.body.data.authors.every(author => {
              
            expect(author).to.have.all.keys('name', 'email', '_id', 'password', 'stories', 'comments');
            checkArrays([author.comments, author.stories]);
            checkStrings([author.name, author.email, author.password]);
            checkStories(author.stories, 'PUBLIC');
          });
          authorId = res.body.data.authors[0]._id;
          done();
       });
    });
    
    it('should return a single author', (done) => {
      chai.request(server).post('/graphql')
      .send({
          query: queries.getAuthor, 
          variables: { authorId }
      }).end((err, res) => {
          basicResponseBodyCheck(err, res, 'author');
          const author = res.body.data.author;
          expect(author).to.be.a('object').and.has.all.keys('name', 'email', '_id', 'stories', 'comments');
          checkStrings([author.name, author.email, author._id]);
          checkArrays([author.stories, author.comments]);
          expect(author.stories).to.be.a('array');
          expect(author.comments).to.be.a('array');
          checkStories(author.stories, 'PUBLIC');
          done();
      });
    });
    
    
    after(() => server.close());
    
});