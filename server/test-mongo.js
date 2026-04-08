const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://skills:krishna%409898@cluster0.ohrmha9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to server");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
