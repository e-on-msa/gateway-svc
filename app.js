require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const csrf = require("csurf");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const { createProxyMiddleware, fixRequestBody } = require("http-proxy-middleware");
const { RedisStore } = require("connect-redis");
const { createClient } = require("redis");

require("./config/passport")(passport);

const app = express();

// ── Redis 클라이언트 설정 ──
const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST || "redis",
        port: parseInt(process.env.REDIS_PORT) || 6379,
    },
});

// redisClient.connect().catch(console.error);

// ── 보안 헤더 ──
app.use(helmet());

// ── CORS ──
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));

// ── Body Parser ──
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── 세션 (Redis) ──
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({ client: redisClient }),
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
    },
});
app.use(sessionMiddleware);

// ── Passport ──
app.use(passport.initialize());
app.use(passport.session());

// ── 헬스체크 ──
app.get("/", (req, res) => {
    res.status(200).json({ service: "gateway-svc", status: "ok" });
});
app.get("/health", (req, res) => {
    res.status(200).json({ service: "gateway-svc", status: "ok" });
});

// ── fixRequestBody 래퍼 ──
const onProxyReq = (proxyReq, req, res) => {
    fixRequestBody(proxyReq, req, res);
};
 
// ── proxy 옵션 헬퍼 ──
const proxyOptions = (target) => ({
    target,
    changeOrigin: true,
    onProxyReq,
});

// ── Internal API ──
// user-svc internal
app.use("/internal/preferences", createProxyMiddleware(proxyOptions(process.env.USER_SVC_URL || "http://user-svc:8081")));
app.use("/internal/users", createProxyMiddleware(proxyOptions(process.env.USER_SVC_URL || "http://user-svc:8081")));
app.use("/internal/auth", createProxyMiddleware(proxyOptions(process.env.USER_SVC_URL || "http://user-svc:8081")));
 
// challenge-svc internal
app.use("/internal/challenges", createProxyMiddleware(proxyOptions(process.env.CHALLENGE_SVC_URL || "http://challenge-svc:8084")));
app.use("/internal/participations", createProxyMiddleware(proxyOptions(process.env.CHALLENGE_SVC_URL || "http://challenge-svc:8084")));
 
// community-svc internal
app.use("/internal/activities", createProxyMiddleware(proxyOptions(process.env.COMMUNITY_SVC_URL || "http://community-svc:8083")));
 
// recommendation-svc internal
app.use("/internal/recommend", createProxyMiddleware(proxyOptions(process.env.RECOMMENDATION_SVC_URL || "http://recommendation-svc:8085")));
 
// schedule-svc internal (나머지 전부 포함으로)
app.use("/internal", createProxyMiddleware(proxyOptions(process.env.SCHEDULE_SVC_URL || "http://schedule-svc:8082")));


// ── CSRF ──
const csrfProtection = csrf();
app.use(csrfProtection);
app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// ── Auth 라우터 (Gateway가 직접 처리) ──
app.use("/api/auth", require("./routes/authRouter"));

// ── 인증 미들웨어 (각 서비스로 라우팅) ──
const { isLoggedIn } = require("./middleware/auth");

const injectUser = (req, res, next) => {
    if (req.user) {
        req.headers["x-user-id"] = String(req.user.user_id);
        req.headers["x-user-type"] = req.user.type;
        req.headers["x-user-state"] = req.user.state_code;
    }
    next();
};

// Schedule
// /me/schedule 만 로그인 필요
app.use("/api/schoolSchedule/me", isLoggedIn, injectUser,
    createProxyMiddleware(proxyOptions(process.env.SCHEDULE_SVC_URL || "http://schedule-svc:8082")));
 
app.use("/api/schoolSchedule", injectUser,
    createProxyMiddleware(proxyOptions(process.env.SCHEDULE_SVC_URL || "http://schedule-svc:8082")));
 
app.use("/api/averageSchedule", injectUser,
    createProxyMiddleware(proxyOptions(process.env.SCHEDULE_SVC_URL || "http://schedule-svc:8082")));
 
app.use("/api/regions", injectUser,
    createProxyMiddleware(proxyOptions(process.env.SCHEDULE_SVC_URL || "http://schedule-svc:8082")));

// User
app.use("/api/mySchool", isLoggedIn, injectUser,
    createProxyMiddleware(proxyOptions(process.env.USER_SVC_URL || "http://user-svc:8081")));
 
app.use("/api/user", isLoggedIn, injectUser,
    createProxyMiddleware(proxyOptions(process.env.USER_SVC_URL || "http://user-svc:8081")));
 
app.use("/api/preferences", isLoggedIn, injectUser,
    createProxyMiddleware(proxyOptions(process.env.USER_SVC_URL || "http://user-svc:8081")));

app.use("/api/select", isLoggedIn, injectUser, 
    createProxyMiddleware(proxyOptions(process.env.USER_SVC_URL || "http://user-svc:8081")));

// User Admin
app.use("/api/admin/ban", isLoggedIn, injectUser,
    createProxyMiddleware(proxyOptions(process.env.USER_SVC_URL || "http://user-svc:8081")));

// Community
// 비로그인도 통과, 내부에서 권한 판단
app.use("/api/boards", injectUser,
    createProxyMiddleware(proxyOptions(process.env.COMMUNITY_SVC_URL || "http://community-svc:8083")));

// Challenge
app.use("/api/challenges", injectUser,
    createProxyMiddleware(proxyOptions(process.env.CHALLENGE_SVC_URL || "http://challenge-svc:8084")));
 
app.use("/api/reviews", isLoggedIn, injectUser,
    createProxyMiddleware(proxyOptions(process.env.CHALLENGE_SVC_URL || "http://challenge-svc:8084")));
 
app.use("/api/attachments", isLoggedIn, injectUser,
    createProxyMiddleware(proxyOptions(process.env.CHALLENGE_SVC_URL || "http://challenge-svc:8084")));
 
app.use("/api/attendances", isLoggedIn, injectUser,
    createProxyMiddleware(proxyOptions(process.env.CHALLENGE_SVC_URL || "http://challenge-svc:8084")));
 
app.use("/api/participations", isLoggedIn, injectUser,
    createProxyMiddleware(proxyOptions(process.env.CHALLENGE_SVC_URL || "http://challenge-svc:8084")));

app.use("/api/visions", injectUser,
    createProxyMiddleware(proxyOptions(process.env.CHALLENGE_SVC_URL || "http://challenge-svc:8084")));

app.use("/api/interests", injectUser,
    createProxyMiddleware(proxyOptions(process.env.CHALLENGE_SVC_URL || "http://challenge-svc:8084")));
    
app.use("/uploads", createProxyMiddleware(
    proxyOptions(process.env.CHALLENGE_SVC_URL || "http://challenge-svc:8084")));
 
// Challenge Admin
app.use("/api/admin/challenges", isLoggedIn, injectUser,
    createProxyMiddleware(proxyOptions(process.env.CHALLENGE_SVC_URL || "http://challenge-svc:8084")));

// Recommendation
// /recommendations/time은 공개
app.use("/api/recommendations/time", injectUser,
    createProxyMiddleware(proxyOptions(process.env.RECOMMENDATION_SVC_URL || "http://recommendation-svc:8085")));
 
app.use("/api/recommendations", isLoggedIn, injectUser,
    createProxyMiddleware(proxyOptions(process.env.RECOMMENDATION_SVC_URL || "http://recommendation-svc:8085")));

// AI
app.use("/api/ai", isLoggedIn, injectUser,
    createProxyMiddleware(proxyOptions(process.env.AI_SVC_URL || "http://ai-svc:8086")));

// ── 에러 핸들러 ──
app.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({ message: "Invalid CSRF token" });
    }
    next(err);
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
});

module.exports = { app, redisClient };