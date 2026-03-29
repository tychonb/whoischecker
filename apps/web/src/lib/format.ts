const dateTimeFormatter = new Intl.DateTimeFormat("nl-NL", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(value?: string) {
  if (!value) {
    return "Nog niet uitgevoerd";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatRelativeQueue(value?: string) {
  if (!value) {
    return "n.v.t.";
  }

  const target = new Date(value).getTime();
  const diffMs = target - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 60) {
    return `${diffMinutes > 0 ? "over" : ""} ${Math.abs(diffMinutes)} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  return `${diffHours > 0 ? "over" : ""} ${Math.abs(diffHours)} uur`;
}

export function maskSecret(secret: string | undefined, fallback = "Niet geconfigureerd") {
  if (!secret) {
    return fallback;
  }

  if (secret.length <= 8) {
    return "••••••••";
  }

  return `${secret.slice(0, 4)}••••${secret.slice(-4)}`;
}

export function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
