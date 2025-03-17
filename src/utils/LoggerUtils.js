import ConsoleLogger from "./ConsoleLogger.js";
import FileLogger from "./FileLogger.js";
import dotenv from "dotenv"
dotenv.config();
const appEnv = process.env.APP_ENV;
const logger = appEnv === "development" ? new ConsoleLogger() : new FileLogger();

export function getRequestLogInput(req, res) {
  const timestamp = new Date().toLocaleDateString();
  return `[${timestamp}] - [REQUEST] - ${req.method} ${req.originalUrl}`;
}

export function getResponseLogInput(req, res) {
  const timestamp = new Date().toLocaleDateString();
  return `[${timestamp}] - [RESPONSE] - ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`;
}

export function errorLogger(level, error) {
  logger.log(level, error);
}

export function defaultLogger(level, message) {
  logger.log(level, message);
}

export function getLogLevelFromStatusCode(statusCode) {
  const firstDigit = Math.floor(statusCode / 100);
  let level;
  switch (firstDigit) {
    case 1:
      level = "debug";
      break;
    case 2:
      level = "info";
      break;
    case 3:
      level = "info";
      break;
    case 4:
      level = "warn";
      break;
    case 5:
      level = "error";
      break;
    default:
      level = "info";
  }

  return level;
} 