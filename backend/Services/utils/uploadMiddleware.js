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
  "image/pjpeg",
  "image/png",
  "image/x-png",
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

const IMAGE_EXT_MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

const VIDEO_EXT_MIME = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

const makeFilter = (allowedMimes) => (req, file, cb) => {
  const mime = String(file.mimetype || "").toLowerCase();
  if (allowedMimes.has(mime)) return cb(null, true);

  // Windows often sends an empty or generic MIME for a real jpeg/png. Trust
  // the extension in that case rather than aborting the whole profile save.
  const ext = path.extname(String(file.originalname || "")).toLowerCase();
  const fromExt = IMAGE_EXT_MIME[ext] || VIDEO_EXT_MIME[ext];
  if (fromExt && allowedMimes.has(fromExt)) {
    file.mimetype = fromExt;
    return cb(null, true);
  }

  const err = new Error(
    `Unsupported file type "${mime || "unknown"}". Allowed: ${[...allowedMimes].join(", ")}`
  );
  err.code = "LIMIT_FILE_TYPE";
  return cb(err);
};

const storage = multer.memoryStorage();

const MULTIPART_LIMITS = {
  // Flow 2's questionnaire is the largest multipart body we send (~42 text
  // fields + a photo). 40 used to reject those saves as "Invalid upload."
  fields: 200,
  parts: 200,
  fieldSize: 8 * 1024 * 1024,
};

const build = ({ allowedMimes, fileSize, files }) =>
  multer({
    storage,
    limits: {
      fileSize,
      files,
      ...MULTIPART_LIMITS,
    },
    fileFilter: makeFilter(allowedMimes),
  });

/** Images only — default for profile / blog / verification uploads. */
export const upload = build({
  allowedMimes: IMAGE_MIME,
  fileSize: IMAGE_MAX_BYTES,
  files: 10,
});

const profileUpload = multer({
  storage,
  limits: {
    fileSize: IMAGE_MAX_BYTES,
    files: 10,
    ...MULTIPART_LIMITS,
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname !== "imageFile") return cb(null, false);
    return makeFilter(IMAGE_MIME)(req, file, cb);
  },
});

/*
 * Optional profile photo. `.single("imageFile")` aborts the whole request if
 * any other file part is present (LIMIT_UNEXPECTED_FILE). Flow 2 onboarding
 * sends ~42 text fields and sometimes a photo; a stray file part must not
 * throw away the answers. `.any()` plus picking imageFile keeps the photo
 * optional and ignores extras.
 */
export const uploadProfilePhoto = (req, res, next) => {
  profileUpload.any()(req, res, (err) => {
    if (err) return next(err);
    const files = Array.isArray(req.files) ? req.files : [];
    req.file = files.find((file) => file.fieldname === "imageFile");
    next();
  });
};

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
    console.error("[upload]", err.code || err.name, err.field || "", err.message);
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "That file is too large. Please compress it and try again."
        : err.code === "LIMIT_FILE_TYPE"
          ? err.message
          : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
            ? "Too many files uploaded."
            : err.code === "LIMIT_FIELD_COUNT" || err.code === "LIMIT_PART_COUNT"
              ? "Too many profile fields in this upload. Please try again."
              : err.code === "LIMIT_FIELD_VALUE"
                ? "A profile field is too large to upload. Please shorten it and try again."
                : err.message || "Invalid upload.";
    return res.status(400).json({ message });
  }

  return next(err);
};
