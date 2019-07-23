const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require("path");
const cors = require('cors');
 
const mongoose = require("mongoose");
let User = require("./UserSchema").User;

mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:admin@cluster0-hs8pp.mongodb.net/fcc_api_microservice' ,{ useNewUrlParser: true});
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", () => {
  console.log("database connected");
});



app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

 
 
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

 
// Create methods Use-case 1
app.post("/api/exercise/new-user", (req,res,next) =>{
  const username = req.body.username;
  if(username){
    let fUser = {username:username, count: 0, log: []};
    User.findOne({username: username}, (err,data) =>{
      if(err) next(err);
      if(data){
        res.send("Username is already taken.");
      }else {
        User.create(fUser,(err,data)=>{
          if(err) next(err);
          if(data) res.json({_id: data._id, username:data.username});
        })
      }
    });
  }else{
    res.send("Please enter a new username");
  }
});

// Read all users Use-case 2
app.use("/api/exercise/users", (req,res) =>{
  // Get all user document with our user collection
  // send back to user as json 
  User.find({}, (err,data)=>{
    let result = data.map(item =>{
      return {"_id": item._id, "username": item.username};
    })
    res.json(result);
  })
});
 

// Update user Use-case 3
  app.post("/api/exercise/add", (req,res,next) =>{
    const id = req.body.userId;
    const description = req.body.description;
    const duration = parseInt(req.body.duration);
    const date = req.body.date ? new Date(req.body.date) : new Date();
    
    if(id && description && duration){
      User.findById(id,(err,data)=>{
        if(err) next(err);
        if(data){
          let info = {description: description, duration: duration, date: date};
          data.log.push(info);
          data.count = data.log.length;
          data.save((err,data) =>{
            if(err) console.log(err);
            else res.json(
              {
                _id: data._id, 
                username: data.username, 
                description: description, 
                duration: duration, 
                date:date});
          });
        }
      })
    }else {
      res.send("You have to fill description and duration fields");;
    }
    
  });
  
// Use-case 4
app.get("/api/exercise/log", (req, res, next)=>{
  let id = req.query.userId;
  if(id){
    let from = req.query.from;
    let to = req.query.to;
    let limit = req.query.limit;
    const limitOptions = {};
    if(limit) limitOptions.limit = limit;
    
    User.findById(id).
      populate({path: "log",
               match: {},
                select: '-_id',
                options: limitOptions
               }).exec((err,data)=>{
      if(err) next(err);
      if(data){
        let displayData = {_id: data._id, 
                           username: data.username,
                           count: data.count,
                           log: data.log
                          };
        if(from) displayData.from = from.toDateString();
        if(to) displayData.to = to.toDateString();
        displayData.log = data.log.filter(item =>{
          if(from && to){
            return item.date >= from && item.date <= to;
          } else if(from){
            return item.date >= from;
          }else if(to){
            return item.date <= to;
          } else {
            return true;
          }
        });
        res.json(displayData);
      } else {
        next();
      }
    }); 
  } else {
    res.send("UserId is required. For example, api/exercise/log?userId=554fejdcdd485fje");
  }
});
           
// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
