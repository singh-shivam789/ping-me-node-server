import express from 'express';
import { authorizer } from "../utils/middlewares/authorizer.js";
import { errorLogger } from "../utils/LoggerUtils.js";

const chatRouter = express.Router();

chatRouter.use()