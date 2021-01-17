const bcrypt = require('bcryptjs');
const { UserInputError } = require('apollo-server-express');

const { validateRegisterInput, validateLoginInput } = require('../../util/validators');
const { generateToken } = require('../../util/helper');
const User = require('../../models/User');

module.exports = {
   Mutation: {
      async login(parent, args, context, info) {
         const { username, password } = args;

         const { errors, valid } = validateLoginInput(username, password);

         if(!valid) {
            throw new UserInputError('Errors', { errors });
         }

         //Check user 
         const user = await User.findOne({ username });

         if(!user) {
            errors.general = 'User not found';
            throw new UserInputError('User not found', { errors });
         }
         
         //Password check
         const match = await bcrypt.compare(password, user.password);
          
         if(!match) {
            errors.general = 'Wrong credentials';
            throw new UserInputError('Wrong credentials', { errors });
         }

         const token = generateToken(user);

         return {
           ...user._doc,
           id: user._id,
           token
         }
      },
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

         const token = generateToken(res);

         return {
           ...res._doc,
           id: res._id,
           token
         }
      }
   }
}
