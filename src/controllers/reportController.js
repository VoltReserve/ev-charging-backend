import ExcelJS from "exceljs";
import * as reportService from "../services/reportService.js";

export const getDashboard = async (req, res) => {
  try {
    const summary = await reportService.getDashboardSummary();
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingsReport = async (req, res) => {
  try {
    const report = await reportService.getTotalBookings();
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingsByStation = async (req, res) => {
  try {
    const report = await reportService.getBookingsByStation();
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChargerUtilization = async (req, res) => {
  try {
    const report = await reportService.getChargerUtilization();
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveBookingsReport = async (req, res) => {
  try {
    const report = await reportService.getActiveBookings();
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUpcomingBookingsReport = async (req, res) => {
  try {
    const report = await reportService.getUpcomingBookings();
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompletedBookingsReport = async (req, res) => {
  try {
    const report = await reportService.getCompletedBookings();
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCancelledBookingsReport = async (req, res) => {
  try {
    const report = await reportService.getCancelledBookings();
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDateWiseReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const report = await reportService.getDateWiseReport(from, to);
    res.status(200).json(report);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getUserReport = async (req, res) => {
  try {
    const report = await reportService.getUserReport();
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportCsvReport = async (req, res) => {
  try {
    const bookings = await reportService.getAllBookingsForExport();

    const header = "Booking ID,Station,Charger,Date,Status";
    const rows = bookings.map(
      (b) =>
        `${b.bookingId},${b.station},${b.charger},${b.date},${b.status}`
    );
    const csv = [header, ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="bookings_report.csv"'
    );
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportExcelReport = async (req, res) => {
  try {
    const bookings = await reportService.getAllBookingsForExport();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Bookings");

    worksheet.columns = [
      { header: "Booking ID", key: "bookingId", width: 15 },
      { header: "Station", key: "station", width: 20 },
      { header: "Charger", key: "charger", width: 12 },
      { header: "Date", key: "date", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.addRows(bookings);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Bookings_Report.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
