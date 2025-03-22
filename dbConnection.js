

// dbConnect();
require('dotenv').config();
const { mongoose } = require("mongoose");

const dbConnect = async () => {
    const username = encodeURIComponent(process.env.MONGO_USERNAME);
    const password = encodeURIComponent(process.env.MONGO_PASSWORD);
    const host = process.env.MONGO_HOST;
    const dbName = process.env.MONGO_DB_NAME;
    const options = process.env.MONGO_OPTIONS;

    const uri = `mongodb+srv://${username}:${password}@${host}/${dbName}?${options}`;

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
        });

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("Database connection error:", error);
    }
};

dbConnect();
