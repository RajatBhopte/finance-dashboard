const tones = {
  VIEWER: "bg-viewer/15 text-viewer",
  ANALYST: "bg-analyst/15 text-analyst",
  ADMIN: "bg-admin/15 text-admin",
};

export default function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-[0.18em] ${
        tones[role] || "bg-line text-text"
      }`}
    >
      {role}
    </span>
  );
}
