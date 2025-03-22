import Logger from "../config/Logger.js";

class DevLogger extends Logger {
    static loggerInstance = null;
    loggerType = "console";
    constructor(){
        super("console");
        if(DevLogger.loggerInstance){
            return DevLogger.loggerInstance;
        }
        else{
            DevLogger.loggerInstance = this;
        }
    }
}

export default DevLogger;