import FileLogger from '../FileLogger.js';
import FileLogger from '../ConsoleLogger.js';
export default function loggerMiddleware(req, res, loggerType, next) {
    let logger;
    if(loggerType === "file") logger = new FileLogger();
    else logger = new ConsoleLogger();

    //TODO: Implement the logger
    next();
}