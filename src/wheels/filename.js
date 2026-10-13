// The optional name a person gives their image ("Week 5") ends up in a file
// name, so it is limited to characters every operating system accepts.

export const LABEL_MAX = 40;

export function cleanLabel(input) {
  return String(input ?? '')
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+|\.{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, LABEL_MAX);
}

function titleCase(text) {
  return text.replace(/(^|\s)(\S)/g, (_, space, ch) => space + ch.toUpperCase());
}

// The label as shown in the image and in its file name: "week 5" → "Week 5".
export function displayLabel(label) {
  return titleCase(cleanLabel(label).trim().replace(/\.+$/, ''));
}

export function imageFileName(wheelTitle, label) {
  const extra = displayLabel(label);
  return `NeuroDapt - ${wheelTitle}${extra ? ` - ${extra}` : ''}.png`;
}
