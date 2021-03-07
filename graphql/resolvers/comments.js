const { AuthenticationError, UserInputError } = require('apollo-server-express'); 

const Post = require('../../models/Post');
const checkAuth = require('../../util/authentication');

module.exports = {
  Mutation: {
    createComment: async (parent, args, context, info) => {
        const { username } = checkAuth(context);
        
        const { postId, body } = args;

        if(body.trim() === '') {
           throw new UserInputError('Empty content', {
              errors: {
                body: 'Comment body must not empty'
              }
           })
        }

        const post = await Post.findById(postId);

        if(post) {
          post.comments.unshift({
             body,
             username,
             createdAt: new Date().toISOString()
          })

          await post.save();
          return post;
        } else {
          throw new UserInputError('Post not found');
        }
    },
    deleteComment: async (parent, args, context, info) => {
       const { username } = checkAuth(context);
       
       const { postId, commentId } = args;
       const post = await Post.findById(postId);

       if(post) {
         const commentIndex = post.comments.findIndex(c => c.id === commentId);
         
         if(post.comments[commentIndex].username === username){
           post.comments.splice(commentIndex, 1);
           await post.save();

           return post;
         } else {
           throw new AuthenticationError('Action not allowed');
         }
       } else {
         throw new UserInputError('Post not found');
       }
    }
  }
}