// import winston from "winston";
// import LokiTransport from "winston-loki";

// // Create the logger with proper configuration
// const logger = winston.createLogger({
//   level: "info",
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.errors({ stack: true }),
//     winston.format.json()
//   ),
//   transports: [
//     new LokiTransport({
//       host: "http://127.0.0.1:3100",
//       labels: { appName: "gym_site_backend" },
//       json: true,
//       format: winston.format.json(),
//       replaceTimestamp: true,
//       onConnectionError: (err) => console.error("Loki connection error:", err)
//     }),

//     // Optional: also log to local file for backup
//     new winston.transports.File({ 
//       filename: "logs/app.log",
//       format: winston.format.combine(
//         winston.format.timestamp(),
//         winston.format.json()
//       )
//     }),

//     // Optional: also log to console during development
//     new winston.transports.Console({
//       format: winston.format.combine(
//         winston.format.colorize(),
//         winston.format.simple()
//       )
//     })
//   ]
// });

// export default logger;


import winston from "winston";
import LokiTransport from "winston-loki";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new LokiTransport({
      host: "http://127.0.0.1:3100",
      labels: { appName: "gym_site_backend" },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => console.error("Loki connection error:", err),
    }),

    new winston.transports.File({
      filename: "logs/app.log",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),

    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export default logger;
