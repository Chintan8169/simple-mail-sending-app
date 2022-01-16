const path = require("path");
const express = require("express");
const nodemailer = require("nodemailer");
const validator = require("validator");
const pug = require("pug");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const port = process.env.PORT || 8000;
const staticPath = path.join(__dirname, "../statics");
const viewsPath = path.join(__dirname, "../templates");
app.use(express.static(staticPath));
app.set("view engine", "pug");
app.set("views", viewsPath);

app.get("/", (req, res) => {
	res.render("index");
});

app.post("/send", (req, res) => {
	let to = req.body.to;
	let isMultiple = to.includes(",") ? true : false;
	let toValid = true;
	if (isMultiple) {
		const toArr = req.body.to.split(",");
		toArr.forEach((element) => {
			if (!validator.isEmail(element)) {
				toValid = false;
			}
		});
		if (!toValid) {
			res.render("index", { err: `Enter Fields values properly !!` });
		}
	} else {
		toValid = validator.isEmail(to);
	}
	const isValid =
		validator.isEmail(req.body.from) &&
		toValid &&
		!validator.isEmpty(req.body.subject) &&
		!validator.isEmpty(req.body.message.trim()) &&
		!validator.isEmpty(req.body.password.trim());
	if (isValid) {
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: req.body.from,
				pass: req.body.password.trim(),
			},
		});

		const mailOptions = {
			from: req.body.from,
			to: to.trim(),
			subject: req.body.subject.trim(),
			html: req.body.message.trim(),
		};

		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				if (error.toString().includes("getaddrinfo ENOTFOUND")) {
					res.render("index", { err: `Can't connect to network !! Turn On Internet !!` });
				} else if (error.response.includes("Application-specific password required")) {
					const url = "https://myaccount.google.com/signinoptions/two-step-verification";
					res.render("index", { err: `Disable two factor authentication from <a href=${url} target="_blank">Here</a> to send email !!` });
				} else if (error.response.includes("Username and Password not accepted")) {
					const url = "https://myaccount.google.com/lesssecureapps";
					res.render("index", {
						err: `Your credential are not matching !!<br>
						You should also check your gmail access for our app <a href=${url} target="_blank">Here</a> !!`,
					});
				} else {
					res.render("index", { err: error.response });
					console.log(error);
				}
			} else {
				if (info.response.includes("OK")) {
					res.render("index", { msg: "Email sent successfully !" });
				}
			}
		});
	} else {
		res.render("index", { err: `Enter Fields values properly !!` });
	}
});

app.get("*", (req, res) => {
	res.sendFile(`${staticPath}/404.html`);
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
