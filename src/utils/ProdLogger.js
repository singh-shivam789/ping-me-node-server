import Logger from "../config/Logger.js";

class ProdLogger extends Logger {
    static loggerInstance = null;
    loggerType = "file";
    constructor(){
        super("file");
        if(ProdLogger.loggerInstance){
            return ProdLogger.loggerInstance;
        }
        else{
            ProdLogger.loggerInstance = this;
        }
    }
}

export default ProdLogger;