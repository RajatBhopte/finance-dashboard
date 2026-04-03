export function formatCurrency(value) {
  const numeric = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatDisplayAmount(value) {
  const numeric = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatDate(value) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatMonth(value) {
  if (!value) {
    return "--";
  }

  const [year, month] = value.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

export function getErrorMessage(error, fallback = "Something went wrong, please try again.") {
  return error?.response?.data?.message || fallback;
}
