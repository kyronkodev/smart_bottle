const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const loadEnv = require('./config/env');

// 환경변수 로드
loadEnv();

const app = express();

// CORS 설정
app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

// Body parser 설정
app.use(
    express.json({
        limit: "100mb",
    })
);
app.use(
    express.urlencoded({
        limit: "100mb",
        extended: false,
    })
);

// View engine 설정
app.set("views", path.join(__dirname, "app/views"));
app.set("view engine", "ejs");

// Middleware
app.use(logger("dev"));
app.use(expressLayouts);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use("/assets", express.static(path.join(__dirname, "/assets")));
app.use("/public", express.static(path.join(__dirname, "/public")));

// Routes
const indexRouter = require("./routes/index_route");
const apiRouter = require("./routes/api_route");
const adminRouter = require("./routes/admin_route");
const dashboardRouter = require("./routes/dashboard_route");
const deviceRouter = require("./routes/device_route");

app.use("/", indexRouter);
app.use("/api", apiRouter);
app.use("/admin", adminRouter);
app.use("/dashboard", dashboardRouter);
app.use("/devices", deviceRouter);

// 404 handler
app.use(function (req, res, next) {
    next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
    res.locals.message = process.env.APPLICATION_STATUS === "development" ? err.message : "";
    res.locals.error = process.env.APPLICATION_STATUS === "development" ? err : {};

    res.status(err.status || 500);
    const appLogger = require("./config/logger");
    appLogger.writeLog("error", `code ${err.status}: msg ${err.message}`);

    res.render("error", {
        layout: "layouts/full",
        err: err.message,
    });
});

// Global stage setting
global.stage = process.env.APPLICATION_STATUS;

if (process.env.APPLICATION_STATUS === "development") {
    global.stage = "DEV";
} else if (process.env.APPLICATION_STATUS === "production") {
    global.stage = "PRD";
}

module.exports = app;
