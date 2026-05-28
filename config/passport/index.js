const localStrategy = require("./localStrategy");
const axios = require('axios');

module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        done(null, user.user_id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            if (!id) return done(null, false);

            const res = await axios.get(
                `${process.env.USER_SVC_URL}/internal/users/${id}`
            );
            return done(null, res.data || false);
        } catch (err) {
            if (err.response?.status === 404) {
                return done(null, false);
            }
            return done(err);
        }
    });

    localStrategy(passport);
};
