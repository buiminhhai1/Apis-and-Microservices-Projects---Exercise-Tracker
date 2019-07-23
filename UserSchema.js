var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// Create UserSchema
let UserSchema = new Schema({
  username: {type: String, required: true},
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: Date
  }]
});

// Create Model
let User = mongoose.model("User", UserSchema);
exports.User = User;