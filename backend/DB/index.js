import mongoose from "mongoose";
import "dotenv/config";

mongoose
  .connect(process.env.MONGO_DB_URI, {
    serverSelectionTimeoutMS: 20000,
  })
  .then(() => console.log("DB Connected"))
  .catch((err) => {
    // Do not crash the process — nodemon + intermittent Atlas/DNS would take
    // the whole API down. Retry once after a short delay.
    console.error("Initial Mongo connect failed:", err?.message || err);
    setTimeout(() => {
      mongoose
        .connect(process.env.MONGO_DB_URI, {
          serverSelectionTimeoutMS: 20000,
        })
        .then(() => console.log("DB Connected (retry)"))
        .catch((e) =>
          console.error("Mongo retry failed:", e?.message || e)
        );
    }, 3000);
  });

export default mongoose;
