const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const indexes = await db.collection("fixtures").indexInformation({full: true});
  console.log(JSON.stringify(indexes, null, 2));
  process.exit(0);
}

run().catch(console.error);
