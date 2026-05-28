require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const csrf = require("csurf");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const { createProxyMiddleware } = require("http-proxy-middleware");
const RedisStore = require("connect-redis").default;
const Redis = require("ioredis");

require("./config/passport")(passport);

const app = express();

// ── Redis 클라이언트 설정 ──
const redisClient = new Redis({
    host: process.env.REDIS_HOST || "redis",
    port: parseInt(process.env.REDIS_PORT) || 6379,
});

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

// ── CSRF ──
const csrfProtection = csrf();
app.use(csrfProtection);
app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// ── Auth 라우터 (Gateway가 직접 처리) ──
app.use("/auth", require("./routes/authRouter"));

// ── 프록시 미들웨어 (각 서비스로 라우팅) ──
const { isLoggedIn } = require("./middleware/auth");

const injectUser = (req, res, next) => {
    if (req.user) {
        req.headers["x-user-id"] = req.user.user_id;
        req.headers["x-user-type"] = req.user.type;
    }
    next();
};

app.use("/schoolSchedule", isLoggedIn, injectUser,
    createProxyMiddleware({ target: process.env.SCHEDULE_SVC_URL || "http://schedule-svc:8082", changeOrigin: true }));

app.use("/averageSchedule", isLoggedIn, injectUser,
    createProxyMiddleware({ target: process.env.SCHEDULE_SVC_URL || "http://schedule-svc:8082", changeOrigin: true }));

app.use("/regions", isLoggedIn, injectUser,
    createProxyMiddleware({ target: process.env.SCHEDULE_SVC_URL || "http://schedule-svc:8082", changeOrigin: true }));

app.use("/mySchool", isLoggedIn, injectUser,
    createProxyMiddleware({ target: process.env.SCHEDULE_SVC_URL || "http://schedule-svc:8082", changeOrigin: true }));

app.use("/api/user", isLoggedIn, injectUser,
    createProxyMiddleware({ target: process.env.USER_SVC_URL || "http://user-svc:8081", changeOrigin: true }));

app.use("/boards", isLoggedIn, injectUser,
    createProxyMiddleware({ target: process.env.COMMUNITY_SVC_URL || "http://community-svc:8083", changeOrigin: true }));

app.use("/api/challenges", isLoggedIn, injectUser,
    createProxyMiddleware({ target: process.env.CHALLENGE_SVC_URL || "http://challenge-svc:8084", changeOrigin: true }));

app.use("/api/recommendations", isLoggedIn, injectUser,
    createProxyMiddleware({ target: process.env.RECOMMENDATION_SVC_URL || "http://recommendation-svc:8085", changeOrigin: true }));

app.use("/api/ai", isLoggedIn, injectUser,
    createProxyMiddleware({ target: process.env.AI_SVC_URL || "http://ai-svc:8086", changeOrigin: true }));

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

module.exports = app;