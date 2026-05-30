exports.isLoggedIn = (req, res, next) => {
  console.log("===== isLoggedIn =====");
  console.log("cookie =", req.headers.cookie);
  console.log("sessionID =", req.sessionID);
  console.log("user =", req.user);
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  if (!req.user) {
    return res.status(401).json({ message: '유저 정보를 찾을 수 없습니다.' });
  }
  next();
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) return next();
  res.status(403).json({ message: '이미 로그인 상태' });
};

exports.isAdmin = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  if (user.type !== 'admin') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }
  next();
};
