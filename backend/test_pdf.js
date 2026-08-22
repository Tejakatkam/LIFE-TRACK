const { generateWeeklyPDF } = require("./services/reportGenerator");
const fs = require("fs");
require("dotenv").config();

(async () => {
  try {
    console.log("Generating PDF...");
    const buffer = await generateWeeklyPDF(1, { "2026-08-22_skincare": true }, [{id: "skincare", name: "Skincare", icon: "?"}]);
    fs.writeFileSync("test.pdf", buffer);
    console.log("PDF saved to test.pdf");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

