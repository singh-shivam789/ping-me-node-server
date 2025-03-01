
import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv'
dotenv.config();
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@dev-mongo-cluster-1.fc5mj.mongodb.net/?retryWrites=true&w=majority&appName=dev-mongo-cluster-1?directConnection=true`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

try {
    client.connect().then(() => {
        console.log("Connected to Mongo");
    }).catch(err => {
        throw err;
    }).finally(
        await client.close()
    )
} catch (error) {
    console.log(error);
}

export default client;