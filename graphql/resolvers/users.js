const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserInputError } = require('apollo-server-express');

const { validateRegisterInput } = require('../../util/validators');
const { SECRET_KEY } = require('../../config');
const User = require('../../models/User');

module.exports = {
   Mutation: {
      async register(parent, args, context, info) {
         const { registerInput: { username, email, password, confirmPassword } } = args;
         // Validate user data
         const { valid, errors } = validateRegisterInput(username, email, password, confirmPassword);
         
         if(!valid) {
            throw new UserInputError('Errors', { errors });
         }

         // Make sure user doesnt already exist  
         const user = await User.findOne({ username });

         if(user) {
           throw new UserInputError('Username is taken', {
              errors: {
                 username: 'This username is taken'
              }
           })
         }
            
         // Hash password and create an auth token
         const passwordHash = await bcrypt.hash(password, 12);
         
         const newUser = new User({
            email,
            username,
            password: passwordHash,
            createdAt: new Date().toISOString()
         });

         const res = await newUser.save();

         const token = jwt.sign({
           id: res.id,
           email: res.email,
           username: res.username
         }, SECRET_KEY, { expiresIn: '1h'});

         return {
           ...res._doc,
           id: res._id,
           token
         }
      }
   }
}
