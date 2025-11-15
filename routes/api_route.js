const express = require("express");
const router = express.Router();

/* API test endpoint */
router.get("/test", function (req, res, next) {
    res.json({
        success: true,
        message: "API is working",
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
