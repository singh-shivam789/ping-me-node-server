import { errorLogger } from "../utils/LoggerUtils.js";
import dotenv from 'dotenv';
dotenv.config();

class ChatController {
    #chatService
    #env
    constructor(chatService) {
        this.#chatService = chatService;
        this.#env = process.env.APP_ENV === "production"
    }

    getAllUserChats = async (req, res) => {
        try {
            const reqData = req.params;
            const response = await this.#chatService.getAllUserChats(reqData);
            return res.status(response.code).json(response);
        } catch (error) {
            errorLogger("error", error.stack);
            return res.status(500).json({
                error: "Error while fetching all user chats"
            });
        }
    }
}

export default ChatController;