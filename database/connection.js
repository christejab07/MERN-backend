import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import ENV from '../config.js';
async function connect(){
     const mongodb = await MongoMemoryServer.create();
     mongoose.set('strictQuery', false)
     const db = await mongoose.connect(ENV.ATLAS_URI)
     console.log("database connected");

     return db;
}
export default connect;