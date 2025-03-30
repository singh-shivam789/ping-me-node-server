import { deleteFile, getFileStats, readDir, readFile, ensureDirExists, moveFile, closeDir } from "../utils/LogFilesValidatorUtils.js";
import { errorLogger } from "../utils/LoggerUtils.js";
import path from "path";

export const logFilesValidator = async () => {
    try {
        const dirPath = path.join(import.meta.dirname,"..", "logs");
        const transDirPath = path.join(import.meta.dirname,"..", "logs", "transmitted");
        
        await ensureDirExists(dirPath);
        await ensureDirExists(transDirPath);
        
        const dir = await readDir(dirPath);
        let logEntry = await readFile(dir);

        while (logEntry != null) {
            if (logEntry.isDirectory()) logEntry = await readFile(dir);
            else {
                const currFilePath = path.join(dirPath, logEntry.name);
                const transmittedFilePath = path.join(transDirPath, logEntry.name);
                const currFile = await getFileStats(currFilePath);
                const currFileSize = currFile.size;
                const currFileCreationTime = currFile.birthtime;
                const currDateTime = new Date(Date.now());
                const ageInDays = Math.ceil((currDateTime - currFileCreationTime) / (1000 * 60 * 60 * 24));

                if (currFileSize == 0){
                    await deleteFile(currFilePath);
                } 
                else if (ageInDays >= 7 || currFileSize >= 1024 * 1024 * 5){
                    await moveFile(currFilePath, transmittedFilePath);
                }

                logEntry = await readFile(dir);
            }
        }

        await closeDir(dir);
    } catch (error) {
        errorLogger("error", error.stack);
    }
}

export const transmittedLogFilesValidator = async () => {
    try {
        const dirPath = path.join(import.meta.dirname,"..", "logs", "transmitted");
        await ensureDirExists(dirPath);
        
        const dir = await readDir(dirPath)
        let logEntry = await readFile(dir);
        while (logEntry != null) {
            const currFilePath = path.join(dirPath, logEntry.name);
            const currFile = await getFileStats(currFilePath);
            const currFileCreationTime = currFile.birthtime;
            const currDateTime = new Date(Date.now());
            const ageInDays = Math.floor((currDateTime - currFileCreationTime) / (1000 * 60 * 60 * 24));
            
            if(ageInDays >= 0){
                await deleteFile(currFilePath);
            }

            logEntry = await readFile(dir);
        }

        await closeDir(dir);
    } catch (error) {
        errorLogger("error", error.stack);
    }
}
