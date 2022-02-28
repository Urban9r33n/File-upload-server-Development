// 삭제용 비밀번호 스키마
var mongoose = require('mongoose');  //몽구스 사용
var bcrypt = require('bcryptjs'); //암호화 도구 사용

var eraseSchema = mongoose.Schema({
  id: { //아이디 (고정)
    type: String,
    required: true,
    unique: true
  },
  password: { //비밀번호
    type: String,
    required: true,
    default:  bcrypt.hashSync('0000') //초기비밀번호 0000
  }
});

//가상 비밀번호 스키마 - 임시
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


//삭제 및 생성 + Validation.
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
        erase.invalidate('currentPassword', '현재 비밀번호가 필요합니다!');
      } else if (!bcrypt.compareSync(erase.currentPassword, erase.originalPassword)) { //compare password here if needed
        erase.invalidate('currentPassword', '비밀번호가 틀립니다!');
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
