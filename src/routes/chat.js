import { authorizer } from "../utils/middlewares/authorizer.js";
import ChatController from "../controller/ChatController.js";
import { errorLogger } from "../utils/LoggerUtils.js";
import ChatService from "../service/ChatService.js";
import express from 'express';

const chatService = new ChatService();
const chatController = new ChatController(chatService);
const chatRouter = express.Router();
try {
    chatRouter.get("/:userId", authorizer, chatController.getAllUserChats)
} catch (error) {
     errorLogger("error", error.stack);
}

export default chatRouter;