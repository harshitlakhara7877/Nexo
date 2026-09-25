import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token;

  if(!token){
    return res.status(401).json({
      message: 'Authentication required',
      success: true
    })
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  console.log(decoded.userId)

  req.userId = decoded.userId;

  next();
  } catch (error) {
    console.log(error.message)
  }
}

export default authMiddleware;