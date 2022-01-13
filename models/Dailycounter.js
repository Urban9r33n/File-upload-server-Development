var mongoose = require('mongoose');

var daily_counterSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
  today: {
    type: Date,
    default: Date.now
  },
  temp: {
    type: Date,
  },
});


var Daily_Counter = mongoose.model('daily_counter', daily_counterSchema);
module.exports = Daily_Counter;
