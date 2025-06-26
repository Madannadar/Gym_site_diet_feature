import logger from "../utils/logger.js";

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;

    const details = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTimeMs: durationMs,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"] || "",
      headers: req.headers,
    };

    const isSuccess = res.statusCode < 400;

    logger.log({
      level: isSuccess ? "info" : "error",
      message: isSuccess
        ? `✅ [${req.method}] ${req.originalUrl} - ${res.statusCode} - ${durationMs}ms`
        : `❌ [${req.method}] ${req.originalUrl} - ${res.statusCode} - ${durationMs}ms`,
      ...details,
    });
  });

  next();
};

export default requestLogger;
