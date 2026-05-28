const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const { isLoggedIn, isNotLoggedIn } = require('../middleware/auth');

// ────────────── 회원가입 관련 ──────────────
router.post('/join/step1', isNotLoggedIn, authCtrl.signupStep1);
router.post('/join/step2', isNotLoggedIn, authCtrl.signupStep2);
router.post('/join/email', isNotLoggedIn, authCtrl.sendEmailCode);
router.post('/verify-email', isNotLoggedIn, authCtrl.verifyEmailCode);
router.post('/join/step3', isNotLoggedIn, authCtrl.signupStep3);

// ────────────── 아이디(이메일) 찾기 ──────────────
router.post('/find-id', authCtrl.findEmailsByNameAndAge);
router.post('/find-id/list-emails', authCtrl.findEmailsByNameAndAge);
router.post('/find-id/send-code-to-email', authCtrl.sendFindIdCodeToEmail);
router.post('/find-id/verify-code', authCtrl.verifyFindIdCode);

// ────────────── 비밀번호 변경 ──────────────
router.post('/find-password/send-code-to-email', authCtrl.sendFindPwCodeToEmail);
router.post('/find-password/verify-code', authCtrl.verifyFindPwCode);
router.patch('/find-password/reset', authCtrl.resetPassword);

// ────────────── 로그인 / 로그아웃 ──────────────
router.post('/login', isNotLoggedIn, authCtrl.login);
router.post('/logout', isLoggedIn, authCtrl.logout);

module.exports = router;
