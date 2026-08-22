const { generateWeeklyPDF } = require("../services/reportGenerator");

exports.generateWeeklyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const pdfBuffer = await generateWeeklyPDF(userId);

    res.setHeader("Content-Disposition", "attachment; filename=weekly_report.pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Report error" });
  }
};
