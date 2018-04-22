module.exports = {
  allAuthors: `query {
                authors {
                    name
                    email
                    _id
                    password
                    comments {
                        _id
                        content
                    }
                    stories {
                        _id
                        title
                        visibility
                        content
                        allowComments
                        comments {
                            content
                        }
                    }
                }
            }
           `,
    getAuthor: `
            query getAuthor($authorId: ID) {
                author(authorId: $authorId) {
                    name
                    email
                    _id
                    stories {
                        title
                        visibility
                        content
                        allowComments
                        comments {
                            content
                        }
                    }
                    comments {
                        content
                        _id
                    }
                }
            }
          `,
    allStories: `
            query getStory($authorId: ID) {
                stories(authorId: $authorId) {
                    _id
                    title
                    content
                    visibility
                    allowComments
                    comments {
                        content
                    }
                    author {
                        _id
                        name
                    }
                }
            }
        `,
    getStory: `
            query getStory($storyId: ID) {
                story(storyId: $storyId) {
                    _id
                    title
                    content
                    visibility
                    allowComments
                    comments {
                        content
                        _id
                    }
                    author {
                        name
                    }
                }
            }
    `,
    allComments: `
            query {
                comments {
                    _id
                    content
                    story {
                        title
                        comments {
                            _id    
                        }
                    }
                    author {
                        name
                        comments {
                            _id
                        }
                    }
                }
            }
    `,
    getComment: `
            query getComment($commentId: ID) {
                comment(commentId: $commentId) {
                    _id
                    content 
                    story {
                        title
                        comments {
                            _id
                        }
                    }
                    author {
                        name
                        comments {
                            _id
                        }
                    }
                }
            }
    `
};