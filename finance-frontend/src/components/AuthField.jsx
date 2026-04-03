import { Eye, EyeOff } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AuthField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
  required = false,
  error,
  toggleable = false,
  visible = false,
  onToggleVisibility,
  className,
  inputClassName,
  labelClassName,
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          "mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300",
          labelClassName
        )}
      >
        {label}
        {required ? <span className="ml-1 text-blue-500">*</span> : null}
      </label>
      <div className="group relative">
        {Icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-500 dark:text-gray-500 dark:group-focus-within:text-blue-400">
            <Icon size={18} />
          </span>
        ) : null}
        <input
          id={id}
          type={toggleable ? (visible ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={cn(
            "flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2a2d3a] dark:bg-[#13151f] dark:text-gray-200 dark:placeholder:text-gray-500",
            Icon && "pl-10",
            toggleable && "pr-10",
            error &&
              "border-negative/50 focus-visible:ring-negative/20 dark:border-negative/60",
            inputClassName
          )}
        />
        {toggleable ? (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-300"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-negative dark:text-rose-300">{error}</p> : null}
    </div>
  );
}
