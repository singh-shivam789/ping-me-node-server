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
            let users = await this.#usersCollection.find({}).toArray();
            if (!users || !users.length) return {
                code: 404,
                message: "Not found!"
            }
            return {
                code: 200,
                message: "Successful",
                data: users
            };
        } catch (error) {
            errorLogger("error", "Error while fetching all users");
            throw new Error(error.stack);
        }
    }

    async getUserByIdentifier(identifier) {
        try {
            if (isEmail(identifier)) {
                const user = await this.#usersCollection.findOne({ "email": identifier });
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
                const user = await this.#usersCollection.findOne({ "username": identifier });
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
            let user = await this.#usersCollection.findOne({ "email": userData.email });
            if (!user) {
                userData.password = await bcrypt.hash(userData.password, await bcrypt.genSalt());
                user = await this.#usersCollection.insertOne({ ...userData });
                return {
                    code: 201,
                    message: "Successful",
                    data: user
                }
            }
            return {
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
            const user = await this.#usersCollection.findOne({ "email": email });
            if (!user) {
                return {
                    code: 404,
                    message: "User not found!"
                }
            }

            let isPasswordValid = await bcrypt.compare(password, user.password);
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
                    token: token
                }
            }

        } catch (error) {
            errorLogger("error", "Error while logging in");
            throw new Error(error.stack);
        }
    }

    async signOut(res){
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

    async deleteUser(id, req) {
        try {
            let user = await this.#usersCollection.findOne({ "_id": new ObjectId(id) });
            if (!user) {
                return {
                    code: 404,
                    message: "Resource does not exist"
                }
            }
            let response = await this.#usersCollection.deleteOne({ "_id": new ObjectId(id) });
            return {
                code: 200,
                message: "Successful",
                data: response
            }
        } catch (error) {
            errorLogger("error", "Error while deleting the user");
            throw new Error(error.stack);
        }
    }
}

export default UserService;