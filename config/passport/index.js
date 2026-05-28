const localStrategy = require("./localStrategy");
const { User } = require("../../models");

module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        done(null, user.user_id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            if (!id) return done(null, false);
            const user = await User.findByPk(id, {
                attributes: [
                    "user_id",
                    "name",
                    "email",
                    "age",
                    "type",
                    "state_code",
                    "provider",
                    "sns_id",
                    "agreements",
                    "email_notification",
                ],
            });

            return done(null, user || false);
        } catch (err) {
            return done(err);
        }
    });

    localStrategy(passport);
};
