const axios = require('axios');

const USER_SVC_URL = process.env.USER_SVC_URL || 'http://user-svc:8081';

exports.signupStep1 = async (req, res, next) => {
    try {
        const response = await axios.post(`${USER_SVC_URL}/internal/auth/join/step1`, req.body);
        res.status(response.status).json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        next(err);
    }
};

exports.signupStep2 = async (req, res, next) => {
    try {
        const response = await axios.post(`${USER_SVC_URL}/internal/auth/join/step2`, req.body);
        res.status(response.status).json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        next(err);
    }
};

exports.sendEmailCode = async (req, res, next) => {
    try {
        const response = await axios.post(`${USER_SVC_URL}/internal/auth/join/email`, req.body);
        res.status(response.status).json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        next(err);
    }
};

exports.verifyEmailCode = async (req, res, next) => {
    try {
        const response = await axios.post(`${USER_SVC_URL}/internal/auth/verify-email`, req.body);
        res.status(response.status).json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        next(err);
    }
};

exports.signupStep3 = async (req, res, next) => {
    try {
        const response = await axios.post(`${USER_SVC_URL}/internal/auth/join/step3`, req.body);
        res.status(response.status).json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        next(err);
    }
};

exports.findEmailsByNameAndAge = async (req, res, next) => {
    try {
        const response = await axios.post(`${USER_SVC_URL}/internal/auth/find-id`, req.body);
        res.status(response.status).json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        next(err);
    }
};

exports.sendFindIdCodeToEmail = async (req, res, next) => {
    try {
        const response = await axios.post(`${USER_SVC_URL}/internal/auth/find-id/send-code-to-email`, req.body);
        res.status(response.status).json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        next(err);
    }
};

exports.verifyFindIdCode = async (req, res, next) => {
    try {
        const response = await axios.post(`${USER_SVC_URL}/internal/auth/find-id/verify-code`, req.body);
        res.status(response.status).json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        next(err);
    }
};

exports.sendFindPwCodeToEmail = async (req, res, next) => {
    try {
        const response = await axios.post(`${USER_SVC_URL}/internal/auth/find-password/send-code-to-email`, req.body);
        res.status(response.status).json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        next(err);
    }
};

exports.verifyFindPwCode = async (req, res, next) => {
    try {
        const response = await axios.post(`${USER_SVC_URL}/internal/auth/find-password/verify-code`, req.body);
        res.status(response.status).json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        next(err);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const response = await axios.patch(`${USER_SVC_URL}/internal/auth/find-password/reset`, req.body);
        res.status(response.status).json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        next(err);
    }
};

exports.login = (req, res, next) => {
    const passport = require('passport');
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info?.message || '로그인 실패' });
        req.logIn(user, (err) => {
            if (err) return next(err);
            // 새 CSRF 토큰 응답에 포함
            res.json({ 
                success: true, 
                user,
                csrfToken: req.csrfToken()  // 새 토큰 발급
            });
        });
    })(req, res, next);
};

exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy();
        res.json({ success: true });
    });
};
