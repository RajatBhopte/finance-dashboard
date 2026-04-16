const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Helper to check email format
const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
};

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeEmail = (email) => normalizeText(email).toLowerCase();

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const serializeAuthUser = (user) => {
  const source = typeof user.toJSON === "function" ? user.toJSON() : user;
  const sanitized = { ...source };

  delete sanitized.refreshToken;
  delete sanitized.refreshTokenExpiresAt;

  return sanitized;
};

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "30d";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;

const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

const generateRefreshToken = (id, role) => {
  return jwt.sign({ id, role }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
};

async function saveRefreshToken(user, refreshToken) {
  const decoded = jwt.decode(refreshToken);
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  user.refreshToken = refreshTokenHash;
  user.refreshTokenExpiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : null;

  await user.save();
}

async function issueTokenPair(user) {
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);

  await saveRefreshToken(user, refreshToken);

  return {
    accessToken,
    refreshToken,
  };
}

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    const normalizedName = normalizeText(name);
    const normalizedEmail = normalizeEmail(email);

    // Validation
    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail })
      .select("_id")
      .lean();

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (default role is USER via schema)
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const { accessToken, refreshToken } = await issueTokenPair(user);

    res.status(201).json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      user: serializeAuthUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { password } = req.body || {};
    const identifier = normalizeText(
      req.body?.identifier || req.body?.email || req.body?.username,
    );

    // Validation
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email/username and password",
      });
    }

    const normalizedEmail = normalizeEmail(identifier);
    const isEmailLogin = validateEmail(normalizedEmail);

    if (!isEmailLogin && identifier.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 2 characters long",
      });
    }

    // Find user
    const userLookupQuery = isEmailLogin
      ? { email: normalizedEmail }
      : { name: new RegExp(`^${escapeRegex(identifier)}$`, "i") };

    const user = await User.findOne(userLookupQuery).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive. Please contact admin.",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const { accessToken, refreshToken } = await issueTokenPair(user);

    res.status(200).json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      user: serializeAuthUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refresh = async (req, res, next) => {
  try {
    const providedRefreshToken = normalizeText(req.body?.refreshToken);

    if (!providedRefreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(providedRefreshToken, REFRESH_TOKEN_SECRET);
    } catch (_error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token.",
      });
    }

    const user = await User.findById(decoded.id).select(
      "+refreshToken name email role isActive createdBy updatedBy createdAt updatedAt refreshTokenExpiresAt",
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token context.",
      });
    }

    if (
      !user.refreshToken ||
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt.getTime() < Date.now()
    ) {
      return res.status(401).json({
        success: false,
        message: "Refresh token has expired. Please sign in again.",
      });
    }

    const matchesStoredToken = await bcrypt.compare(
      providedRefreshToken,
      user.refreshToken,
    );

    if (!matchesStoredToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is no longer valid.",
      });
    }

    const { accessToken, refreshToken } = await issueTokenPair(user);

    return res.status(200).json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      user: serializeAuthUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Logout user and revoke refresh token
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res, next) => {
  try {
    const providedRefreshToken = normalizeText(req.body?.refreshToken);
    let userId = null;

    if (providedRefreshToken) {
      try {
        const decoded = jwt.verify(providedRefreshToken, REFRESH_TOKEN_SECRET);
        userId = decoded.id;
      } catch (_error) {
        userId = null;
      }
    }

    if (!userId) {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const decoded = jwt.verify(
            authHeader.split(" ")[1],
            process.env.JWT_SECRET,
          );
          userId = decoded.id;
        } catch (_error) {
          userId = null;
        }
      }
    }

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        refreshToken: null,
        refreshTokenExpiresAt: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};
