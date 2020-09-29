const spicedPg = require("spiced-pg");

let db;
if (process.env.DATABASE_URL) {
    // this will run if petition is running on heroku
    db = spicedPg(process.env.DATABASE_URL);
} else {
    // this will run if petition is running on localhost
    db = spicedPg("postgres:postgres:password@localhost:5432/petition");
}

module.exports.getSignatures = () => {
    return db.query(
        `SELECT signatures.id, users.first AS first, users.last AS last, user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS url 
        FROM signatures 
        LEFT JOIN users 
        ON signatures.user_id = users.id
        JOIN user_profiles
        ON user_profiles.user_id = users.id`
    );
};

module.exports.addSignatures = (signature, user_id) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id) VALUES ($1, $2) RETURNING id`,
        [signature, user_id]
    );
};

module.exports.countSignatures = () => {
    return db.query(`SELECT COUNT(*) FROM signatures`);
};

module.exports.getImage = (cookie) => {
    return db.query(`SELECT signature FROM signatures WHERE user_id=$1`, [
        cookie,
    ]);
};

module.exports.addUsersInput = (first, last, email, hash) => {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id, first`,
        [first, last, email, hash]
    );
};

module.exports.getUsersPw = (email) => {
    return db.query(`SELECT id, password FROM users WHERE email=$1`, [email]);
};

module.exports.hasUserSigned = (userId) => {
    return db.query(`SELECT id FROM signatures WHERE user_id=$1`, [userId]);
};

module.exports.addUsersProfile = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4)`,
        [age || null, city, url, user_id]
    );
};

module.exports.getToCity = (city) => {
    return db.query(
        `SELECT signatures.id, users.first AS first, users.last AS last, user_profiles.age AS age, user_profiles.city AS city
    FROM signatures
    LEFT JOIN users
    ON signatures.user_id = users.id
    JOIN user_profiles
    ON user_profiles.user_id = users.id
    WHERE LOWER(city) = LOWER($1)`,
        [city]
    );
};

module.exports.getUserInfo = (userId) => {
    return db.query(
        `SELECT users.id, users.first AS first, users.last AS last, users.email AS email,  user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS url 
        FROM users 
        LEFT JOIN user_profiles 
        ON users.id = user_profiles.user_id
        WHERE users.id = ($1)`,
        [userId]
    );
};

module.exports.updateUsers = (id, first, last, email, hash) => {
    let update;
    if (hash) {
        update = () => {
            return db.query(
                `INSERT INTO users (id, first, last, email, password)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id)
                DO UPDATE SET first = $2, last = $3, email = $4, password = $5`,
                [id, first, last, email, hash]
            );
        };
    } else {
        update = () => {
            return db.query(
                `INSERT INTO users (id, first, last, email)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id)
                DO UPDATE SET first = $2, last = $3, email = $4`,
                [id, first, last, email]
            );
        };
    }
    return update;
};

module.exports.updateUsersProfiles = (id, age, city, url) => {
    return db.query(
        `INSERT INTO user_profiles (user_id, age, city, url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $2, city = $3, url = $4`,
        [id, age || null, city, url]
    );
};

module.exports.deleteSignature = (id) => {
    return db.query(
        `DELETE FROM signatures
        WHERE user_id = $1`,
        [id]
    );
};
