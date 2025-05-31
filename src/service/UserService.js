import dotenv from "dotenv";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import dbClient from "../config/db_config.js";
import isEmail from "validator/lib/isEmail.js";
import { errorLogger } from "../utils/LoggerUtils.js";
dotenv.config();

const db = dbClient.db(process.env.DB_NAME || "test");

class UserService {
    #usersCollection
    constructor() {
        this.#usersCollection = db.collection("users");
    }

    async getUsers() {
        try {
            const users = await this.#usersCollection.find({}).toArray();
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
                await this.#usersCollection.insertOne({ ...userData });
                user = await this.#usersCollection.findOne({ "email": userData.email });
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
                        { projection: {_id: 1, username: 1, email: 1, pfp: 1 } }).toArray();
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
            if (!friend) {
                return {
                    code: 404,
                    message: "Could not find a user with this email"
                }
            }

            await this.#usersCollection.updateOne({ "_id": new ObjectId(user._id) }, {
                $addToSet: { "friendRequests.sent": friend.email }
            });

            await this.#usersCollection.updateOne({ "_id": new ObjectId(friend._id) }, {
                $addToSet: { "friendRequests.received": user.email }
            })

            const updatedUser = await this.#usersCollection.findOne({ "_id": new ObjectId(user._id) });
            const updatedFriend = await this.#usersCollection.findOne({ "_id": new ObjectId(friend._id) });

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
                await this.#usersCollection.updateOne({ "_id": new ObjectId(user._id) }, {
                    $pull: {
                        "friendRequests.received": friend.email
                    },
                    $addToSet: {
                        "friends": friend.email
                    }
                });

                await this.#usersCollection.updateOne({ "_id": new ObjectId(friend._id) }, {
                    $pull: {
                        "friendRequests.sent": user.email
                    },
                    $addToSet: {
                        "friends": user.email
                    }
                });
            }

            const updatedUser = await this.#usersCollection.findOne({ "_id": new ObjectId(user._id) });
            const updatedFriend = await this.#usersCollection.findOne({ "_id": new ObjectId(friend._id) });

            return {
                code: 201,
                message: "Successful",
                user: updatedUser,
                friend: updatedFriend
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
}

export default UserService;