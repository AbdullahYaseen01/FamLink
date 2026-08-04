import express from 'express'
import Blogs from '../Schema/blogs.js' // Assuming you have the blog schema
import { authMiddleware } from '../Services/utils/middlewareAuth.js'
import { upload } from '../Services/utils/uploadMiddleware.js'
import {
  createLocalUrlForFile,
  createPublicUrlForFile
} from '../Services/utils/upload.js'
import User from '../Schema/user.js'
import fs from 'fs'
import { sendEmail } from '../Services/email/email.js'
import { uniqueSlug, looksLikeObjectId } from '../Services/utils/blogSlug.js'
import { sanitizeHtml } from '../Services/utils/sanitizeHtml.js'
import uploadImage from '../Services/utils/uplaodImage.js'

const router = express.Router()

// Admin gate, in one place. Every write route below repeated the same four
// lines; one of them is now also responsible for emailing every member on the
// platform, which is not a check worth leaving to copy-paste.
const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('type').lean()
    if (!user || user.type !== 'Admin') {
      return res.status(403).json({ message: 'Access denied.' })
    }
    return next()
  } catch (error) {
    console.error('blog admin check failed:', error)
    return res.status(500).json({ message: 'Could not verify admin access' })
  }
}

// PATCH /blogs/publish/:id — flip between draft and live.
//
// This is also where the "new resource" email goes out, and it fires only on
// the FIRST time an article goes live (publishedAt still null). It used to be
// sent from /create, which meant starting a draft mailed every member on the
// platform about an article nobody could read yet — and saving that draft again
// mailed them a second time.
router.patch("/publish/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id: blogId } = req.params;

    const blog = await Blogs.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const goingLive = blog.isDraft === true;
    const firstPublish = goingLive && !blog.publishedAt;

    blog.isDraft = !blog.isDraft;
    // Stamped once and kept. Unpublishing and republishing must not re-date the
    // article, or its position in the resources list silently jumps to the top.
    if (goingLive && !blog.publishedAt) blog.publishedAt = new Date();
    // A slug is needed the moment it becomes reachable by URL. Blogs created
    // before slugs existed have none, so mint one on the way out the door.
    if (goingLive && !blog.slug) blog.slug = await uniqueSlug(blog.title, blog._id);

    await blog.save();

    if (firstPublish) {
      // Never let a mail failure fail the publish — the article is live either
      // way, and an admin retrying would only double-send.
      notifyUsersAboutNewBlog(blog.title, blog.category).catch((err) =>
        console.error("New blog notification failed:", err?.message || err)
      );
    }

    return res.status(200).json({
      blog,
      message: goingLive
        ? `"${blog.title}" is now live 🎉`
        : `"${blog.title}" has been unpublished`,
    });
  } catch (err) {
    console.error("🔥 Error publishing blog:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.patch("/edit", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { _id, title, excerpt, content, category, featuredImage, isDraft } = req.body;

    const blog = await Blogs.findById(_id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (title !== undefined) blog.title = title;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    // Cleaned on the way in, once, because the public article page renders this
    // with dangerouslySetInnerHTML. One writer behind the admin gate, every
    // reader covered — see Services/utils/sanitizeHtml.js.
    if (content !== undefined) blog.content = sanitizeHtml(content);
    if (category !== undefined) blog.category = category;
    if (featuredImage !== undefined) blog.featuredImage = featuredImage;
    if (isDraft !== undefined) blog.isDraft = isDraft;

    // Mint a slug if it never had one. Deliberately NOT regenerated from a
    // changed title: the address is already in the weekly resources email and
    // in Google's index, and moving it breaks both.
    if (!blog.slug) blog.slug = await uniqueSlug(blog.title, blog._id);

    await blog.save();

    return res.status(200).json({
      blog,
      message: `"${blog.title}" saved`,
    });
  } catch (err) {
    console.error("🔥 Error editing blog:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /blogs/cover   multipart, field name "image"   → { url }
//
// The cover picture for a resource article, uploaded to Cloudinary and returned
// as a URL for the composer to store on the blog.
//
// Deliberately decoupled from creating or saving the article: an author picks
// the cover before the piece has an id, and making the upload part of the save
// would mean either holding the file in browser memory until then or refusing
// to let them choose one until after the first save. The endpoint hands back a
// URL; whether it is ever attached to anything is the composer's business.
//
// `upload.single` uses memory storage (Services/utils/uploadMiddleware.js), so
// the file never touches this machine's disk.
router.post(
  "/cover",
  authMiddleware,
  adminOnly,
  upload.single("image"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No image was uploaded." });
      }

      // Checked here rather than in a multer fileFilter so the caller gets a
      // JSON message they can show, instead of multer's error surfacing as a
      // generic 500.
      if (!/^image\/(jpe?g|png|webp|gif|avif)$/i.test(file.mimetype || "")) {
        return res.status(400).json({
          message: "That file isn't an image. Use a JPG, PNG, WebP, GIF or AVIF.",
        });
      }

      const MAX_BYTES = 8 * 1024 * 1024;
      if (file.size > MAX_BYTES) {
        return res.status(400).json({
          message: "That image is over 8MB. Please compress it and try again.",
        });
      }

      // A fresh public id per upload rather than one keyed to the blog.
      //
      // Overwriting a fixed id would leave the old picture cached in the CDN and
      // in readers' browsers under a URL that now means something else — the
      // classic "I changed the image and it didn't change" report. A new id
      // means a new URL, so a replacement is visible immediately.
      const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const url = await uploadImage(file.buffer, stamp, "blog_cover_");

      return res.status(200).json({ url, message: "Cover image uploaded." });
    } catch (error) {
      console.error("🔥 Blog cover upload failed:", error);
      return res.status(500).json({ message: "Could not upload the image." });
    }
  }
);

router.post("/create", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, excerpt, content, category, featuredImage, isDraft } = req.body;

    if (!title || !excerpt || !content || !category) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    const newBlog = new Blogs({
      title,
      excerpt,
      content: sanitizeHtml(content),
      category,
      // New articles start as drafts unless explicitly published, so writing one
      // is never the same action as announcing it.
      isDraft: isDraft === false ? false : true,
      featuredImage,
      slug: await uniqueSlug(title),
      publishedAt: isDraft === false ? new Date() : null,
    });

    await newBlog.save();

    // Only if it was created already-live. A draft announces nothing.
    if (newBlog.isDraft === false) {
      notifyUsersAboutNewBlog(newBlog.title, newBlog.category).catch((err) =>
        console.error("New blog notification failed:", err?.message || err)
      );
    }

    return res.status(201).json({
      message: "Blog post created successfully",
      blog: newBlog,
    });
  } catch (err) {
    console.error("🔥 Error creating blog:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Every blog, drafts included — the admin list.
router.get("/get-blogs", authMiddleware, adminOnly, async (req, res) => {
  try {
    const blogs = await Blogs.find().sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Blogs fetched successfully",
      blogs,
    });
  } catch (err) {
    console.error("🔥 Error fetching blogs:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});



// router.post(
//   '/',
//   authMiddleware,
//   upload.array('images', 10),
//   async (req, res) => {
//     const id = req.userId

//     try {
//       // Fetch user by ID
//       const user = await User.findById(id)
//       if (!user) {
//         return res.status(404).json({ message: 'User not found' })
//       }

//       // Check if the user is an admin
//       if (user.type !== 'Admin') {
//         return res
//           .status(403)
//           .json({ message: 'Access denied. Only Admins can create blogs.' })
//       }

//       const { name, category, description } = req.body

//       // Validate required fields
//       if (!name || !category || !description) {
//         return res
//           .status(400)
//           .json({ message: 'Name, category, and description are required' })
//       }

//       const imageUrls = []

//       // Handle image uploads
//       if (req.files && req.files.length > 0) {
//         req.files.forEach(file => {
//           const filePath = createPublicUrlForFile(req, file) // Generate public URL for the file
//           imageUrls.push(filePath) // Add file path to images array
//         })
//       }

//       // Create new blog
//       const blog = new Blogs({
//         name,
//         category,
//         description,
//         images: imageUrls,
//         createdAt: new Date()
//       })

//       // Save blog to database
//       await blog.save()

//       await notifyUsersAboutNewBlog(name, category)

//       return res
//         .status(201)
//         .json({ message: 'Blog created successfully', blog })
//     } catch (error) {
//       return res.status(500).json({ message: error.message })
//     }
//   }
// )


async function notifyUsersAboutNewBlog(blogName, blogCategory) {
  try {
    // Fetch all users who are not Admins and have opted into email notifications
    const users = await User.find({
      type: { $ne: 'Admin' }, // Exclude Admin users
      'notifications.email.newsletter': { $ne: false } // Only users who haven't opted out
    })

    for (const user of users) {
      // Determine the correct link based on user type
      let blogLink = 'https://famylink.us/blogs' // Default link
      if (user.type === 'Nanny') {
        blogLink = 'https://famylink.us/nanny/tipsAndArticles'
      } else if (user.type === 'Parents') {
        blogLink = 'https://famylink.us/family/tipsAndArticles'
      }

      sendEmail(
        user.email,
        `🆕 New Blog Post in ${blogCategory}!`,
        `<div style="padding: 12px">
          <h2 style="color: #14558F;">New Blog: ${blogName}</h2>
          <p>A new blog has been posted in the <strong>${blogCategory}</strong> category. 🎉</p>
          <p>Check it out now and stay updated with the latest tips and tricks!</p>
          <br>
          <a href="${blogLink}" style="padding: 10px 15px; background: #F98300; color: white; text-decoration: none; border-radius: 5px;">Read Blog</a>
          <br><br>
          <p style="font-size: 14px; color: #555;">
            Need help? Contact us at <a href="mailto:info@famylink.us">info@famylink.us</a>
          </p>
        </div>`
      )
    }
  } catch (error) {
    console.error('Error sending blog notification emails:', error)
  }
}



router.delete('/:id', authMiddleware, async (req, res) => {
  const userId = req.userId
  const { id: blogId } = req.params

  try {
    // Fetch user by ID
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if the user is an admin
    if (user.type !== 'Admin') {
      return res
        .status(403)
        .json({ message: 'Access denied. Only Admins can delete blogs.' })
    }

    // Find the blog by ID
    const blog = await Blogs.findById(blogId)
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' })
    }

    // // Check if images are used by other blogs
    // if (Array.isArray(blog.images) && blog.images.length > 0) {
    //   for (const imageUrl of blog.images) {
    //     const isImageUsedElsewhere = await Blogs.findOne({
    //       _id: { $ne: blogId }, // Exclude the current blog
    //       images: imageUrl
    //     })

    //     if (!isImageUsedElsewhere) {
    //       // Convert the image URL to a local file path
    //       const localFilePath = createLocalUrlForFile(imageUrl)

    //       // If the file exists, delete it
    //       if (fs.existsSync(localFilePath)) {
    //         fs.unlinkSync(localFilePath)
    //       }
    //     }
    //   }
    // }

    // Delete the blog
    await blog.deleteOne()

    return res
      .status(200)
      .json({ blog: blog, message: `The blog titled "${blog.title}" is deleted successfully` })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

router.put('/:id', authMiddleware, upload.array('images', 10), async (req, res) => {
  const userId = req.userId;
  const { id: blogId } = req.params;
  const { name, category, description, images } = req.body;

  try {
    // Fetch user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is an admin
    if (user.type !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Only Admins can edit blogs.' });
    }

    // Find the blog by ID
    const blog = await Blogs.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Ensure at least one image is available (either from the existing blog or the request)
    if (!req.files || req.files.length === 0) {
      if (!blog.images || blog.images.length === 0) {
        return res.status(400).json({ message: 'At least one image is required.' });
      }
    }

    // Process images: check if 'images' in body is an array or string (for URLs)
    const providedImages = Array.isArray(images) ? images : images ? [images] : [];

    // Prepare new images list
    const updatedImages = [];

    // Add provided images that are already part of the blog
    blog.images.forEach((existingImage) => {
      if (providedImages.includes(existingImage)) {
        updatedImages.push(existingImage);
      }
    });

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const filePath = createPublicUrlForFile(req, file);
        updatedImages.push(filePath); // Add newly uploaded image paths
      });
    }

    // Ensure there is at least one image after processing
    if (updatedImages.length === 0) {
      return res.status(400).json({ message: 'At least one image must be provided or retained.' });
    }

    // Find images to delete
    const imagesToDelete = blog.images.filter(
      (existingImage) => !updatedImages.includes(existingImage)
    );

    // Delete unused images
    for (const imageUrl of imagesToDelete) {
      const isImageUsedElsewhere = await Blogs.findOne({
        _id: { $ne: blogId }, // Exclude the current blog
        images: imageUrl,
      });

      if (!isImageUsedElsewhere) {
        const localFilePath = createLocalUrlForFile(imageUrl);

        // If the file exists, delete it
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      }
    }

    // Update the blog's images
    blog.images = updatedImages;

    // Update other fields
    if (name !== undefined) blog.name = name;
    if (category !== undefined) blog.category = category;
    if (description !== undefined) blog.description = description;
    blog.createdAt = new Date()

    // Save the updated blog
    await blog.save();

    return res.status(200).json({ message: 'Blog updated successfully', blog });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
});


router.get('', async (req, res) => {
  try {
    const { category, limit, page } = req.query;
    // Default pagination values
    const pageSize = parseInt(limit) || 10; // Number of blogs per page
    const currentPage = parseInt(page) || 1; // Current page
    const skip = (currentPage - 1) * pageSize; // Calculate items to skip

    // Published only.
    //
    // This route is unauthenticated and feeds the public resources page, and it
    // used to return drafts alongside live articles — so an unfinished piece was
    // readable by anyone the moment it was saved, and appeared in the resources
    // list. Drafts are reachable through /blogs/get-blogs, which is behind the
    // admin gate.
    const filter = { isDraft: false };
    if (category) {
      filter.category = category; // Filter by category if provided
    }

    // Fetch blogs with pagination and filter
    const blogs = await Blogs.find(filter)
      .skip(skip)
      .limit(pageSize)
      // Newest published first, falling back to creation date for the articles
      // that predate `publishedAt`.
      .sort({ publishedAt: -1, createdAt: -1 })

    // Fetch total count of blogs for pagination metadata
    const totalCount = await Blogs.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(200).json({
      status: 200,
      data: blogs,
      pagination: {
        totalRecords: totalCount,
        totalPages,
        currentPage,
        limit: pageSize,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: err.message,
    });
  }
});

// GET /blog/category/:category
router.get('/category/:category', async (req, res) => {
  const { category } = req.params;
  try {
    const blogs = await Blogs.find({ category });
    res.status(200).json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET /blogs/:idOrSlug
//
// Accepts either, because both are already out in the world: the three original
// resources are linked by slug from the site and from Google, and everything
// the CMS published before slugs existed is linked by Mongo id from the weekly
// resources email.
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Slug first. An id-shaped string can't be a slug, but a slug lookup is the
    // common case now, and trying findById on a non-id string throws a CastError
    // rather than returning null.
    const blog = looksLikeObjectId(id)
      ? await Blogs.findById(id)
      : await Blogs.findOne({ slug: String(id).toLowerCase() });

    if (!blog) {
      return res.status(404).send({
        status: 404,
        message: 'Blog not found',
      });
    }

    // A draft is not public. Same 404 as a missing article rather than a 403, so
    // this can't be used to discover that an unpublished piece exists.
    if (blog.isDraft) {
      return res.status(404).send({
        status: 404,
        message: 'Blog not found',
      });
    }

    // Fetch blogs with the same category, excluding the current one
    const relatedBlogs = await Blogs.find({
      category: blog.category,
      isDraft: false,
      _id: { $ne: blog._id }, // Exclude the current blog
    });

    return res.status(200).send({
      status: 200,
      message: 'Blog fetched successfully',
      data: {
        blog,
        relatedBlogs,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: 'An error occurred while fetching the blog',
      error: error.message,
    });
  }
});

export default router
