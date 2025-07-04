import dotenv from "dotenv";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import dbClient from "../config/db_config.js";
import isEmail from "validator/lib/isEmail.js";
import { defaultLogger, errorLogger } from "../utils/LoggerUtils.js";
import ChatService from "./ChatService.js";
dotenv.config();

const db = dbClient.db(process.env.DB_NAME || "test");

class UserService {
    #usersCollection
    #chatService
    constructor() {
        this.#usersCollection = db.collection("users");
        this.#chatService = new ChatService();
    }

    async getUsers() {
        try {
            const users = await this.#usersCollection.find({}, {
                projection: {
                    _id: 1, email: 1, username: 1, pfp: 1, status: 1
                }
            }).toArray();
            if (!users || !users.length) return {
                code: 404,
                message: "Not found!"
            }
            return {
                code: 200,
                message: "Successful",
                users: users
            };
        } catch (error) {
            errorLogger("error", "Error while fetching all users");
            throw new Error(error.stack);
        }
    }

    async getUserByIdentifier(queryParams) {
        try {
            if (queryParams.email) {
                if (!isEmail(queryParams.email)) return {
                    code: 400,
                    message: "Invalid email or username"
                }
                const user = await this.#usersCollection.findOne({ "email": queryParams.email });
                if (!user) {
                    return {
                        code: 404,
                        message: "User not found!"
                    };
                }
                return {
                    code: 200,
                    message: "Successful",
                    user: user
                };
            }
            else {
                const user = await this.#usersCollection.findOne({ "username": queryParams.username });
                if (!user) {
                    return {
                        code: 404,
                        message: "User not found!"
                    };
                }
                return {
                    code: 200,
                    message: "Successful",
                    user: user
                };
            }
        }
        catch (error) {
            errorLogger("error", "Error while fetching user by identifier");
            throw new Error(error.stack);
        }
    }

    async getUserById(id) {
        try {
            if (!ObjectId.isValid(id)) return {
                code: 400,
                message: "Bad Request"
            }
            const user = await this.#usersCollection.findOne({ "_id": new ObjectId(id) });
            if (!user) {
                return {
                    code: 404,
                    message: "User not found!"
                };
            }
            return {
                code: 200,
                message: "Successful",
                data: user
            };
        } catch (error) {
            errorLogger("error", "Error while fetching user by Id");
            throw new Error(error.stack);
        }
    }

    async createUser(userData) {
        try {
            if (!isEmail(userData.email)) {
                return {
                    code: 400,
                    message: "Invalid request"
                }
            }
            let user = await this.#usersCollection.findOne({ "email": userData.email });
            if (!user) {
                userData.password = await bcrypt.hash(userData.password, await bcrypt.genSalt());
                const response = await this.#usersCollection.insertOne({ ...userData });
                await this.#chatService.initializeSelfChat({ userId: response.insertedId });
                user = await this.#usersCollection.findOne({ "_id": response.insertedId });
                return {
                    code: 201,
                    message: "Successful",
                    newUser: user
                }
            }
            else return {
                code: 409,
                message: "An account already exists with this email"
            }
        } catch (error) {
            errorLogger("error", "Error while creating the user");
            throw new Error(error.stack);
        }
    }

    async signIn(userData) {
        try {
            const { email, password } = userData;
            if (isEmail(email)) {
                const user = await this.#usersCollection.findOne({ "email": email });
                if (!user) {
                    return {
                        code: 404,
                        message: "User not found!"
                    }
                }

                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid)
                    return {
                        code: 400,
                        message: "Wrong Password"
                    }
                else {
                    const iat = Math.floor(Date.now() / 1000);
                    const token = jwt.sign(
                        {
                            "sub": user._id,
                            "iat": iat,
                            "exp": iat + 3600,
                        },
                        process.env.JWT_SECRET
                    )
                    const friends = await this.#usersCollection.find(
                        { email: { $in: user.friends } },
                        { projection: { _id: 1, username: 1, email: 1, pfp: 1 } }).toArray();
                    return {
                        code: 200,
                        message: "Successful",
                        token: token,
                        user: user,
                        friends: friends
                    }
                }
            }
            else return {
                code: 400,
                message: "Invalid request"
            }
        } catch (error) {
            errorLogger("error", "Error while logging in");
            throw new Error(error.stack);
        }
    }

    async signOut(res) {
        try {
            res.clearCookie("token");
            return {
                code: 200,
                message: "Succesful"
            }
        } catch (error) {
            errorLogger("error", "Error while signing out");
            throw new Error(error.stack);
        }
    }

    async deleteUser(id, res) {
        try {
            const user = await this.#usersCollection.findOne({ "_id": new ObjectId(id) });
            if (!user) {
                return {
                    code: 404,
                    message: "Resource does not exist"
                }
            }
            await this.#chatService.deleteChats({ chats: user.chats });
            await this.#usersCollection.deleteOne({ "_id": new ObjectId(id) });
            res.clearCookie("token");
            return {
                code: 200,
                message: "Successful"
            }
        } catch (error) {
            errorLogger("error", "Error while deleting the user");
            throw new Error(error.stack);
        }
    }

    async sendFriendRequest(friendReqData) {
        try {
            const { id, friendEmail } = friendReqData;
            const friend = await this.#usersCollection.findOne({ "email": friendEmail });
            const user = await this.#usersCollection.findOne({ "_id": new ObjectId(id) });
            const userEmail = user.email;
            if (!friend) {
                return {
                    code: 404,
                    message: "Could not find a user with this email"
                }
            }
            const isAlreadyFriend = await this.#usersCollection.findOne(
                {
                    "_id": user._id,
                    "friends": friend.email
                },
                {
                    projection: { _id: 1 }
                }
            );

            if (!isAlreadyFriend) {
                await this.#usersCollection.updateOne({ "_id": new ObjectId(user._id) }, {
                    $addToSet: { "friendRequests.sent": friend.email }
                });

                await this.#usersCollection.updateOne({ "_id": new ObjectId(friend._id) }, {
                    $addToSet: { "friendRequests.received": user.email }
                })
            }
            const res = await this.#usersCollection.find({
                "email": {
                    $in: [userEmail, friendEmail]
                }
            }).toArray();

            const updatedUser = res.find(user => user.email === userEmail);
            const updatedFriend = res.find(user => user.email === friendEmail);

            return {
                code: 201,
                message: "Successful",
                user: updatedUser,
                updatedFriend: updatedFriend
            }

        } catch (error) {
            errorLogger("error", "Error while sending friend request");
            throw new Error(error.stack);
        }
    }

    async updateFriendRequestStatus(reqData) {
        try {
            const id = reqData.id;
            const friendEmail = reqData.friendEmail;
            const friendRequestDecision = reqData.friendRequestDecision;
            const friend = await this.#usersCollection.findOne({ "email": friendEmail });
            const user = await this.#usersCollection.findOne({ "_id": new ObjectId(id) });
            const userEmail = user.email;
            let initiatedChat = null;

            if (!friend) {
                return {
                    code: 404,
                    message: "Could not find a user with this email"
                }
            }

            if (friendRequestDecision === "reject") {
                await this.#usersCollection.updateOne({ "_id": new ObjectId(user._id) }, {
                    $pull: {
                        "friendRequests.received": friend.email
                    }
                });
                await this.#usersCollection.updateOne({ "_id": new ObjectId(friend._id) }, {
                    $pull: {
                        "friendRequests.sent": user.email
                    }
                });
            }
            else {
                const isAlreadyFriend = await this.#usersCollection.findOne(
                    {
                        "_id": user._id,
                        "friends": friend.email
                    },
                    {
                        projection: { _id: 1 }
                    }
                )
                if (!isAlreadyFriend) {
                    initiatedChat = await this.#chatService.initializeChat({
                        toUser: user._id,
                        fromUser: friend._id
                    });
                    await this.#usersCollection.updateOne({ "_id": new ObjectId(user._id) }, {
                        $pull: {
                            "friendRequests.received": friend.email
                        },
                        $addToSet: {
                            "friends": friend.email,
                            "chats": initiatedChat.data._id
                        }
                    });

                    await this.#usersCollection.updateOne({ "_id": new ObjectId(friend._id) }, {
                        $pull: {
                            "friendRequests.sent": user.email
                        },
                        $addToSet: {
                            "friends": user.email,
                            "chats": initiatedChat.data._id
                        }
                    });
                }
                else {
                    defaultLogger("warn", "Already a friend");
                }
            }

            const res = await this.#usersCollection.find({
                "email": {
                    $in: [userEmail, friendEmail]
                }
            }).toArray();
            const updatedUser = res.find(user => user.email === userEmail);
            const updatedFriend = res.find(user => user.email === friendEmail);
            return initiatedChat == null ? {
                code: 201,
                message: "Successful",
                user: updatedUser,
                friend: updatedFriend
            } : {
                code: 201,
                message: "Successful",
                user: updatedUser,
                friend: updatedFriend,
                initiatedChat: initiatedChat.data
            }
        } catch (error) {
            errorLogger("error", "Error while updating friend request status");
            throw new Error(error.stack);
        }
    }

    async getUsersByEmail(reqData) {
        try {
            let emails = reqData.emails;
            const users = await this.#usersCollection.find({
                "email": { $in: emails }
            }).toArray();
            return {
                code: 200,
                message: "Successful",
                users: users
            }
        } catch (error) {
            errorLogger("error", "Error while fetching users by email");
            throw new Error(error.stack);
        }
    }

    async removeFriend(reqData) {
        try {
            const friendEmail = reqData.friendEmail;
            const userEmail = reqData.email;
            const commonChat = await this.#chatService.getChatByUserEmail({ email: userEmail });
            await this.#chatService.deleteChat({ _id: commonChat.data._id });
            await this.#usersCollection.updateOne({ "email": userEmail },
                {
                    $pull: {
                        "friends": friendEmail,
                        "chats": commonChat.data._id
                    }
                });
            await this.#usersCollection.updateOne({ "email": friendEmail },
                {
                    $pull: {
                        "friends": userEmail,
                        "chats": commonChat.data._id
                    }
                });
            const res = await this.#usersCollection.find({
                "email": {
                    $in: [userEmail, friendEmail]
                }
            }).toArray();
            return {
                code: 200,
                updatedUser: res.find(user => user.email === userEmail),
                updatedFriend: res.find(user => user.email === friendEmail)
            }
        } catch (error) {
            errorLogger("error", "Error while removing friend");
            throw new Error(error.stack);
        }
    }

    async sendMessage(reqData) {
        try {
            //TODO: Handle image as messages & self chat messages 
            const chatId = reqData.chatId;
            const message = reqData.message;
            const isSelfChat = reqData.isSelfChat;
            const response = await this.#chatService.addMessageToChat(message, chatId, isSelfChat);
            return {
                code: 201,
                updatedChat: response
            }
        } catch (error) {
            errorLogger("error", "Error while sending message");
            throw new Error(error.stack);
        }
    }
}

export default UserService;