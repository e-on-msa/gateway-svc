const passport = require("passport");
const localStrategy = require("./localStrategy");
const kakaoStrategy = require("./kakaoStrategy");
const NaverStrategy = require("./naverStrategy");
const { User } = require("../../models");
const googleStrategy = require("./googleStrategy");
const naverStrategy = require("./naverStrategy");

module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        if (user.isNewSocialUser) {
            // console.log("🟡 serializeUser skipped for new social user");
            return done(null, null);
        }
        // console.log("✅ serializeUser: user_id =", user.user_id);
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

            if (user) {
                // console.log("✅ deserializeUser: 유저 정보 불러옴");
                return done(null, user);
            } else {
                return done(null, false);
            }
        } catch (err) {
            return done(err);
        }
    });

    localStrategy(passport);
    kakaoStrategy(passport);
    naverStrategy(passport);
    googleStrategy(passport);
};
