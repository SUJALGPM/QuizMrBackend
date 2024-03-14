const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET;
const authenticateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET, (err, decodedToken) => {

            console.log(err);
            console.log(decodedToken);

            if (err) {
                return res.sendStatus(403);
            }

            if (!decodedToken) {
                return res.sendStatus(403);
            }

            if (typeof decodedToken === "string") {
                return res.sendStatus(403);
            }

            req.headers['userId'] = decodedToken.id;
            req.headers['userRole'] = decodedToken.role;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

module.exports = { authenticateJwt };
