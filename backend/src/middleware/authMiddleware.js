import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
        success: false,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Authenticated user:", decoded.userId);

    req.id = decoded.userId;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
      success: false,
    });
  }
};

export default authMiddleware;