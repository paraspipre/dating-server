const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken')
const { expressjwt: expressJwt } = require("express-jwt");
require('dotenv').config("../.env")
const fs = require("fs")

const formidable = require('formidable');


module.exports.login = async (req, res, next) => {
   try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).send("User not exist");

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).send("Email or password is incorrect");

      const token = jwt.sign({ _id: user._id }, process.env.secret);

      res.cookie("auth-token", token)
      res.json({ token, user })

   } catch (err) {
      res.status(400).send(err.message);
   }
};

module.exports.register = async (req, res) => {

   try {
      let form = new formidable.IncomingForm();
      form.keepExtensions = true;


      form.parse(req, async (err, fields, files) => {
         console.log("enter parse")
         const { name, email, password } = fields;
         const userExists = await User.findOne({ email })
         if (userExists) return res.status(400).send("User already exists");
      

         const salt =await bcrypt.genSalt(10)
         const hashedPassword = await bcrypt.hash(password, salt);
      

         let user = new User()
         user.name = name;
         user.email = email
         user.password = hashedPassword

         if (files.image) {
            if (files.image.size > 10000000) {
               return res.status(400).json({
                  error: 'Image should be less then 1mb in size'
               });
            }
            user.image.data = fs.readFileSync(files.image.filepath);
            user.image.contentType = files.image.mimetype;
         }

         user.save()

         const token = jwt.sign({ _id: user._id }, process.env.secret, { expiresIn: '1d' });
         res.cookie("auth-token", token)
         res.json({ token, user })
         console.log("end parse")

      })
      console.log("parse")
   } catch (err) {
      res.status(400).send(err.message);
   }
};


exports.requireSignin = expressJwt({
   secret: "process.env.secret", algorithms: ['RS256']
})

exports.authMiddleware = (req, res, next) => {
   const authUserId = req.user._id
   User.findById({ _id: authUserId }).exec((err, user) => {
      if (err || !user) {
         return res.status(400).json({
            error: 'User not found'
         })
      }
      req.profile = user
      next()
   })
}

module.exports.getAllUsers = async (req, res, next) => {
   try {
      let  loggeduserID  = req.params.id
      User.findById(loggeduserID).then((loggeduser, err) => {
         if (err || !loggeduser) {
            console.log("err all")
            return res.status(400).json({
               err
            })
         }
         User.find().then((users, err) => {
            if (err || !users) {
               console.log(err)
               return res.status(400).json({
                  err
               })
            }
            let usersdata = users.filter(user => !loggeduser.blockedUsers.includes(user.email)).filter(user => user.email !== loggeduser.email)
            
            return res.json({ usersdata,loggeduser});
         }).catch((err) => {
            console.log(err)
         })
      }).catch((err) => {
         console.log(err)
      })
      
   } catch (ex) {
      next(ex);
   }
};

module.exports.getUser = (req, res, next) => {
   try {
      const loggeduserID = req.params.id;
      User.findById(loggeduserID).then((err, user) => {
         if (err || !user) {
            console.log(err)
            return res.status(404).json({
               err:"user not found"
            })
         }
         return res.json(user);
      }).catch((err) => {
         console.log(err)
      })
   } catch (ex) {
      next(ex);
   }
};

module.exports.like = async (req, res) => {
   try {
      const { userId, likedUserId } = req.body;
      const user = await User.findOne({ email: userId});
      const likedUser = await User.findOne({email :likedUserId});
      user.likes.push(likedUserId);
      await user.save();
      
      res.send("Image liked!");
   } catch (err) {
      res.status(400).send(err.message);
   }
}


module.exports.superlike = async (req, res, next) => {
   try {
      const { userId, superlikedUserId } = req.body;
      const user = await User.findOne({ email: userId});
      const superlikedUser = await User.findOne({ email: superlikedUserId});
      user.superlikes.push(superlikedUserId);
      await user.save();
      
      res.send("Image superliked!");
   } catch (err) {
      res.status(400).send(err.message);
   }
};

module.exports.block = async (req, res, next) => {
   try {
      const { userId, blockedUserId } = req.body;
      const user = await User.findOne({ email: blockedUserId });
      user.blockedUsers.push(userId);
      await user.save();
      res.send("User blocked!");
   } catch (err) {
      res.status(400).send(err.message);
   }
};



module.exports.logOut = (req, res, next) => {
   res.clearCookie("token")
   res.json({
      message: "Signout success"
   })
};

exports.photo = (req, res) => {
   const name = req.params.name
   User.findOne({ name })
      .select('image')
      .exec((err, user) => {
         if (err || !user) {
            return res.status(400).json({
               err
            });
         }
         res.set('Content-Type', user.image.contentType)
         res.send(user.image.data)
      });
};
