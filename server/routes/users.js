const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

/**
 * @route  POST users
 * @desc   Register User
 * @access Public
 */
router.post(
	"/",
	[
		check("name", "Name is required").not().isEmpty(),
		check("email", "please include valid email").isEmail(),
		check("password", "please enter a password with 6 or more charaters").isLength({
			min: 6
		})
	],
	(req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		res.send("User Route");
	}
);

module.exports = router;
