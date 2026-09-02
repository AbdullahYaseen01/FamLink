import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, "..");
const destDir = path.join(__dirname, "../outreach/reachowl");
fs.mkdirSync(destDir, { recursive: true });

const files = ["parents_list.csv", "caregivers_list.csv", "nanny_shares_list.csv", "unknown_list.csv"];
for (const name of files) {
  const from = path.join(srcDir, name);
  if (!fs.existsSync(from)) continue;
  fs.copyFileSync(from, path.join(destDir, name));
  console.log(`ReachOwl audience ready: outreach/reachowl/${name}`);
}
