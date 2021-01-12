const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");
const config = require("config");
const axios = require("axios");

const Profile = require("../models/Profile");
const User = require("../models/User");

/**
 * @route  GET api/profile/me
 * @desc   Get current user's profile
 * @access Private
 */
router.get("/me", auth, async (req, res) => {
	try {
		// populate can be used to add stuff from another model to the profile query
		const profile = await Profile.findOne({ user: req.user.id }).populate("user", [
			"name",
			"avatar"
		]);

		if (!profile) {
			return res.status(400).json({ msg: "There is no profile for this user" });
		}

		res.json(profile);
	} catch (error) {
		console.error(error.message);
		res.status(500).send("Server Error");
	}
});

/**
 * @route  POST api/profile/
 * @desc   Create or update user profile
 * @access Private
 */

router.post(
	"/",
	[
		auth,
		[
			check("status", "Status is required").not().isEmpty(),
			check("skills", "Skills are required").not().isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		// destructure the request
		const {
			company,
			location,
			website,
			bio,
			skills,
			status,
			githubusername,
			youtube,
			twitter,
			instagram,
			linkedin,
			facebook
		} = req.body;

		// Build profile object
		const profileFields = {};
		profileFields.user = req.user.id;
		if (company) profileFields.company = company;
		if (website) profileFields.website = website;
		if (location) profileFields.location = location;
		if (bio) profileFields.bio = bio;
		if (status) profileFields.status = status;
		if (githubusername) profileFields.githubusername = githubusername;
		if (skills) {
			profileFields.skills = skills.split(",").map((skill) => skill.trim());
		}

		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (twitter) profileFields.social.twitter = twitter;
		if (facebook) profileFields.social.facebook = facebook;
		if (linkedin) profileFields.social.linkedin = linkedin;
		if (instagram) profileFields.social.instagram = instagram;

		try {
			let profile = await Profile.findOne({ user: req.user.id });

			//if profile exists, update it and return
			if (profile) {
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				);

				return res.json(profile);
			}

			//profile doesn't exist, we have to create one
			profile = new Profile(profileFields);
			await profile.save();
			res.json(profile);
		} catch (error) {
			console.error(error.message);
			res.status(500).send("Server Error");
		}
	}
);

/**
 * @route  GET api/profile/
 * @desc   Get all profiles
 * @access Public
 */

router.get("/", async (req, res) => {
	try {
		const profiles = await Profile.find().populate("user", ["name", "avatar"]);
		res.json(profiles);
	} catch (error) {
		console.error(error.message);
		res.status(500).send("Server Error");
	}
});

/**
 * @route  GET api/profile/user/:user_id
 * @desc   Get profile by user ID
 * @access Public
 */

router.get("/user/:user_id", async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id
		}).populate("user", ["name", "avatar"]);

		if (!profile) {
			return res.status(400).json({ msg: "Profile Not Found" });
		}

		res.json(profile);
	} catch (error) {
		console.error(error.message);
		if (error.kind === "ObjectId") {
			return res.status(400).json({ msg: "Profile Not Found" });
		}
		res.status(500).send("Server Error");
	}
});

/**
 * @route  DELETE api/profile
 * @desc   Delete profile, user & posts
 * @access Private
 */

router.delete("/", auth, async (req, res) => {
	try {
		// Todo: remove user's posts
		// Remove Profile
		await Profile.findOneAndRemove({
			user: req.user.id
		});

		// Remove User
		await User.findOneAndRemove({ _id: req.user.id });

		res.json({ msg: "User Deleted" });
	} catch (error) {
		console.error(error.message);
		if (error.kind === "ObjectId") {
			return res.status(400).json({ msg: "Profile Not Found" });
		}
		res.status(500).send("Server Error");
	}
});

/**
 * @route  PUT api/profile/experience
 * @desc   Add profile experience
 * @access Private
 */
router.put(
	"/experience",
	[
		auth,
		[
			check("title", "title is required").not().isEmpty(),
			check("company", "company is required").not().isEmpty(),
			check("from", "From date is required").not().isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array });
		}

		const { title, company, location, from, to, current, description } = req.body;

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });

			profile.experience.unshift(newExp);

			await profile.save();

			res.json(profile);
		} catch (error) {
			console.error(error.message);
			return res.status(500).send("Server Error");
		}
	}
);

/**
 * @route  DELETE api/profile/experience/:exp_id
 * @desc   Delete experience from profile
 * @access Private
 */

router.delete("/experience/:exp_id", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });

		// Get remove index
		const removeIndex = profile.experience
			.map((item) => item.id)
			.indexOf(req.params.exp_id);

		profile.experience.splice(removeIndex, 1);

		await profile.save();

		res.json(profile);
	} catch (error) {
		return res.status(500).send("Server Error");
	}
});

/**
 * @route  PUT api/profile/education
 * @desc   Add profile education
 * @access Private
 */
router.put(
	"/education",
	[
		auth,
		[
			check("school", "school is required").not().isEmpty(),
			check("degree", "degree is required").not().isEmpty(),
			check("from", "From date is required").not().isEmpty(),
			check("fieldOfStudy", "fieldOfStudy").not().isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log("Error!");
			return res.status(400).json({ errors: errors.array });
		}

		console.log(req.body);

		const { school, degree, fieldOfStudy, from, to, current, description } = req.body;

		const newEdu = {
			school,
			degree,
			fieldOfStudy,
			from,
			to,
			current,
			description
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });

			profile.education.unshift(newEdu);

			await profile.save();

			res.json(profile);
		} catch (error) {
			console.error(error.message);
			return res.status(500).send("Server Error");
		}
	}
);

/**
 * @route  DELETE api/profile/education/:edu_id
 * @desc   Delete education from profile
 * @access Private
 */

router.delete("/education/:edu_id", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });

		// Get remove index
		const removeIndex = profile.education
			.map((item) => item.id)
			.indexOf(req.params.edu_id);

		profile.education.splice(removeIndex, 1);

		await profile.save();

		res.json(profile);
	} catch (error) {
		return res.status(500).send("Server Error");
	}
});

/**
 * @route  GET api/profile/github/username
 * @desc   Get user repos from Github
 * @access Public
 */

router.get("/github/:username", async (req, res) => {
	try {
		const uri = encodeURI(
			`https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
		);
		const headers = {
			"user-agent": "node.js",
			Authorization: `token ${config.get("githubToken")}`
		};

		const gitHubResponse = await axios.get(uri, { headers });
		return res.json(gitHubResponse.data);
	} catch (error) {
		console.error(error.message);
		return res.status(404).json({ msg: "No Github profile found" });
	}
});

module.exports = router;
