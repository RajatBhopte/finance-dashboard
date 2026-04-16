const User = require("../models/User");

const ROLES = ["USER", "MANAGER", "ADMIN"];

function normalizeRoleValue(value) {
  if (typeof value !== "string") {
    return "USER";
  }

  const normalized = value.trim().toUpperCase();
  return ROLES.includes(normalized) ? normalized : "USER";
}

async function buildSummary(requestUser) {
  const role = normalizeRoleValue(requestUser?.role);
  const baseSummary = {
    role,
    permissions: {
      canViewUserDirectory: role === "ADMIN" || role === "MANAGER",
      canManageOwnProfile: true,
      canCreateUsers: role === "ADMIN",
      canChangeRoles: role === "ADMIN",
      canDeactivateUsers: role === "ADMIN",
    },
  };

  if (role === "USER") {
    return {
      ...baseSummary,
      dashboardView: "self-service",
      message:
        "You can update your own profile, including name and password, from the My Profile section.",
    };
  }

  const [totalUsers, activeUsers, roleDistribution, recentUsers] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]),
      User.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select("name email role isActive createdAt")
        .lean(),
    ]);

  const byRole = {
    ADMIN: 0,
    MANAGER: 0,
    USER: 0,
  };

  for (const row of roleDistribution) {
    const roleKey = normalizeRoleValue(row?._id);

    if (Object.prototype.hasOwnProperty.call(byRole, roleKey)) {
      byRole[roleKey] = row.count;
    }
  }

  return {
    ...baseSummary,
    dashboardView: "directory-control",
    totals: {
      users: totalUsers,
      activeUsers,
      inactiveUsers: Math.max(totalUsers - activeUsers, 0),
      byRole,
    },
    recentUsers: recentUsers.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      email: item.email,
      role: normalizeRoleValue(item.role),
      isActive: Boolean(item.isActive),
      createdAt: item.createdAt,
    })),
  };
}

module.exports = {
  buildSummary,
};
