module.exports = `
	schema {
		query: Query
		mutation: Mutation
	}

  type Query {
		stories(authorId: ID): [Story]
		story(storyId: ID): Story
		authors: [Author]
		author(authorId: ID): Author
		comments: [Comment]
		comment(commentId: ID): Comment
  }

	type Mutation {
		createStory(authorId: ID, story: StoryInput): Story
		register(author: AuthorInput): AuthPayload
		updateStory(storyId: ID, story: StoryInput): Story
		deleteStory(storyId: ID): Boolean
		deleteAuthor(authorId: ID): Boolean
		updateAuthor(authorId: ID, author: AuthorInput): Author
		createComment(authorId: ID, storyId: ID, comment: CommentInput): Comment
		updateComment(commentId: ID, comment: CommentInput): Comment
		deleteComment(commentId: ID): Boolean
		login(email: String, password: String): AuthPayload
		logout: Boolean
	}

	type Author {
		_id: ID
		name: String
		email: String
		password: String
		imageURL: String
		stories: [Story]
		comments: [Comment]
	}

	type Story {
		_id: ID
		title: String
		content: String
		allowComments: Boolean
		author: Author
		visibility: Visibility
		comments: [Comment]
	}

	type Comment {
		_id: ID
		content: String
		author: Author
		story: Story
	}
	
	type AuthPayload {
		token: String
		author: Author
	}

	input StoryInput {
		title: String
		content: String
		allowComments: Boolean
		visibility: Visibility
	}

	input AuthorInput {
		name: String
		email: String
		password: String
		imageURL: String
	}
	
	input CommentInput {
		content: String!
	}

	enum Visibility {
		PUBLIC
		PRIVATE
		UNPUBLISHED
	}
`;