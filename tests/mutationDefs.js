module.exports = {
    register: `
        mutation register($author: AuthorInput) {
            register(author: $author) {
                token
                author {
                    _id
                    name
                    email
                    password
                    imageURL
                    stories {
                        title                        
                    }
                    comments {
                        content
                    }
                }
            }
        }
    `,
    login: `
        mutation login($email: String, $password: String) {
            login(email: $email, password: $password) {
                token
                author {
                    _id
                    email
                    password
                }
            }
        }
      `,
    logout: `
        mutation {
            logout
        }
    `,
    updateAuthor: `
        mutation updateAuthor($authorId: ID, $author: AuthorInput) {
            updateAuthor(authorId: $authorId, author: $author) {
                name
                email
            }
        }
    `,
    deleteAuthor: `
        mutation deleteAuthor($authorId: ID) {
            deleteAuthor(authorId: $authorId)
        }
    `,
    createStory: `
        mutation createStory($authorId: ID, $story: StoryInput) {
            createStory(authorId: $authorId, story: $story) {
                _id
                title
                content
                visibility
                allowComments
                author {
                    _id
                }
                comments {
                    _id
                }
            }
        }
    `,
    updateStory: `
        mutation updateStory($storyId: ID, $story: StoryInput) {
            updateStory(storyId: $storyId, story: $story) {
                _id
                title
                content
                visibility
                allowComments
            }
        }
    `,
    deleteStory: `
        mutation deleteStory($storyId: ID) {
            deleteStory(storyId: $storyId)
        }
    `,
    createComment: `
        mutation createComment($authorId: ID, $storyId: ID, $comment: CommentInput) {
            createComment(authorId: $authorId, storyId: $storyId, comment: $comment) {
                _id
                content
                author {
                    _id
                }
                story {
                    _id
                }
            }
        }
    `,
    updateComment: `
        mutation updateComment($commentId: ID, $comment: CommentInput) {
            updateComment(commentId: $commentId, comment: $comment) {
                _id
                content
                author {
                    _id
                }
                story {
                    _id
                }
            }   
        }
    `,
    deleteComment: `
        mutation deleteComment($commentId: ID) {
            deleteComment(commentId: $commentId)
        }
    `
};