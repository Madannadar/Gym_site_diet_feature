// import winston from "winston";
// import dotenv from "dotenv";

// dotenv.config();

// // 🧾 JSON + timestamp log format for Promtail
// const jsonFormat = winston.format.combine(
//   winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
//   winston.format.errors({ stack: true }),
//   winston.format.json()
// );

// // 🛠 Winston Logger (File + Console)
// const logger = winston.createLogger({
//   level: "info",
//   format: jsonFormat,
//   transports: [
//     new winston.transports.File({ filename: "logs/app.log" }), // 👈 Used by Promtail
//     new winston.transports.Console({
//       format: winston.format.combine(
//         winston.format.colorize(),
//         winston.format.printf(
//           ({ timestamp, level, message, stack, ...meta }) => {
//             const metaString = Object.keys(meta).length
//               ? ` | meta: ${JSON.stringify(meta, null, 2)}`
//               : "";
//             return `${timestamp} [${level}] : ${stack || message}${metaString}`;
//           }
//         )
//       ),
//     }),
//   ],
// });

// // 🌐 Express Middleware to log requests
// const loggerMiddleware = (req, res, next) => {
//   const start = Date.now();

//   res.on("finish", () => {
//     const durationMs = Date.now() - start;

//     const details = {
//       method: req.method,
//       url: req.originalUrl,
//       statusCode: res.statusCode,
//       responseTimeMs: durationMs,
//       ip: req.ip || req.connection.remoteAddress,
//       userAgent: req.headers["user-agent"] || "",
//       headers: req.headers,
//     };

//     if (res.statusCode >= 500) {
//       logger.error("❌ Server Error", details);
//     } else if (res.statusCode >= 400) {
//       logger.warn("⚠ Client Error", details);
//     } else {
//       logger.info("✅ Request Success", details);
//     }
//   });

//   next();
// };

// // 📦 Manual Error Logging Helper
// const logError = (error, meta = {}) => {
//   logger.error(error.stack || error.message || error, meta);
// };

// export { logger, loggerMiddleware, logError };