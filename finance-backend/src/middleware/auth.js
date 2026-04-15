const jwt = require("jsonwebtoken");
const User = require("../models/User");

// It checks the Authorization header.
// It expects Bearer <token>.
// It verifies the JWT using JWT_SECRET.
// It fetches the user from the database.
// If the user exists and is active, it attaches that user to req.user.
// Then it calls next() so the request can continue.

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Missing token.",
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select("name email role isActive")
      .lean();

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. User is inactive or missing.",
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid token.",
    });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not have access to this resource.",
      });
    }

    return next();
  };
}

module.exports = {
  protect,
  authorize,
};
