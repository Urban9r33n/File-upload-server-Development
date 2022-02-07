var mongoose = require('mongoose');
var Counter = require('./Counter');
var Daily_Counter = require('./Dailycounter');

// schema
var replySchema = mongoose.Schema({
  private_check: {
    type: Boolean,
    requried: [true, 'checker is requried!']
  },
  re_title: {
    type: String,
    default: "Re:"
  },
  re_author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  re_body: {
    type: String,
    default: "답글입니다."
  },
  re_attachment: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'file',
  }],
  re_created: {
    type: Date,
    default: Date.now
  }

});


// model & export
var Reply = mongoose.model('reply', replySchema);
module.exports = Reply;
