const requiredEnv = ["MONGO_URI", "JWT_SECRET", "REFRESH_SECRET"];

function readEnv(name, defaultValue = undefined) {
    const value = process.env[name];
    if (value === undefined || value === "") {
        if (defaultValue !== undefined) return defaultValue;
        if (requiredEnv.includes(name)) {
            throw new Error(`Missing required environment variable: ${name}`);
        }
        return undefined;
    }
    return value;
}

const config = {
    nodeEnv: readEnv("NODE_ENV", "development"),
    port: Number(readEnv("PORT", 5000)),
    mongoUri: readEnv("MONGO_URI"),
    jwtSecret: readEnv("JWT_SECRET"),
    refreshSecret: readEnv("REFRESH_SECRET"),
    corsOrigin: readEnv("CORS_ORIGIN", "*"),
};

module.exports = config;


