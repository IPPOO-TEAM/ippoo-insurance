const KEY = "ippoo_registered";

export function isRegistered(): boolean {
  try {
    return typeof window !== "undefined" && localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markRegistered() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    // ignore
  }
}
