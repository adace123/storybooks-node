const expect = require('chai').expect;

const basicResponseBodyCheck = (err, res, prop) => {
    expect(err).to.be.null;
    expect(res).to.have.status(200);
    expect(res.body).to.not.be.null;
    if(prop !== 'errors') {
        expect(res.body).to.not.have.property('errors');
        expect(res.body).to.have.property('data');
        
        expect(res.body.data).to.have.property(prop);
    }
     else expect(res.body).to.have.property('errors');
};

const checkStrings = (strings) => {
    strings.forEach(str => {
        expect(str).to.be.a('string').and.to.have.lengthOf.above(0);
    });
};

const checkArrays = (arrays) => {
    arrays.forEach(arr => {
        expect(arr).to.be.a('array');
    });
};

const checkStories = (stories, visibility) => {
    if(stories.length) {
         stories.every(story => {
            expect(story).to.have.keys('title', 'visibility', 'content', 'allowComments', 'comments');
            expect(story).to.have.property('visibility', visibility);
            checkStrings([story.visibility, story.content, story.title]);
            expect(story.allowComments).to.be.a('boolean');
            checkArrays([story.comments]);
         });
     }
};

module.exports = {
    checkArrays, checkStrings, basicResponseBodyCheck, checkStories
};
