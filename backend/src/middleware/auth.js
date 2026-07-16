const jwt = require("jsonwebtoken");
const { get } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "pastalino-secret";

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing authorization token." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await get("SELECT id, email, role, name, mustResetPassword FROM users WHERE id = ?", [payload.id]);
    if (!user) {
      return res.status(401).json({ message: "Invalid token." });
    }
    if (user.mustResetPassword) {
      return res.status(403).json({ message: "Password reset required before accessing the system." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token.", error: err.message });
  }
}

function authorizeAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: "Insufficient permissions." });
    }
    next();
  };
}

module.exports = {
  authenticate,
  authorizeAdmin,
  authorizeRoles,
};
