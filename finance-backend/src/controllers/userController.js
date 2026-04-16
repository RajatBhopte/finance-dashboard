const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

const ROLES = ["USER", "MANAGER", "ADMIN"];
const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeRole(value) {
  return normalizeText(value).toUpperCase();
}

function normalizeStoredRole(value) {
  const normalized = normalizeRole(value);
  return ROLES.includes(normalized) ? normalized : "USER";
}

function validateEmail(value) {
  return EMAIL_REGEX.test(String(value || "").toLowerCase());
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

function parsePositiveInteger(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseFlag(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true";
  }

  return fallback;
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generatePassword(length = 10) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let password = "";

  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }

  return password;
}

function mapAuditActor(actor) {
  if (!actor) {
    return null;
  }

  const id =
    actor._id?.toString?.() || actor.id?.toString?.() || actor.toString?.();

  if (!id) {
    return null;
  }

  return {
    id,
    name: actor.name || null,
    email: actor.email || null,
  };
}

function serializeUser(user) {
  const source = typeof user.toJSON === "function" ? user.toJSON() : user;
  const createdByActor = mapAuditActor(source.createdBy);
  const updatedByActor = mapAuditActor(source.updatedBy);

  return {
    id: source.id || source._id?.toString?.(),
    name: source.name,
    email: source.email,
    role: normalizeStoredRole(source.role),
    isActive: Boolean(source.isActive),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    createdBy: createdByActor?.id || null,
    updatedBy: updatedByActor?.id || null,
    audit: {
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
      createdBy: createdByActor,
      updatedBy: updatedByActor,
    },
  };
}

async function findUserById(id, withAudit = false) {
  if (!isValidObjectId(id)) {
    return null;
  }

  let query = User.findById(id).select(
    "name email role isActive createdAt updatedAt createdBy updatedBy",
  );

  if (withAudit) {
    query = query
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");
  }

  return query;
}

async function findUserOrThrow(id, withAudit = false) {
  const user = await findUserById(id, withAudit);

  if (!user) {
    throw createError(404, "User not found.");
  }

  return user;
}

async function serializeSingleUser(id, withAudit = true) {
  const user = await findUserOrThrow(id, withAudit);

  return serializeUser(user);
}

async function ensureAdminSafety(userId, nextRole, nextStatus) {
  if (!isValidObjectId(userId)) {
    throw createError(404, "User not found.");
  }

  const user = await User.findById(userId).select("role isActive").lean();

  if (!user) {
    throw createError(404, "User not found.");
  }

  const existingRole = normalizeStoredRole(user.role);
  const finalRole =
    nextRole !== undefined ? normalizeStoredRole(nextRole) : existingRole;
  const finalStatus = nextStatus ?? user.isActive;
  const wouldRemoveActiveAdmin =
    existingRole === "ADMIN" &&
    user.isActive &&
    (finalRole !== "ADMIN" || finalStatus === false);

  if (!wouldRemoveActiveAdmin) {
    return user;
  }

  const activeAdminCount = await User.countDocuments({
    role: "ADMIN",
    isActive: true,
  });

  if (activeAdminCount <= 1) {
    throw createError(
      400,
      "At least one active admin must remain in the system.",
    );
  }

  return user;
}

const getUsers = async (req, res, next) => {
  try {
    const { role, isActive, search, page, limit } = req.query;
    const where = {};

    const normalizedRole = normalizeRole(role);
    const normalizedSearch = normalizeText(search);
    const parsedStatus = isActive !== undefined ? parseBoolean(isActive) : null;
    const parsedPage = parsePositiveInteger(page, 1);
    const parsedLimit = parsePositiveInteger(limit, 10);

    if (role && !ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Role filter must be USER, MANAGER, or ADMIN.",
      });
    }

    if (isActive !== undefined && parsedStatus === null) {
      return res.status(400).json({
        success: false,
        message: "isActive filter must be true or false.",
      });
    }

    if (parsedPage === null) {
      return res.status(400).json({
        success: false,
        message: "page must be a positive integer.",
      });
    }

    if (parsedLimit === null) {
      return res.status(400).json({
        success: false,
        message: "limit must be a positive integer.",
      });
    }

    if (normalizedRole) {
      where.role = normalizedRole;
    }

    if (parsedStatus !== null) {
      where.isActive = parsedStatus;
    }

    if (normalizedSearch) {
      const safeRegex = new RegExp(escapeRegex(normalizedSearch), "i");
      where.$or = [{ name: safeRegex }, { email: safeRegex }];
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const [users, total] = await Promise.all([
      User.find(where)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .select(
          "name email role isActive createdAt updatedAt createdBy updatedBy",
        ),
      User.countDocuments(where),
    ]);

    const serializedUsers = users.map((item) => serializeUser(item));

    return res.status(200).json({
      success: true,
      count: serializedUsers.length,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit) || 1,
      },
      data: serializedUsers,
    });
  } catch (error) {
    return next(error);
  }
};

const getUserDetails = async (req, res, next) => {
  try {
    const user = await serializeSingleUser(req.params.id, true);

    if (req.user.role === "MANAGER" && user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Managers cannot view admin user details.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive, password, autoGeneratePassword } =
      req.body || {};

    const normalizedName = normalizeText(name);
    const normalizedEmail = normalizeEmail(email);
    const normalizedRole = role ? normalizeRole(role) : "USER";
    const parsedStatus = isActive === undefined ? true : parseBoolean(isActive);
    const shouldGeneratePassword =
      parseFlag(autoGeneratePassword) || !normalizeText(password);
    const plainPassword = shouldGeneratePassword
      ? generatePassword()
      : String(password || "");

    if (!normalizedName || !normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Please provide name and email.",
      });
    }

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (!ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Role must be USER, MANAGER, or ADMIN.",
      });
    }

    if (parsedStatus === null) {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    if (plainPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const userExists = await User.findOne({ email: normalizedEmail })
      .select("_id")
      .lean();

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      isActive: parsedStatus,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    const serializedUser = await serializeSingleUser(user.id, true);

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: serializedUser,
      meta: shouldGeneratePassword
        ? {
            generatedPassword: plainPassword,
          }
        : undefined,
    });
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (!isValidObjectId(targetUserId)) {
      throw createError(404, "User not found.");
    }

    const targetUser = await User.findById(targetUserId)
      .select("role isActive email")
      .lean();

    if (!targetUser) {
      throw createError(404, "User not found.");
    }

    const targetUserRole = normalizeStoredRole(targetUser.role);

    const data = {};
    const isSelf = req.user.id === targetUserId;
    const isManagerRequest = req.user.role === "MANAGER";
    let nextRole;
    let nextStatus;

    if (isManagerRequest && targetUserRole === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Managers cannot update admin users.",
      });
    }

    if (req.body?.name !== undefined) {
      const normalizedName = normalizeText(req.body.name);

      if (!normalizedName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      data.name = normalizedName;
    }

    if (req.body?.email !== undefined) {
      const normalizedEmail = normalizeEmail(req.body.email);

      if (!normalizedEmail || !validateEmail(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address.",
        });
      }

      const existingEmailOwner = await User.findOne({ email: normalizedEmail })
        .select("_id")
        .lean();

      if (
        existingEmailOwner &&
        existingEmailOwner._id.toString() !== targetUserId
      ) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use.",
        });
      }

      data.email = normalizedEmail;
    }

    if (req.body?.role !== undefined) {
      if (isManagerRequest) {
        return res.status(403).json({
          success: false,
          message: "Managers cannot change user roles.",
        });
      }

      const normalizedRole = normalizeRole(req.body.role);

      if (!ROLES.includes(normalizedRole)) {
        return res.status(400).json({
          success: false,
          message: "Role must be USER, MANAGER, or ADMIN.",
        });
      }

      if (isSelf && normalizedRole !== targetUserRole) {
        return res.status(400).json({
          success: false,
          message: "You cannot change your own role.",
        });
      }

      if (normalizedRole !== targetUserRole) {
        nextRole = normalizedRole;
        data.role = normalizedRole;
      }
    }

    if (req.body?.isActive !== undefined) {
      if (isManagerRequest) {
        return res.status(403).json({
          success: false,
          message: "Managers cannot change account status.",
        });
      }

      const parsedStatus = parseBoolean(req.body.isActive);

      if (parsedStatus === null) {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      if (isSelf && parsedStatus !== targetUser.isActive) {
        return res.status(400).json({
          success: false,
          message: "You cannot change your own active status.",
        });
      }

      if (parsedStatus !== targetUser.isActive) {
        nextStatus = parsedStatus;
        data.isActive = parsedStatus;
      }
    }

    if (req.body?.password !== undefined) {
      const plainPassword = String(req.body.password || "").trim();

      if (!plainPassword || plainPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long.",
        });
      }

      data.password = await bcrypt.hash(plainPassword, 10);
    }

    if (
      !isManagerRequest &&
      (nextRole !== undefined || nextStatus !== undefined)
    ) {
      await ensureAdminSafety(targetUserId, nextRole, nextStatus);
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update.",
      });
    }

    data.updatedBy = req.user.id;

    await User.findByIdAndUpdate(targetUserId, data);
    const serializedUser = await serializeSingleUser(targetUserId, true);

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: serializedUser,
    });
  } catch (error) {
    return next(error);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (req.user.id === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account.",
      });
    }

    const currentUser = await ensureAdminSafety(targetUserId, undefined, false);

    if (!currentUser.isActive) {
      return res.status(400).json({
        success: false,
        message: "User is already inactive.",
      });
    }

    await User.findByIdAndUpdate(targetUserId, {
      isActive: false,
      updatedBy: req.user.id,
    });

    const serializedUser = await serializeSingleUser(targetUserId, true);

    return res.status(200).json({
      success: true,
      message: "User deactivated successfully.",
      data: serializedUser,
    });
  } catch (error) {
    return next(error);
  }
};

const hardDeleteUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (req.user.id === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot permanently delete your own account.",
      });
    }

    await ensureAdminSafety(targetUserId, undefined, false);
    const serializedUser = await serializeSingleUser(targetUserId, true);

    await User.findByIdAndDelete(targetUserId);

    return res.status(200).json({
      success: true,
      message: "User permanently deleted.",
      data: serializedUser,
    });
  } catch (error) {
    return next(error);
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    const user = await serializeSingleUser(req.user.id, true);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    if (req.body?.role !== undefined || req.body?.isActive !== undefined) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your role or active status.",
      });
    }

    if (req.body?.email !== undefined) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your email from this endpoint.",
      });
    }

    const data = {};

    if (req.body?.name !== undefined) {
      const normalizedName = normalizeText(req.body.name);

      if (!normalizedName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      data.name = normalizedName;
    }

    if (req.body?.password !== undefined) {
      const plainPassword = String(req.body.password || "").trim();

      if (!plainPassword || plainPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long.",
        });
      }

      data.password = await bcrypt.hash(plainPassword, 10);
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({
        success: false,
        message: "Please provide name or password to update.",
      });
    }

    data.updatedBy = req.user.id;

    await User.findByIdAndUpdate(req.user.id, data);
    const user = await serializeSingleUser(req.user.id, true);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  req.body = {
    role: req.body?.role,
  };

  return updateUser(req, res, next);
};

const updateUserStatus = async (req, res, next) => {
  req.body = {
    isActive: req.body?.isActive,
  };

  return updateUser(req, res, next);
};

module.exports = {
  getUsers,
  getUserDetails,
  createUser,
  updateUser,
  deactivateUser,
  hardDeleteUser,
  getMyProfile,
  updateMyProfile,
  updateUserRole,
  updateUserStatus,
};
