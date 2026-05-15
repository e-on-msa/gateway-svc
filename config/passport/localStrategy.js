const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const db = require('../../models');
const User = db.User;

module.exports = (passport) => {
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',        // 로그인 폼에서 이메일 입력 필드
      passwordField: 'password',     // 로그인 폼에서 비밀번호 입력 필드
    },
    async (email, password, done) => {
      try {
        // password 필드(pw)를 모델 정의에 맞춰 가져옴
        const user = await User.findOne({
          where: { email },
          attributes: ['user_id', 'email', 'password', 'state_code', 'type', 'provider']
        });

        // 가입되지 않은 유저
        if (!user) {
          return done(null, false, { message: '가입되지 않은 회원입니다.' });
        }

        // password가 null인 경우 = 소셜 로그인 계정
        if (!user.password) {
          return done(null, false, {
            message: '소셜 로그인 계정입니다. 해당 로그인 버튼을 이용해주세요.',
          });
        }

        // 비활성화된 계정
        if (user.state_code === 'inactive') {
          return done(null, false, { message: '비활성화된 계정입니다.' });
        }

        // 비밀번호 비교
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
        }

        // 로그인 성공
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
};
