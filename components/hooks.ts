export const idToTitle = (id: string): string =>
  id
    .split("-")
    .map((s) => `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`)
    .join(" ")
    .replace(/_/g, " ");
