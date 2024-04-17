import jwt from 'jsonwebtoken';

const secretKey = process.env.KEY || 'iloveirina'; 

export default (req, res, next) => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Auth Error: No token provided" });
    } else {
      // Verify JWT token
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
          console.error("Error verifying token:", err);
          if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
          }
          return res.status(401).json({ message: "Invalid token" });
        }
        // Set user information in the request object
        req.user = decoded;
        
        next();
      });
    }
  } catch (error) {
    console.error("Error in auth middleware:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};