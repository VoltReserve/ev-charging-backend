import { authenticate } from "./authMiddleware.js";

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Access denied",
      });
    }

    next();
  };
};

export const requireAdmin = [authenticate, authorizeRoles("admin")];
export const requireUser = [authenticate, authorizeRoles("user")];
