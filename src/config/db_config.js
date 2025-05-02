
import { MongoClient, ServerApiVersion } from "mongodb";
import { defaultLogger, errorLogger } from "../utils/LoggerUtils.js";
import dotenv from "dotenv"
dotenv.config();
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@dev-mongo-cluster-1.fc5mj.mongodb.net/?retryWrites=true&w=majority&appName=dev-mongo-cluster-1?directConnection=true`;
let client;
try {
    client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
    client.connect().then(async () => {
        defaultLogger("info", "Successfully established connection to Mongo Client");
        const db = client.db(process.env.DB_NAME || "test");
        await ensureIndexes(db);
    }).catch(err => {
        throw err;
    }).finally(
        await client.close()
    )
} catch (error) {
    errorLogger("error", error.stack);
}

export async function ensureIndexes(db) {
    try {
        defaultLogger("info", "Setting up indexes");
        const usersCollection = db.collection("users");
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        await usersCollection.createIndex({ "friendRequests.sent": 1 });
        await usersCollection.createIndex({ "friendRequests.received": 1 });
        await usersCollection.createIndex({ username: 1 }, { unique: false });
    } catch (error) {
        errorLogger("error", error.stack);
    }
}

export default client;