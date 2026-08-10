// Multipart upload gate.
//
// All uploads stay in memory and are forwarded to Cloudinary by the route
// handlers. Disk `destination` / `filename` options are intentionally unused —
// writing attacker-controlled `originalname` under /assets/uploads was the
// previous footgun (path tricks, HTML/SVG XSS via static serve).
//
// Callers pick a preset:
//   upload      — images only (profile, blogs, ID verification)
//   uploadMedia — images + short video (community posts)

import multer from "multer";
import path from "path";
import crypto from "node:crypto";

const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

// SVG is excluded on purpose: it can carry script and is served as an image.
const VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const IMAGE_MAX_BYTES = 8 * 1024 * 1024; // 8MB
const MEDIA_MAX_BYTES = 25 * 1024 * 1024; // 25MB (short clips)

/** Safe, unique filename — never trust `file.originalname` for storage. */
export const safeFilename = (originalname = "", fallbackExt = ".bin") => {
  const ext = path.extname(String(originalname)).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const allowedExt = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".avif",
    ".mp4",
    ".webm",
    ".mov",
  ]);
  const useExt = allowedExt.has(ext) ? ext : fallbackExt;
  const stamp = `${Date.now().toString(36)}_${crypto.randomBytes(8).toString("hex")}`;
  return `${stamp}${useExt}`;
};

const makeFilter = (allowedMimes) => (req, file, cb) => {
  const mime = String(file.mimetype || "").toLowerCase();
  if (!allowedMimes.has(mime)) {
    const err = new Error(
      `Unsupported file type "${mime || "unknown"}". Allowed: ${[...allowedMimes].join(", ")}`
    );
    err.code = "LIMIT_FILE_TYPE";
    return cb(err);
  }
  return cb(null, true);
};

const storage = multer.memoryStorage();

const build = ({ allowedMimes, fileSize, files }) =>
  multer({
    storage,
    limits: {
      fileSize,
      files,
      // Cap field count so a crafted multipart can't blow memory on form fields.
      fields: 40,
      // Register / profile forms sometimes send large base64 image fields.
      fieldSize: 6 * 1024 * 1024,
    },
    fileFilter: makeFilter(allowedMimes),
  });

/** Images only — default for profile / blog / verification uploads. */
export const upload = build({
  allowedMimes: IMAGE_MIME,
  fileSize: IMAGE_MAX_BYTES,
  files: 10,
});

/** Images + video — community media posts. */
export const uploadMedia = build({
  allowedMimes: new Set([...IMAGE_MIME, ...VIDEO_MIME]),
  fileSize: MEDIA_MAX_BYTES,
  files: 5,
});

/**
 * Express error handler for multer rejections.
 * Mount after routes that use `upload` / `uploadMedia`, or call from a wrapper.
 */
export const multerErrorHandler = (err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError || err.code === "LIMIT_FILE_TYPE") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "That file is too large. Please compress it and try again."
        : err.code === "LIMIT_FILE_TYPE"
          ? err.message
          : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
            ? "Too many files uploaded."
            : "Invalid upload.";
    return res.status(400).json({ message });
  }

  return next(err);
};
