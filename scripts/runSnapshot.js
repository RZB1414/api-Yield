import mongoose from "mongoose";
import dotenv from "dotenv";
import { runDailySnapshot } from "../src/jobs/dailySnapshotJob.js";

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }
  try {
    console.log("[CLI] Connecting to Mongo...");
    await mongoose.connect(uri);
    console.log("[CLI] Running daily snapshot at", new Date().toISOString());
    await runDailySnapshot();
  } catch (e) {
    console.error("[CLI] Error:", e);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("[CLI] Connection closed.");
  }
}

main();
