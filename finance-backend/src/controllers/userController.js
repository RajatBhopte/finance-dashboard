const prisma = require("../config/db");

const ROLES = ["VIEWER", "ANALYST", "ADMIN"];

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return null;
}

function buildUserSelect() {
  return {
    id: true,
    name: true,
    email: true,
    role: true,
    isActive: true,
    createdAt: true,
    _count: {
      select: {
        transactions: true,
      },
    },
  };
}

async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: buildUserSelect(),
  });
}

async function ensureAdminSafety(userId, nextRole, nextStatus) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw createError(404, "User not found.");
  }

  const finalRole = nextRole ?? user.role;
  const finalStatus = nextStatus ?? user.isActive;
  const wouldRemoveActiveAdmin = user.role === "ADMIN" && user.isActive && (finalRole !== "ADMIN" || finalStatus === false);

  if (!wouldRemoveActiveAdmin) {
    return user;
  }

  const activeAdminCount = await prisma.user.count({
    where: {
      role: "ADMIN",
      isActive: true,
    },
  });

  if (activeAdminCount <= 1) {
    throw createError(400, "At least one active admin must remain in the system.");
  }

  return user;
}

const getUsers = async (req, res, next) => {
  try {
    const { role, isActive } = req.query;
    const where = {};

    const normalizedRole = normalizeText(role).toUpperCase();
    const parsedStatus = isActive !== undefined ? parseBoolean(isActive) : null;

    if (role && !ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Role filter must be VIEWER, ANALYST, or ADMIN.",
      });
    }

    if (isActive !== undefined && parsedStatus === null) {
      return res.status(400).json({
        success: false,
        message: "isActive filter must be true or false.",
      });
    }

    if (normalizedRole) {
      where.role = normalizedRole;
    }

    if (parsedStatus !== null) {
      where.isActive = parsedStatus;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      select: buildUserSelect(),
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    return next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role.",
      });
    }

    const normalizedRole = normalizeText(req.body?.role).toUpperCase();

    if (!ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Role must be VIEWER, ANALYST, or ADMIN.",
      });
    }

    const currentUser = await ensureAdminSafety(req.params.id, normalizedRole);

    if (currentUser.role === normalizedRole) {
      return res.status(400).json({
        success: false,
        message: "User already has this role.",
      });
    }

    await prisma.user.update({
      where: { id: req.params.id },
      data: { role: normalizedRole },
    });

    const updatedUser = await getUserById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "User role updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    return next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own active status.",
      });
    }

    const parsedStatus = parseBoolean(req.body?.isActive);

    if (parsedStatus === null) {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const currentUser = await ensureAdminSafety(req.params.id, undefined, parsedStatus);

    if (currentUser.isActive === parsedStatus) {
      return res.status(400).json({
        success: false,
        message: `User is already ${parsedStatus ? "active" : "inactive"}.`,
      });
    }

    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: parsedStatus },
    });

    const updatedUser = await getUserById(req.params.id);

    return res.status(200).json({
      success: true,
      message: `User ${parsedStatus ? "activated" : "deactivated"} successfully.`,
      data: updatedUser,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  updateUserStatus,
};
