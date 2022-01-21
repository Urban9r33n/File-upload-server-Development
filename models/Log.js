var mongoose = require('mongoose');

var logSchema = mongoose.Schema({
  username: {
    type: String,
  },
  action: {
    type: String
  },
  log_At: {
    type: Date,
    default: Date.now
  },
  user_IP: {
    type: String
  }
});

// model & export
var Log = mongoose.model('log', logSchema);
module.exports = Log;
