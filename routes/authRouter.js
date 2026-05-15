const express = require('express');
const passport = require('passport');
const router = express.Router();
const {User} = require("../models");
const authController = require("../controllers/authController");
const authCtrl = require('../controllers/authController');
const { isLoggedIn, isNotLoggedIn } = require('../middleware/auth');

console.log('✅ [authRouter.js] 라우터 로딩됨');
console.log('🔍 [authRouter.js] passport 타입:', typeof passport);
console.trace('🔎 [authRouter.js] passport 호출 위치 추적');
console.log('✅ authRouter 연결됨');

// ────────────── 회원가입 관련 ──────────────
router.post('/join/step1', isNotLoggedIn, authCtrl.signupStep1);
router.post('/join/step2', isNotLoggedIn, authCtrl.signupStep2);
router.post('/join/email', isNotLoggedIn, authCtrl.sendEmailCode);
router.post('/verify-email', isNotLoggedIn, authCtrl.verifyEmailCode);
router.post('/join/step3', isNotLoggedIn, authCtrl.signupStep3);

// ──────────────아이디(이메일) 찾기 기능──────────────
router.post("/find-id", (req, res, next) => {
  console.log("✅ /auth/find-id 호출됨");
  next();
}, authController.findEmailsByNameAndAge);
router.post("/find-id/list-emails", authController.findEmailsByNameAndAge);
router.post("/find-id/send-code-to-email", authController.sendFindIdCodeToEmail);
router.post("/find-id/verify-code", authController.verifyFindIdCode);


// ──────────────비밀번호 변경 기능──────────────
router.post("/find-password/send-code-to-email", authController.sendFindPwCodeToEmail);
router.post("/find-password/verify-code", authController.verifyFindPwCode);
router.patch("/find-password/reset", authController.resetPassword);

// ────────────── 로그인 / 로그아웃 ──────────────
router.post('/login', isNotLoggedIn, authCtrl.login);
router.post('/logout', isLoggedIn, authCtrl.logout);

// ────────────── 카카오 로그인 ──────────────
router.get('/kakao', (req, res, next) => {
  console.log('🟡 [/auth/kakao] 카카오 로그인 시작 요청');
  console.log('🔍 passport 타입 (카카오 라우트 내):', typeof passport);
  console.trace('🔎 passport.authenticate 호출 위치 추적');
  return passport.authenticate('kakao')(req, res, next);
});

router.get('/kakao/callback', (req, res, next) => {
  passport.authenticate('kakao', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect('/login');

    if (user.isNewSocialUser) {
      req.session.socialUser = {
        provider: user.provider,
        sns_id: user.sns_id,
        email: user.email,
      };
      return res.redirect(`${process.env.FRONTEND_URL}/social-login`);
    }

    req.login(user, (err) => {
      if (err) return next(err);
      return res.redirect(`${process.env.FRONTEND_URL}/`);
    });
  })(req, res, next);
});

// ────────────── 네이버 로그인 ──────────────
router.get('/naver', (req, res, next) => {
  console.log('🟡 [/auth/naver] 네이버 로그인 시작 요청');
  passport.authenticate('naver')(req, res, next);
});

router.get('/naver/callback', (req, res, next) => {
  passport.authenticate('naver', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect('/login');

    if (user.isNewSocialUser) {
      req.session.socialUser = {
        provider: user.provider,
        sns_id: user.sns_id,
        email: user.email,
      };
      return res.redirect(`${process.env.FRONTEND_URL}/social-login`);
    }

    req.login(user, (err) => {
      if (err) return next(err);
      return res.redirect(`${process.env.FRONTEND_URL}/`);
    });
  })(req, res, next);
});


// ────────────── 구글 로그인 ──────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect('/login');

    if (user.isNewSocialUser) {
      req.session.socialUser = {
        provider: user.provider,
        sns_id: user.sns_id,
        email: user.email,
      };
      return res.redirect(`${process.env.FRONTEND_URL}/social-login`);
    }

    req.login(user, (err) => {
      if (err) return next(err);
      return res.redirect(`${process.env.FRONTEND_URL}/`);
    });
  })(req, res, next);
});


// ────────────── 소셜 유저 세션 조회 ──────────────
router.get('/social-session', (req, res) => {
  if (!req.session.socialUser) {
    return res.status(404).json({ message: '세션 없음' });
  }
  res.json(req.session.socialUser);
});

// ────────────── 소셜 유저 추가 정보 입력 ──────────────
router.post('/social-signup', authCtrl.socialSignup);

// --- 리디렉트 방지 라우터 추가 ---
router.get('/kakao/undefined/social-singup', (req, res) => {
  return res.redirect(`${process.env.FRONTEND_URL}/social-signup`);
});

console.log('🌐 process.env.FRONTEND_URL:', process.env.FRONTEND_URL);

module.exports = router;
