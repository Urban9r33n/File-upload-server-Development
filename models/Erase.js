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
    default: '0000'
  }
});




// hash password
eraseSchema.pre('save', function(next) {
  var erase = this;
  if (!erase.isModified('password')) {
    return next();
  } else {
    erase.password = bcrypt.hashSync(erase.password);
    return 0;
  }
});

// model methods
eraseSchema.methods.authenticate = function(password) {
  var erase = this;
  return bcrypt.compareSync(password, erase.password);
};


var Erase = mongoose.model('erase', eraseSchema);
module.exports = Erase;
