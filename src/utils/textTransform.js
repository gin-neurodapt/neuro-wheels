import { isLaptopScreen } from "./dimensions";

export const capitalizeFirstLetter = (string) => {
  const cleanedString = string.trim();
  return cleanedString
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
};

export const abbreviate = (string, screenSize) => {
  const words = string.split(" ");

  if (isLaptopScreen(screenSize.width)) {
    return string;
  }

  if (words.length === 1) {
    return string.slice(0, 3).toUpperCase();
  }

  if (words.length === 2) {
    return words.map((word) => word[0].toUpperCase()).join(".");
  }

  const connectorIndex = words.findIndex(
    (word) => word === "and" || word === "&"
  );

  if (connectorIndex !== -1 && words.length >= 3) {
    const first = words[0][0].toUpperCase();
    const last = words[connectorIndex + 1][0].toUpperCase();
    return `${first}&${last}`;
  }

  return words
    .slice(0, 3)
    .map((word) => word[0].toUpperCase())
    .join("");
};
