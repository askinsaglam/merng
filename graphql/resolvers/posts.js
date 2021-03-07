const { AuthenticationError, UserInputError } = require('apollo-server-express');

const Post = require('../../models/Post');
const checkAuth = require('../../util/authentication');

module.exports = {
  Query: {
    async getPosts() {
      try {
        const posts = await Post.find().sort({ createdAt: -1 });
        return posts;
      } catch (error) {
        throw new Error(error);
      }
    },
    async getPost(parent, args, context, info) {
      try {
        const { postId } = args;

        const post = await Post.findById(postId);

        if(post) {
          return post;
        } else {
          throw new Error('Post not found');
        }

      } catch (err) {
        throw new Error(err);
      }
    }
  },
  Mutation: {
    async createPost(parent, args, context, info) {
      const user = checkAuth(context);
      
      const { body } = args;

      const newPost = new Post({
        body,
        user: user.indexOf,
        username: user.username,
        createdAt: new Date().toISOString()
      });

      const post = await newPost.save();

      return post;
    },
    async deletePost(parent, args, context, info) {
      const user = checkAuth(context);

      const { postId } = args;

      try {
        const post = await Post.findById(postId);
        
        if(user.username === post.username) {
          await post.delete();
          return 'Post deleted successfully'
        } else {
          throw new AuthenticationError('Action not allowed');
        }
      } catch (err) {
        throw new Error(err);
      }
    },
    async likePost(parent, args, context, info) {
      const { username } = checkAuth(context);
      
      const { postId } = args;

      const post = await Post.findById(postId);
      
      if(post){
        if(post.likes.find(like => like.username === username)) {
          // Post already likes, unlike it
          post.likes = post.likes.filter(like => like.username !== username);
      
        } else {
          // Not liked, like post
          post.likes.push({
            username,
            createdAt: new Date().toISOString()
          })
        }

        await post.save();
        return post;
      } else {
        throw new UserInputError('Post not found')
      }
    }
  }
};
