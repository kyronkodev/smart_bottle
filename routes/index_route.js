const express = require("express");
const router = express.Router();

/* GET home page */
router.get("/", function (req, res, next) {
    res.render("index", {
        layout: "layouts/full",
        title: "Smart Bottle",
    });
});

module.exports = router;
