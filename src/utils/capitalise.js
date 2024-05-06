export const capitalizeFirstLetter = (string) => {
  const cleanedString = string.trim();
  return cleanedString
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
};
