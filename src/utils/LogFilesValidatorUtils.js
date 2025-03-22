import fs from "fs-extra";
import { defaultLogger, errorLogger } from "../utils/LoggerUtils.js";

export const readFile = async (dir) => {
    try {
        const r_dir = await dir.read();
        if (r_dir && !r_dir.isDirectory()) defaultLogger("info", `Reading file: ${r_dir.name}`);
        return r_dir;
    } catch (error) {
        errorLogger("error", "Error while reading the file");
        throw new Error(error.stack);
    }
}

export const readDir = async (dirPath) => {
    try {
        defaultLogger("info", `Reading directory: ${dirPath}`);
        return await fs.opendir(dirPath);
    } catch (error) {
        errorLogger("error", "Error while reading the directory");
        throw new Error(error.stack);
    }
}

export const getFileStats = async (filePath) => {
    try {
        defaultLogger("info", `Reading file stats: ${filePath}`)
        return await fs.stat(filePath);
    } catch (error) {
        errorLogger("error", "Error while getting the file stats");
        throw new Error(error.stack);
    }
}

export const deleteFile = async (filePath) => {
    try {
        defaultLogger("info", `Deleting logfile: ${filePath}`)
        await fs.remove(filePath);
        defaultLogger("info", `Successfully deleted logfile: ${filePath}`);
    } catch (error) {
        errorLogger("error", "Error while deleting the file");
        throw new Error(error.stack);
    }
}

export const ensureDirExists = async (dirPath) => {
    try {
        defaultLogger("info", `Making sure the path: ${dirPath} exists. It will be created if not present`);
        await fs.ensureDir(dirPath);
    } catch (error) {
        errorLogger("error", `Error while checking the directory: ${dirPath}`);
        throw new Error(error.stack);
    }
}

export const moveFile = async (srcPath, destPath) => {
    try {
        defaultLogger("info", `Moving file from ${srcPath} to ${destPath}`);
        await fs.move(srcPath, destPath, { overwrite: true })
        defaultLogger("info", `Successfully moved file from ${srcPath} to ${destPath}`);
    } catch (error) {
        errorLogger("error", "Error while moving the file");
        throw new Error(error.stack);
    }
}

export const closeDir = async (dir) => {
    try {
        await dir.close();
    } catch (error) {
        errorLogger("error", "Error while closing the directory");
        throw new Error(error.stack);
    }
}

