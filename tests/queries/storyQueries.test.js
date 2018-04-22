const chai = require('chai');
const { server } = require('../../server');
const expect = chai.expect;
const queries = require('../queryDefs');
const { ObjectId } = require('mongodb');

chai.use(require('chai-http'));
let storyId;

const { checkArrays, checkStrings, basicResponseBodyCheck } = require('../helpers');

describe('test story queries', () => {
   it('should return all public stories', (done) => {
      chai.request(server).post('/graphql')
      .send({
          query: queries.allStories
      })
      .end((err, res) => {
          basicResponseBodyCheck(err, res, 'stories');
          expect(res.body.data.stories).not.to.be.empty;
          res.body.data.stories.every(story => {
            expect(story).to.have.all.keys('_id', 'title', 'content', 'visibility', 'allowComments', 'comments', 'author');
            checkArrays([story.comments]);
            checkStrings([story.title, story.content, story.visibility]);
            expect(story.visibility).to.be.equal('PUBLIC');
          });
          storyId = res.body.data.stories[0]._id;
          done();
      });
   });
   
   it('should return a single story', (done) => {
       chai.request(server).post('/graphql')
      .send({
          query: queries.getStory,
          variables: { storyId }
      })
      .end((err, res) => {
          const story = res.body.data.story;
          basicResponseBodyCheck(err, res, 'story');
          expect(story).to.be.a('object');
          expect(story).to.have.all.keys('_id', 'title', 'content', 'visibility', 'allowComments', 'comments', 'author');
          checkStrings([story.title, story.content, story.visibility]);
          expect(ObjectId.isValid(story._id)).to.be.true;
          done();
      });
   });
   
});