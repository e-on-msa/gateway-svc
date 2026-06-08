const { app, redisClient } = require("./app"); // app.js에서 export 필요
const PORT = process.env.PORT || 8080;

redisClient.connect()
    .then(() => {
        console.log("Redis connected");
        app.listen(PORT, () => {
            console.log(`Gateway server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Redis connection failed", err);
        process.exit(1);
    });