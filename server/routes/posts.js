const express = require("express");
const router = express.Router();

/**
 * @route  GET posts
 * @desc   TEST route
 * @access Public
 */
router.get("/", (req, res) => {
	res.send("Posts Route");
});

module.exports = router;
