const LocalStrategy = require('passport-local').Strategy;
const axios = require('axios');

module.exports = (passport) => {
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const res = await axios.post(
          `${process.env.USER_SVC_URL}/internal/auth/login`,
          { email, password }
        );
        return done(null, res.data.user);
      } catch (err) {
        if (err.response?.status === 401) {
          return done(null, false, { message: err.response.data.message });
        }
        return done(err);
      }
    }
  ));
};
