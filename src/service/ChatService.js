import { errorLogger } from "../utils/LoggerUtils.js";
import dbClient from "../config/db_config.js";
import { ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const db = dbClient.db(process.env.DB_NAME || "test");

class ChatService {
    #chatsCollection
    #userCollection
    constructor() {
        this.#chatsCollection = db.collection("chats");
        this.#userCollection = db.collection("users");
    }

    async addMessageToChat(message, chatId, isSelfChat) {
        try {
            await this.#chatsCollection.updateOne({ _id: new ObjectId(chatId) }, {
                $set: { lastMessage: message, read: isSelfChat },
                $push: { messages: message }
            })
            const chat = await this.#chatsCollection.findOne({_id: new ObjectId(chatId)});
            return chat;
        } catch (error) {
            errorLogger("error", "Error while adding message to chat");
            throw new Error(error.stack);
        }
    }

    async getAllUserChats(reqData) {
        try {
            const userId = reqData.userId;
            const selfChat = await this.#chatsCollection.find({
                "participants": {
                    $in: [new ObjectId(userId)],
                    $size: 1
                }
            }).toArray();
            const chats = await this.#chatsCollection.find({
                "participants": {
                    $in: [new ObjectId(userId)],
                    $size: 2
                }
            }).toArray();
            return {
                code: 200,
                chats: [selfChat[0], ...chats]
            }
        } catch (error) {
            errorLogger("error", "Error while getting user chats");
            throw new Error(error.stack);
        }
    }

    async initializeSelfChat(reqData) {
        try {
            const userId = reqData.userId;
            const chatData = {
                participants: [userId],
                lastMessage: null,
                messages: [],
                read: true,
                isSelfChat: true
            }
            await this.#chatsCollection.insertOne(chatData);
            return {
                code: 201,
                message: "Successful"
            }
        } catch (error) {
            errorLogger("error", error.message);
            throw new Error(error.stack);
        }
    }

    async initializeChat(reqData) {
        try {
            const toUserId = reqData.toUser;
            const fromUserId = reqData.fromUser;
            const chatData = {
                participants: [toUserId, fromUserId],
                lastMessage: null,
                messages: [],
                read: false,
                isSelfChat: false
            }
            const doesChatAlreadyExist = await this.#chatsCollection.findOne({
                "participants": {
                    $all: [toUserId, fromUserId],
                    $size: 2
                }
            });
            if (!doesChatAlreadyExist) {
                let response = await this.#chatsCollection.insertOne(chatData);
                response = await this.#chatsCollection.findOne({ "_id": response.insertedId })
                return {
                    code: 201,
                    data: response
                }
            }
            else {
                return {
                    code: 200,
                    data: doesChatAlreadyExist
                }
            }
        }
        catch (error) {
            errorLogger("error", error.stack);
            throw new Error(error.stack);
        }
    }

    async getChatById(reqData) {
        try {
            const id = reqData.id;
            const response = await this.#chatsCollection.findOne({ "_id": id });
            return {
                code: 200,
                data: response
            }
        } catch (error) {
            errorLogger("error", error.stack);
            throw new Error(error.stack);
        }
    }

    async getChatByUserEmail(reqData) {
        try {
            const userEmail = reqData.email;
            const user = await this.#userCollection.findOne({ "email": userEmail }, {
                projection: {
                    _id: 1
                }
            })
            const response = await this.#chatsCollection.findOne({
                "participants": user._id
            });
            return {
                code: 200,
                data: response
            }
        } catch (error) {
            errorLogger("error", error.stack);
            throw new Error(error.stack);
        }
    }

    async deleteChat(reqData) {
        try {
            const chatId = reqData._id;
            const response = await this.#chatsCollection.deleteOne({ _id: chatId });
            return {
                code: 201,
                data: response
            }
        }
        catch (error) {
            errorLogger("error", error.stack);
            throw new Error(error.stack);
        }
    }

    async deleteChats(reqData) {
        try {
            const chatIds = reqData.chats;
            const response = await this.#chatsCollection.deleteMany({
                "_id": {
                    $in: chatIds
                }
            });
            return {
                code: 201,
                response: response
            }
        } catch (error) {
            errorLogger("error", error.stack);
            throw new Error(error.stack);
        }
    }
}

export default ChatService;