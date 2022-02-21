var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var eraseSchema = mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    default: bcrypt.hashSync('0000', 10)
  }
});


var Erase = mongoose.model('erase', eraseSchema);
module.exports = Erase;
