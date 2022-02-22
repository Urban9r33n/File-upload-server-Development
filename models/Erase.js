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
    default:  bcrypt.hashSync('0000')
  }
});

eraseSchema.virtual('originalPassword')
  .get(function() {
    return this._originalPassword;
  })
  .set(function(value) {
    this._originalPassword = value;
  });

eraseSchema.virtual('currentPassword')
  .get(function() {
    return this._currentPassword;
  })
  .set(function(value) {
    this._currentPassword = value;
  });

eraseSchema.virtual('newPassword')
  .get(function() {
    return this._newPassword;
  })
  .set(function(value) {
    this._newPassword = value;
  });


  var passwordRegex = /^(?=.*\d).{4,}$/;
  var passwordRegexErrorMessage = '4자리 이상의 숫자만 입력이 가능합니다!';
  eraseSchema.path('password').validate(function(v) {

    erase = this;
    // create erase
    if (erase.isNew) {
      if (!passwordRegex.test(erase.password)) {
        erase.invalidate('password', passwordRegexErrorMessage);
      }
    }

    // update erase
    if (!erase.isNew) {
      if (!erase.currentPassword) {
        erase.invalidate('currentPassword', 'Current Password is required!');
      } else if (!bcrypt.compareSync(erase.currentPassword, erase.originalPassword)) { //compare password here if needed
        erase.invalidate('currentPassword', 'Current Password is invalid!');
      }

      if (erase.newPassword && !passwordRegex.test(erase.newPassword)) {
        erase.invalidate("newPassword", passwordRegexErrorMessage);
      }
    }
  });

  // hash password
  eraseSchema.pre('save', function(next) {
    var erase = this;

    if (!erase.isModified('password')) {
      return next();
    } else {
      erase.password = bcrypt.hashSync(erase.password);
      return next();
    }
  });

  eraseSchema.methods.authenticate = function(password) {
    var erase = this;
    return (bcrypt.compareSync(password, erase.password));
  };


var Erase = mongoose.model('erase', eraseSchema);
module.exports = Erase;
