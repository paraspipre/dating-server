const {
   login,
   register,
   getAllUsers,
   logOut,
   like,
   superlike,
   block,
   photo,
   getUser
} = require("../controllers/userController");

const router = require("express").Router();


const multer = require("multer")
const storage = multer.memoryStorage()
const uploadd = multer({ storage: storage })


router.get('/image/:name', photo);
router.post("/login", login);
router.post("/register", register);
router.get("/allusers/:id", getAllUsers);
router.get("/user/:id", getUser);
router.get("/logout", logOut);
router.post("/like", like)
router.post("/superlike", superlike)
router.post("/block", block)
module.exports = router;
