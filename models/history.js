var mongoose = require('mongoose');

// schema
var counterSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  timestamp: {
    type:  Date,
    default: Date.now
  },
  ip: {
    type: String
  }
});


// model & export
var History = mongoose.model('history', counterSchema);
module.exports = History;
