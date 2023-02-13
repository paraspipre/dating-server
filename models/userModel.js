const mongoose = require("mongoose");
const {isEmail} = require('validator')

const userSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Please enter name'],
      min: 3,
      max: 20,
      unique: true,
   },
   email: {
      type: String,
      required: [true,'Please enter email'],
      unique: true,
      max: 50,
      validate:[isEmail,'Please enter a valid email']
   },
   password: {
      type: String,
      required: [true,'Please enter password'],
      min: 6,
   },
   image: {
      data: Buffer,
      contentType: String
   },
   blockedUsers: [{type:String}],
   superlikes: [{ type: String }], //user liked
   likes: [{ type: String }],
   notification: []
});

module.exports = mongoose.model("Users", userSchema);
