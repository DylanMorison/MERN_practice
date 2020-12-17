const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
	// Get token from header because when we send a request
	// to a protected route we always send the jwt token in the header
	const token = req.header("x-auth-token");

	// Check if not token
	if (!token) {
		// 401: not authorized
		return res.status(401).json({ msg: "No token, authorization denied" });
	}

	// Verify token
	try {
		const decoded = jwt.verify(token, config.get("jwtSecret"));

		req.user = decoded.user;
		next();
	} catch (error) {
		res.status(401).json({ msg: "Token is not valid" });
	}
};
