// Strip any HTML from user-authored plain-text fields (community posts,
// comments, about-me, etc.). React text nodes already escape on render, but
// cleaning on write means a future HTML renderer cannot turn stored markup
// into XSS, and it keeps search/index text clean.

import { htmlToText } from "./sanitizeHtml.js";

export const toPlainText = (input, { maxLength } = {}) => {
  let text = htmlToText(input);
  // Collapse control characters that can break logs / CSV exports.
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  if (typeof maxLength === "number" && maxLength > 0 && text.length > maxLength) {
    text = text.slice(0, maxLength);
  }
  return text;
};
