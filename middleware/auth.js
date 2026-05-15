const db = require('../models');
const User = db.User;

exports.isLoggedIn = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  try {
    // req.user가 숫자인 경우 (세션에 ID만 있을 경우) → DB에서 유저 정보 로드
    let user = req.user;
    if (typeof user === 'number') {
      user = await User.findByPk(user);
    }

    if (!user) {
      return res.status(401).json({ message: '유저 정보를 찾을 수 없습니다.' });
    }

    if (user.accountStatus === 'inactive') {
      return res.status(403).json({ message: '비활성화된 계정입니다.' });
    }

    req.user = user; // 다시 user 객체로 세팅
    next();
  } catch (err) {
    next(err);
  }
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) return next();
  res.status(403).json({ message: '이미 로그인 상태' });
};

/**
 * 관리자 권한 확인
 */
exports.isAdmin = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  // User 모델의 type 필드가 'admin' 인지 검사
  if (user.type !== 'admin') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }
  next();
};
