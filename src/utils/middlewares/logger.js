import { getLogLevelFromStatusCode } from "../LoggerUtils.js";
import ConsoleLogger from "../ConsoleLogger.js";
import { errorLogger } from "../LoggerUtils.js";
import FileLogger from "../FileLogger.js";
import dotenv from "dotenv"
dotenv.config();
const appEnv = process.env.APP_ENV;
const logger = appEnv === "development" ? new ConsoleLogger() : new FileLogger();

export function requestLogger(getLogInput, level) {
    return function (req, res, next) {
        try {
            const logInput = getLogInput(req, res);
            logger.log(level, logInput);
        } catch (error) {
            errorLogger("error", error.message);
        }
        next();
    };
}

export function responseLogger(getLogInput, level){
    return function(req, res, next){
        try {
            res.on("finish", () => {
                const level = getLogLevelFromStatusCode(res.statusCode);
                const logInput = getLogInput(req, res);
                logger.log(level, logInput);
            });
        } catch (error) {
            errorLogger("error", error.message);
        }
        next();
    }
}