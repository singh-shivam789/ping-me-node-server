import { ObjectId } from 'mongodb';
import express from 'express';
import bcrypt from 'bcryptjs';
import dbClient from '../config/db_config.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'
import auth from '../auth/auth.js';
const usersRouter = express.Router();
const db = dbClient.db("test");
const usersCollection = db.collection("users");

usersRouter.get('/', auth, async (req, res) => {

    return res.status(200).json({
        "code": 200,
        "message": "testing"
    });
})

usersRouter.post('/', auth, async (req, res) => {
    try {
        let data = await usersCollection.find({ email: req.body.email }).toArray();
        return res.json({
            code: 200,
            message: "Successful",
            data: data
        });
    } catch (error) {
        console.log(error);
        return res.json({
            code: 404,
            message: "User not found!"
        });
    }
});

usersRouter.post('/create', auth, async (req, res) => {
    try {
        let userData = req.body;
        let data = await usersCollection.find({ "email": userData.email }).toArray();
        if (!data.length) {
            const salt = await bcrypt.genSalt();
            const hash = await bcrypt.hash(userData.password, salt);
            req.body.password = hash;
            await usersCollection.insertOne(req.body);
            return res.json({
                code: 200,
                message: "Successfully created user"
            });
        }
        else {
            return res.status(409).json({
                code: 409,
                message: "Email already in use!"
            });
        }
    } catch (error) {
        console.log(error);
        return res.json({
            code: 500,
            message: "Internal Sever Error"
        });
    }
});

usersRouter.post("/login", auth, async (req, res) => {
    try {
        let password = req.body.password;
        let email = req.body.email;
        //check if user exists
        let user = await usersCollection.find({ "email": email }).toArray();
        if (!user.length) {
            //user does not exist
            return res.json({
                code: 404,
                message: "No user found with this email."
            });
        }
        else {
            //get hash and compare with password
            let hashedPassword = user[0].password;
            let isTruePassword = await bcrypt.compare(password, hashedPassword);
            if (isTruePassword) {
                res.setHeader("testHeader", "hehe");
                return res.json({
                    code: 200,
                    message: "Password matched!"
                });
            }
            else {
                return res.json({
                    code: 200,
                    message: "Wrong Password"
                });
            }
        }
    } catch (error) {
        console.log(error);
        return res.json({
            code: 404,
            message: "User not found!"
        });
    }
});
export default usersRouter;