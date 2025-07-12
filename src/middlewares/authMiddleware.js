import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
    const token = req.cookies.accessToken;
    if (!token) {
        return res.status(401).json({ msg: "Access token not found" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ msg: "Invalid access token" });
    }
}
