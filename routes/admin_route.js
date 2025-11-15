const express = require("express");
const router = express.Router();
const deviceController = require('../app/controllers/device_controller');

/* GET admin page */
router.get("/", function (req, res, next) {
    res.render("admin/index", {
        layout: "layouts/admin",
        title: "Smart Bottle Admin",
    });
});

/* GET admin devices page */
router.get("/devices", deviceController.getDevicesPage);

/* GET admin device register page */
router.get("/devices/register", deviceController.getRegisterPage);

/* GET admin device edit page */
router.get("/devices/:device_id/edit", deviceController.getEditPage);

module.exports = router;
