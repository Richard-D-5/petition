const supertest = require("supertest");
const { app } = require("./index");

const cookieSession = require("cookie-session");

test("GET / redirects when I make request without cookies", () => {
    return supertest(app)
        .get("/")
        .then((res) => {
            // console.log("res: ", res); // statusCode, text, headers
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/register");
        });
});

test('GET / sends 200 status code as response when there is a "submitted" cookie, and checks that the correct HTML is sent back as response', () => {
    cookieSession.mockSessionOnce({
        submitted: true,
    });
    return supertest(app)
        .get("/profiles")
        .then((res) => {
            console.log("res: ", res);
        });
});

test("POST / sets submitted cookie to true", () => {
    // 1. create an empty cookie that my server can write data to
    const cookie = {};
    cookieSession.mockSessionOnce(cookie);

    // 2. make request to server (as usual)
    return supertest(app)
        .post("/register")
        .then((res) => {
            console.log("cookie: ", cookie);
        });
});
