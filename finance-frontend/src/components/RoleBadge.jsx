const tones = {
  USER: "bg-user/15 text-user",
  MANAGER: "bg-manager/15 text-manager",
  ADMIN: "bg-admin/15 text-admin",
};

function normalizeRole(role) {
  if (typeof role !== "string") {
    return "USER";
  }

  const normalized = role.trim().toUpperCase();
  return tones[normalized] ? normalized : "USER";
}

export default function RoleBadge({ role }) {
  const normalizedRole = normalizeRole(role);

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-[0.18em] ${
        tones[normalizedRole] || "bg-line text-text"
      }`}
    >
      {normalizedRole}
    </span>
  );
}
