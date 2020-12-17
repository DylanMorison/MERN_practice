const express = require("express");
const router = express.Router();

/**
 * @route  GET auth
 * @desc   TEST route
 * @access Public
 */
router.get("/", (req, res) => {
	res.send("Auth Route");
});

module.exports = router;
