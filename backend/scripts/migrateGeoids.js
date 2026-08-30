import mongoose from "mongoose";
import User from "../Schema/user.js";
import fetch from "node-fetch";

// The Census API URL for coordinate to geography translation
const CENSUS_API_BASE = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getGeoidForCoordinates(lng, lat) {
  try {
    const url = `${CENSUS_API_BASE}?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=10&format=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    // Census Tracts are in the geographies object
    const tracts = data?.result?.geographies?.["Census Tracts"];
    if (tracts && tracts.length > 0) {
      return tracts[0].GEOID;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching GEOID for [${lng}, ${lat}]:`, error.message);
    return null;
  }
}

async function runMigration() {
  console.log("Connecting to Database...");
  
  // NOTE: You must pass the mongo URI as an environment variable or hardcode for local run
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/famylink";
  await mongoose.connect(uri);
  
  console.log("Connected. Finding users to migrate...");

  // Find users who have coordinates but no GEOID
  // Using '+location.coordinates' to ensure coordinates are selected despite 'select: false' in schema
  const users = await User.find({
    "location.coordinates": { $exists: true, $ne: [] },
    "location.tract_geoid": { $exists: false }
  }).select("+location.coordinates location.tract_geoid");

  console.log(`Found ${users.length} users to migrate.`);

  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    const [lng, lat] = user.location.coordinates;
    
    console.log(`Processing user ${user._id} with coords [${lng}, ${lat}]...`);
    
    const geoid = await getGeoidForCoordinates(lng, lat);
    
    if (geoid) {
      user.location.tract_geoid = geoid;
      await user.save();
      console.log(`✅ Saved GEOID ${geoid} for user ${user._id}`);
      successCount++;
    } else {
      console.log(`❌ Failed to find GEOID for user ${user._id}`);
      failCount++;
    }

    // Rate limiting delay (Census API can be strict)
    await sleep(500); 
  }

  console.log("\nMigration Complete!");
  console.log(`Successfully migrated: ${successCount}`);
  console.log(`Failed to migrate: ${failCount}`);
  
  await mongoose.disconnect();
}

runMigration().catch(console.error);
