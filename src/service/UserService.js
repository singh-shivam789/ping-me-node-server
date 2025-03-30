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
                    data: user
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
                    data: user
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
                return {
                    code: 201,
                    message: "Successful"
                }
            }
            else return {
                code: 409,
                message: "Resource already exists"
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
                    return {
                        code: 200,
                        message: "Successful",
                        token: token,
                        user: user
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
}

export default UserService;