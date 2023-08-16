const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const socket = require("socket.io");
const http = require("http");
require("dotenv").config();
const cookieParser = require('cookie-parser')
const morgan = require('morgan')

const User = require("./models/userModel")

const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({storage:storage})
const authRoutes = require("./routes/auth")

const corsOptions = {
   origin: 'https://dating-frontend-paras11917.vercel.app'
};
app.use(cors(corsOptions));

app.use(morgan('dev'))
app.use(express.json());
app.use(cookieParser())

mongoose.set("strictQuery",false)

mongoose.connect(process.env.MONGO_URL, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
})
.then(() => {
   console.log("DB Connetion Successfull");
   })
   .catch((err) => {
      console.log(err.message);
   });
   
   app.use("/api/auth",authRoutes)
   
   
const server = http.createServer(app);
const io = socket(server, {
   cors: {
      origin: "https://dating-frontend-paras11917.vercel.app"
   },
});

let onlineUsers = []

const addNewUser = ( username, socketId ) => {
   !onlineUsers.some((user) => user.username === username) && 
      onlineUsers.push({username,socketId})
}

const removeUser = (socketId) => {
   onlineUsers = onlineUsers.filter((user)=> user.socketId !== socketId)
}

const getUser = (username) => {
   return onlineUsers.find((user)=> user.username === username)
}

io.on("connection", (socket) => {
   socket.on("newUser", (username) => {
      addNewUser(username,socket.id)
   })



   socket.on("like", ({to,from,message}) => {
      const receiver = getUser(to)
      if (receiver) {
         io.to(receiver.socketId).emit("like", {
            from,
            message,
         })
      }
   })
   socket.on("superlike", ({ to, from, message,image }) => {
      const receiver = getUser(to)
      if (receiver) {
      io.to(receiver.socketId).emit("like", {
         from,
         message,
         image
      })}
   })

   socket.on("disconnect", () => {
      removeUser(socket.id)
   });
});

const port = process.env.PORT || 3001;
server.listen(port, () =>
   console.log(`Server started on ${process.env.PORT}`)
);

