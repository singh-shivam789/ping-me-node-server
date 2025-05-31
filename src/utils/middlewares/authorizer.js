import { errorLogger } from "../LoggerUtils.js";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
export function authorizer(req, res, next) {
    try {
        jsonwebtoken.verify(req.cookies.token, JWT_SECRET);
        next();
    } catch (error) {
        errorLogger("error", error.stack);
        return res.status(401).json({
            code: 401, 
            message: "Session expired or invalid token, please sign in again",
            "isUserValidated": false
        });
    }
}