const express = require("express");
const app = express();
exports.app = app;
const db = require("./db");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const { hash, compare } = require("./bc");

let secrets;
if (process.env.PORT) {
    secrets = process.env;
} else {
    secrets = require("./secrets.json");
}

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// cookie-session
app.use(
    cookieSession({
        secret: secrets.secret,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

// middleware
app.use(
    express.urlencoded({
        extended: false,
    })
);

// middleware to check if the users is logged in or registered
// app.use((req, res, next) => {
//     if (!req.session.userId && req.url != "/login" && req.url != "/register") {
//         res.redirect("/register");
//     } else {
//         next();
//     }
// });

// call csurf
app.use(csurf());

// generate Token
app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    res.setHeader("x-frame-options", "deny");
    next();
});

// serve static files from public folder
app.use(express.static("./public"));

// variables

// const requireLoggedOutUser = (req, res, next) => {
//     if (req.session.userId) {
//         res.redirect("/petition");
//     } else {
//         next();
//     }
// };

// const requireNoSignature = (req, res, next) => {
//     if (req.session.sigId) {
//         res.redirect('/thankyou');
//     } else {}
// };

///// ROUTES /////

// "/" route
app.get("/", (req, res) => {
    res.redirect("/welcome");
});

// welcome route
app.get("/welcome", (req, res) => {
    res.render("welcome");
});

// register route
app.get("/register", (req, res) => {
    res.render("register");
});

// register post request
app.post("/register", (req, res) => {
    hash(req.body.userPw)
        .then((hashedPw) => {
            return db
                .addUsersInput(
                    req.body.firstName,
                    req.body.lastName,
                    req.body.userEmail,
                    hashedPw
                )
                .then((results) => {
                    req.session.userId = results.rows[0].id;
                    req.session.first = results.rows[0].first;
                    res.redirect("/profiles");
                });
        })
        .catch((err) => {
            console.log("err in hash: ", err);
            res.render("register", {
                err: true,
            });
        });
});

// login route
app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    return db.getUsersPw(req.body.userEmail).then((results) => {
        compare(req.body.userPw, results.rows[0].password)
            .then((match) => {
                req.session.userId = results.rows[0].id;
                req.session.first = results.rows[0].first;
                if (match == true) {
                    db.hasUserSigned(req.session.userId).then((results) => {
                        console.log("results log in: ", results);
                        if (results) {
                            res.redirect("/thankyou");
                        } else {
                            res.redirect("/petition");
                        }
                    });
                }
            })
            .catch((err) => {
                console.log("err in compare", err);
                res.render("login", {
                    err: true,
                });
            });
    });
});

// profiles route
app.get("/profiles", (req, res) => {
    if (req.session.userId) {
        res.render("profiles", {
            first: req.session.first,
        });
    } else {
        res.redirect("/register");
    }
});

// profiles post request
app.post("/profiles", (req, res) => {
    if (
        req.body.url.startsWith("http://") ||
        req.body.url.startsWith("https://") ||
        !req.body.url
    ) {
        return db
            .addUsersProfile(
                req.body.age,
                req.body.city,
                req.body.url,
                req.session.userId
            )
            .then((results) => {
                console.log("results post profiles: ", results);
                console.log("req.body.url profiles: ", req.body.url);
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("err in post profiles: ", err);
                res.render("profiles", {
                    err: true,
                });
            });
    } else {
        res.render("profiles");
    }
});

// profile edit route
app.get("/profiles/edit", (req, res) => {
    if (req.session.userId) {
        console.log("req.body at edit: ", req.body);
        return db.getUserInfo(req.session.userId).then((results) => {
            let data = {
                first: results.rows[0].first,
                last: results.rows[0].last,
                email: results.rows[0].email,
                age: results.rows[0].age,
                city: results.rows[0].city,
                url: results.rows[0].url,
            };
            res.render("edit", {
                first: req.session.first,
                user: data,
            });
        });
    } else {
        res.redirect("/register");
    }
});

app.post("/profiles/edit", (req, res) => {
    let hashedPw;
    if (req.body.userPw != "") {
        hashedPw = hash(req.body.userPw);
    } else {
        hashedPw = false;
    }
    const updateUsers = db.updateUsers(
        req.session.userId,
        req.body.first,
        req.body.last,
        req.body.userEmail,
        hashedPw
    )();
    const updateUsersProfile = db.updateUsersProfiles(
        req.session.userId,
        req.body.age,
        req.body.city,
        req.body.url
    );

    Promise.all([updateUsers, updateUsersProfile])
        .then(() => {
            if (req.session.signed) {
                res.redirect("/thankyou");
            } else {
                res.redirect("/petition");
            }
        })
        .catch((err) => {
            console.log("err in profile edit: ", err);
            res.render("edit");
        });
});

// petition route
app.get("/petition", (req, res) => {
    if (req.session.userId) {
        res.render("petition", {
            first: req.session.first,
        });
    } else {
        res.redirect("/register");
    }
});

// /petition post request
app.post("/petition", (req, res) => {
    db.addSignatures(req.body.signature, req.session.userId)
        .then(() => {
            req.session.signed;
            res.redirect("/thankyou");
        })
        .catch((err) => {
            console.log("err in addSignatures: ", err);
            res.render("petition");
        });
});

// /thankyou route
app.get("/thankyou", (req, res) => {
    if (req.session.userId) {
        db.countSignatures().then((val) => {
            let countSign = val.rows[0].count;
            db.getImage(req.session.userId)
                .then((results) => {
                    req.session.signed = "hasSigned";
                    res.render("thankyou", {
                        first: req.session.first,
                        count: countSign,
                        newSign: results.rows[0].signature,
                    });
                })
                .catch((err) => {
                    console.log("err in countSignatures: ", err);
                });
        });
    } else {
        res.redirect("/register");
    }
});

// delete signature
app.post("/deleteSignature", (req, res) => {
    return db.deleteSignature(req.session.userId).then(() => {
        console.log("delete signature");
        req.session.signed = null;
        res.redirect("/petition");
    });
});

// /sigeners route
app.get("/signers", (req, res) => {
    if (req.session.userId && req.session.signed) {
        db.getSignatures()
            .then((results) => {
                console.log("results signer: ", results);
                let newArr = [];

                for (let i = 0; i < results.rows.length; i++) {
                    let signers = {};
                    signers.first = results.rows[i].first;
                    signers.last = results.rows[i].last;
                    signers.age = results.rows[i].age;
                    signers.city = results.rows[i].city;
                    signers.url = results.rows[i].url;
                    newArr.push(signers);
                }

                res.render("signers", {
                    first: req.session.first,
                    signers: newArr,
                });
            })
            .catch((err) => {
                console.log("err in getSignatures: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers/:city", (req, res) => {
    if (req.session.userId && req.session.signed) {
        return db
            .getToCity(req.params.city)
            .then((results) => {
                let newArr = [];

                for (let i = 0; i < results.rows.length; i++) {
                    let signers = {};
                    signers.first = results.rows[i].first;
                    signers.last = results.rows[i].last;
                    signers.age = results.rows[i].age;
                    signers.city = results.rows[i].city;
                    signers.url = results.rows[i].url;
                    newArr.push(signers);
                }

                res.render("city", {
                    first: req.session.first,
                    city: req.params.city,
                    signers: newArr,
                });
            })
            .catch((err) => {
                console.log("err in dynamic route: ", err);
            });
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/welcome");
});

// server
if (require.main === module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("The petition server is listening...")
    );
}
