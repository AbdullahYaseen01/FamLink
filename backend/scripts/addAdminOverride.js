import mongoose from "mongoose";
import AdminOverride from "../Schema/adminOverride.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGO_DB_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/famylink";

async function addOverride() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    // You can change or add to this list to whatever city you need.
    const citiesToActivate = [
      "Oakland", 
      "Piedmont", 
      "Berkeley", 
      "Alameda", 
      "Emeryville", 
      "Albany", 
      "San Leandro", 
      "Castro Valley"
    ];

    for (const city of citiesToActivate) {
      // Check if it already exists
      let override = await AdminOverride.findOne({ city: new RegExp(`^${city}$`, 'i') });
      
      if (!override) {
        override = new AdminOverride({
          city: city,
          state: "CA",
          isActive: true
        });
        await override.save();
        console.log(`✅ Successfully added Admin Override for: ${city}`);
      } else {
        if (!override.isActive) {
          override.isActive = true;
          await override.save();
          console.log(`✅ Reactivated Admin Override for: ${city}`);
        } else {
          console.log(`ℹ️ Admin Override already active for: ${city}`);
        }
      }
    }

    console.log("Finished updating Admin Overrides!");
    process.exit(0);
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
}

addOverride();
