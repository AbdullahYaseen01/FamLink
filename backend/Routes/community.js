import express from 'express'
import Community from '../Schema/community.js'
import User from '../Schema/user.js' // Path to your Community model
import { authMiddleware } from '../Services/utils/middlewareAuth.js'
import Notification from '../Schema/notificaion.js'
import mongoose from "mongoose";
import { upload } from '../Services/utils/uploadMiddleware.js'
import uploadImage from '../Services/utils/uplaodImage.js'
import { USER_IDENTITY_SELECT } from '../Services/utils/userPrivacy.js'

const router = express.Router()

// Create Community API
router.post('', authMiddleware, async (req, res) => {
  const { name, description } = req.body
  const id = req.userId
  const user = await User.findById(id)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  // Check if the user is an admin
  if (user.type !== 'Admin') {
    return res
      .status(403)
      .json({ message: 'Access denied. Only Admins can create blogs.' })
  }

  // Validate the required fields
  if (!name || !description) {
    return res
      .status(400)
      .json({ message: 'Name and description are required fields' })
  }

  try {
    // Create a new community instance
    const community = new Community({
      name,
      createdBy: id,
      description,
      topics: [] // Initially empty topics
    })
    // Save the new community
    await community.save()
    return res.status(201).json({
      community: { id: community._id, name: community.name },
      message: 'Community created successfully'
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// Fetch all posts with metadata: community name, topic name, all communities, all topics
router.get("/all-posts", authMiddleware, async (req, res) => {
  const userId = req.userId;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.type !== "Admin") {
    return res.status(403).json({
      message: "Access denied. Only Admins can access this resource.",
    });
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch all communities with their topics and posts
    const communities = await Community.find({}, { name: 1, topics: 1 }).lean();

    const allPosts = [];
    const allCommunities = [];
    const allTopics = new Map(); // To avoid duplicates

    for (const community of communities) {
      allCommunities.push({ id: community._id, name: community.name });

      for (const topic of community.topics || []) {
        allTopics.set(topic._id.toString(), { id: topic._id, name: topic.name });

        for (const post of topic.posts || []) {
          allPosts.push({
            post,
            topicName: topic.name,
            communityName: community.name,
          });
        }
      }
    }

    // Sort all posts by newest
    const sortedPosts = allPosts.sort(
      (a, b) => new Date(b.post.createdAt) - new Date(a.post.createdAt)
    );

    const paginatedPosts = sortedPosts.slice(skip, skip + limit);

    // Optionally populate createdBy user’s first/last name (if needed):
    const userIds = paginatedPosts.map((p) => p.post.createdBy).filter(Boolean);
    const usersMap = {};

    const users = await User.find({ _id: { $in: userIds } }, "firstName lastName").lean();
    for (const u of users) {
      usersMap[u._id.toString()] = { firstName: u.firstName, lastName: u.lastName };
    }

    const enrichedPosts = paginatedPosts.map((item) => ({
      ...item,
      createdBy:
        item.post.createdBy && usersMap[item.post.createdBy.toString()]
          ? usersMap[item.post.createdBy.toString()]
          : null,
    }));

    return res.status(200).json({
      data: enrichedPosts,
      allCommunities,
      allTopics: Array.from(allTopics.values()),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(sortedPosts.length / limit),
        totalItems: sortedPosts.length,
      },
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



router.post('/:commId/topic', authMiddleware, async (req, res) => {
  console.log("BODY:", req.body);
  const { commId } = req.params // Community ID from the URL
  const { name, description } = req.body // Topic details from the request body

  const id = req.userId
  const user = await User.findById(id)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  // Check if the user is an admin
  if (user.type !== 'Admin') {
    return res
      .status(403)
      .json({ message: 'Access denied. Only Admins can create blogs.' })
  }

  // Validate the required fields
  if (!name || !description) {
    return res
      .status(400)
      .json({ message: 'Name and description are required fields' })
  }

  // Validate the required fields
  if (!name || !description) {
    return res
      .status(400)
      .json({ message: 'Name and description are required for the topic' })
  }

  try {
    // Find the community by ID
    const community = await Community.findById(commId)

    if (!community) {
      return res.status(404).json({ message: 'Community not found' })
    }

    const topicExists = community.topics.some(
      topic => topic.name.toLowerCase() === name.toLowerCase()
    )

    if (topicExists) {
      return res.status(400).json({
        message: `A topic with the name '${name}' already exists in this community.`
      })
    }

    // Add the new topic to the beginning of the topics array
    const newTopic = { name, description, createdBy: id }
    community.topics.unshift(newTopic)

    // Save the updated community
    await community.save()

    return res.status(200).json({
      message: 'Topic added successfully to the community',
      topic: { id: newTopic._id, name: newTopic.name }
    })
  } catch (error) {
    console.error('Error adding topic:', error)
    return res.status(500).json({ message: error.message })
  }
})

router.post(
  '/:commId/topic/:topicId/post',
  authMiddleware,
  async (req, res) => {
    const { commId, topicId } = req.params // Community and Topic IDs from the URL
    const { description } = req.body // Post details from the request body
    const userId = req.userId // Extract user ID from the authenticated token

    try {
      // Validate the description
      if (!description) {
        return res
          .status(400)
          .json({ message: 'Description is required for the post' })
      }

      // Fetch the user to check their role
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      // Check if the user is an admin
      if (user.type !== 'Admin') {
        return res
          .status(403)
          .json({ message: 'Access denied. Only admins can create posts.' })
      }

      // Find the community by ID
      const community = await Community.findById(commId)
      if (!community) {
        return res.status(404).json({ message: 'Community not found' })
      }

      // Find the topic within the community
      const topic = community.topics.id(topicId)
      if (!topic) {
        return res.status(404).json({ message: 'Topic not found' })
      }

      // Create a new post object
      const newPost = {
        description,
        createdBy: userId // Store the admin's ID as the creator
      }

      // Add the new post to the beginning of the posts array
      topic.posts.unshift(newPost)

      // Save the updated community document
      await community.save()

      res.status(201).json({
        message: 'Post added successfully to the topic',
        post: newPost,
        topic
      })
    } catch (error) {
      console.error('Error adding post to topic:', error)
      res.status(500).json({ message: error.message })
    }
  }
)

router.put('/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params // Only Post ID from the URL
  const { description } = req.body
  const userId = req.userId // Extract user ID from the authenticated token

  try {
    // Find the post across all communities and topics
    const community = await Community.findOne({ 'topics.posts._id': postId })

    if (!community) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Find the topic containing the post
    const topic = community.topics.find(t => t.posts.id(postId))

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' })
    }

    // Find the post by ID
    const post = topic.posts.id(postId)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if the logged-in user is an admin
    if (user.type !== 'Admin') {
      return res
        .status(403)
        .json({ message: 'Access denied. Only Admins can edit posts.' })
    }

    // Update the post description
    post.description = description

    // Save the updated community
    await community.save()

    res.status(200).json({
      message: 'Post updated successfully',
      post
    })
  } catch (error) {
    console.error('Error updating post:', error)
    res
      .status(500)
      .json({ message: 'Error updating post', error: error.message })
  }
})

router.delete('/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params // Only Post ID from the URL
  const userId = req.userId // Extract user ID from the authenticated token

  try {
    // Find the post across all communities and topics
    const community = await Community.findOne({ 'topics.posts._id': postId })

    if (!community) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Find the topic containing the post
    const topic = community.topics.find(t => t.posts.id(postId))

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' })
    }

    // Find the post by ID
    const post = topic.posts.id(postId)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if the logged-in user is an admin
    // if (user.type !== 'Admin') {
    //   return res
    //     .status(403)
    //     .json({ message: 'Access denied. Only Admins can delete posts.' })
    // }

    // Remove the post from the topic
    topic.posts.pull(postId)

    // Save the updated community
    await community.save()

    res.status(200).json({
      message: 'Post deleted successfully',
      postId: postId
    })
  } catch (error) {
    console.error('Error deleting post:', error)
    res
      .status(500)
      .json({ message: 'Error deleting post', error: error.message })
  }
})

router.delete('/:postId/comment/:commentId', authMiddleware, async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.userId;
  console.log(req.params)

  try {
    // Find the community with the given post ID
    const community = await Community.findOne({ 'topics.posts._id': postId });

    if (!community) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Find the topic containing the post
    const topic = community.topics.find(t => t.posts.id(postId));
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Find the post
    const post = topic.posts.id(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Find the comment
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Get the logged-in user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow Admin or original comment creator to delete
    const isOwner = comment.user.toString() === userId;
    const isAdmin = user.type === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: 'Access denied. Only the comment owner or an Admin can delete this comment.'
      });
    }

    // Remove the comment
    post.comments.pull(commentId);

    // Save the updated document
    await community.save();

    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    return res.status(500).json({
      message: 'Error deleting comment',
      error: err.message
    });
  }
});


router.post('/:postId/like', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const userId = req.userId;

  try {
    const community = await Community.findOne({ 'topics.posts._id': postId });
    if (!community) return res.status(404).json({ message: 'Post not found' });

    const topic = community.topics.find(t =>
      t.posts.some(p => p._id.toString() === postId)
    );
    const post = topic.posts.find(p => p._id.toString() === postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.likes.includes(userId)) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
      post.dislikes.pull(userId); // remove from dislikes if present
    }

    await community.save();

    res.status(200).json({
      message: "Post like toggled",
      likes: post.likes.length,
      dislikes: post.dislikes.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});





router.post('/:postId/dislike', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const userId = req.userId;

  try {
    const community = await Community.findOne({ 'topics.posts._id': postId });
    if (!community) return res.status(404).json({ message: 'Post not found' });

    const topic = community.topics.find(t =>
      t.posts.some(p => p._id.toString() === postId)
    );
    const post = topic.posts.find(p => p._id.toString() === postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.dislikes.includes(userId)) {
      post.dislikes.pull(userId);
    } else {
      post.dislikes.push(userId);
      post.likes.pull(userId); // remove from likes if present
    }

    await community.save();

    res.status(200).json({
      message: "Post dislike toggled",
      likes: post.likes.length,
      dislikes: post.dislikes.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});




router.post('/:postId/comment', authMiddleware, async (req, res) => {
  const { postId } = req.params // Post ID from the URL
  const { comment, isAnonymous } = req.body // Comment details from the request body
  const userId = req.userId // Extract user ID from the authenticated token
  console.log('comment anonymous', comment, isAnonymous)

  // Validate input
  if (!comment || typeof comment !== 'string') {
    return res
      .status(400)
      .json({ message: 'Comment is required and must be a string' })
  }

  try {
    // Find the community containing the post
    const community = await Community.findOne({
      'topics.posts._id': postId // Match postId in nested structure
    })

    if (!community) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Find the topic containing the post
    const topic = community.topics.find(t =>
      t.posts.some(p => p._id.toString() === postId)
    )

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' })
    }

    // Find the post by ID
    const post = topic.posts.id(postId)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }
    // const ANONYMOUS_USER_ID = new mongoose.Types.ObjectId("000000000000000000000000");
    // Add the new comment
    const newComment = {
      user: userId, // Associate the comment with the logged-in user
      isAnonymous: isAnonymous,
      comment,
      createdAt: new Date()
    }
    post.comments.unshift(newComment) // Add comment to the post's comments array

    // Save changes
    await community.save()

    const latestCommentId = post.comments[0]._id;

    res.status(200).json({
      message: 'Comment added successfully',
      comment: {
        _id: latestCommentId,
        ...newComment,
      },
    });
  } catch (error) {
    console.error('Error adding comment:', error)
    res
      .status(500)
      .json({ message: 'Internal server error', error: error.message })
  }
})

router.put('/:postId/comment/:commentId', authMiddleware, async (req, res) => {
  const { postId, commentId } = req.params // Post ID and Comment ID from the URL
  const { comment } = req.body // New comment text from the request body
  const userId = req.userId // Extract user ID from the authenticated token
  // Validate input
  if (!comment || typeof comment !== 'string') {
    return res
      .status(400)
      .json({ message: 'Comment is required and must be a string' })
  }

  try {
    // Find the community containing the post
    const community = await Community.findOne({
      'topics.posts._id': postId // Match postId in nested structure
    })

    if (!community) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Find the topic containing the post
    const topic = community.topics.find(t =>
      t.posts.some(p => p._id.toString() === postId)
    )

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' })
    }

    // Find the post by ID
    const post = topic.posts.id(postId)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Find the comment by ID
    const commentToEdit = post.comments.id(commentId)

    if (!commentToEdit) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // Check if the logged-in user is the owner of the comment
    if (commentToEdit.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to edit this comment' })
    }

    // Update the comment
    commentToEdit.comment = comment

    // Save changes
    await community.save()

    res.status(200).json({
      message: 'Comment updated successfully',
      updatedComment: commentToEdit
    })
  } catch (error) {
    console.error('Error editing comment:', error)
    res
      .status(500)
      .json({ message: 'Internal server error', error: error.message })
  }
})

router.delete(
  '/:postId/comment/:commentId',
  authMiddleware,
  async (req, res) => {
    const { postId, commentId } = req.params // Post ID and Comment ID from the URL
    const userId = req.userId // Extract user ID from the authenticated token

    try {
      // Find the community containing the post
      const community = await Community.findOne({
        'topics.posts._id': postId // Match postId in nested structure
      })

      if (!community) {
        return res.status(404).json({ message: 'Post not found' })
      }

      // Find the topic containing the post
      const topic = community.topics.find(t =>
        t.posts.some(p => p._id.toString() === postId)
      )

      if (!topic) {
        return res.status(404).json({ message: 'Topic not found' })
      }

      // Find the post by ID
      const post = topic.posts.id(postId)

      if (!post) {
        return res.status(404).json({ message: 'Post not found' })
      }

      // Find the comment by ID
      const commentToDelete = post.comments.id(commentId)

      if (!commentToDelete) {
        return res.status(404).json({ message: 'Comment not found' })
      }

      const user = await User.findById(userId)

      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      // Check if the logged-in user is the owner of the comment or an admin
      if (commentToDelete.user.toString() !== userId && user.type !== 'Admin') {
        return res
          .status(403)
          .json({ message: 'You are not authorized to delete this comment' })
      }
      // Remove the comment
      post.comments.pull(commentId)

      // Save the changes to the community document
      await community.save()

      const noti = await Notification.findOneAndDelete({
        senderId: userId,
        commentId,
        content: 'comment',
      });
      console.log(noti)
      res.status(200).json({
        message: 'Comment deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting comment:', error)
      res
        .status(500)
        .json({ message: 'Internal server error', error: error.message })
    }
  }
)

router.post('/:commentId/commLike', authMiddleware, async (req, res) => {
  const { commentId } = req.params // Get comment ID from URL
  const userId = req.userId // Extract user ID from the authenticated token

  try {
    // Find the post containing the comment

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const community = await Community.findOne({
      'topics.posts.comments._id': commentId
    })

    if (!community) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // Locate the comment
    const topic = community.topics.find(t =>
      t.posts.some(p => p.comments.id(commentId))
    )
    const post = topic.posts.find(p => p.comments.id(commentId))
    const comment = post.comments.id(commentId)

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // Check if the user has already liked the comment
    if (comment.likes.includes(userId)) {
      // Remove like
      comment.likes.pull(userId)
    } else {
      // Add like and remove from dislikes if present
      comment.likes.unshift(userId)
      comment.dislikes.pull(userId)
    }

    // Save changes
    await community.save()

    res.status(200).json({
      message: 'Comment liked successfully',
      likes: comment.likes.length,
      dislikes: comment.dislikes.length
    })
  } catch (error) {
    console.error('Error liking comment:', error)
    res
      .status(500)
      .json({ message: 'Error liking comment', error: error.message })
  }
})

router.post('/:commentId/commDislike', authMiddleware, async (req, res) => {
  const { commentId } = req.params // Get comment ID from URL
  const userId = req.userId // Extract user ID from the authenticated token

  try {
    // Find the post containing the comment

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const community = await Community.findOne({
      'topics.posts.comments._id': commentId
    })

    if (!community) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // Locate the comment
    const topic = community.topics.find(t =>
      t.posts.some(p => p.comments.id(commentId))
    )
    const post = topic.posts.find(p => p.comments.id(commentId))
    const comment = post.comments.id(commentId)

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // Check if the user has already disliked the comment
    if (comment.dislikes.includes(userId)) {
      // Remove dislike
      comment.dislikes.pull(userId)
    } else {
      // Add dislike and remove from likes if present
      comment.dislikes.unshift(userId)
      comment.likes.pull(userId)
    }

    // Save changes
    await community.save()

    res.status(200).json({
      message: 'Comment disliked successfully',
      likes: comment.likes.length,
      dislikes: comment.dislikes.length
    })
  } catch (error) {
    console.error('Error disliking comment:', error)
    res
      .status(500)
      .json({ message: 'Error disliking comment', error: error.message })
  }
})

router.get('', async (req, res) => {
  try {
    const { category, limit, page } = req.query
    // Default pagination values
    const pageSize = parseInt(limit) || 10 // Number of blogs per page
    const currentPage = parseInt(page) || 1 // Current page
    const skip = (currentPage - 1) * pageSize // Calculate items to skip

    // Build the query filter
    const filter = {}
    if (category) {
      filter.name = category // Filter by category if provided
    }

    // Fetch blogs with pagination and filter
    const community = await Community.find(filter)
      .populate({
        path: 'topics.posts.comments.user', // Populate user details
        select: USER_IDENTITY_SELECT // a byline, not a contact card
      })
      .skip(skip)
      .limit(pageSize)
      .sort({ _id: -1 })
    // Exclude internal Mongoose fields like `__v`

    // Fetch total count of blogs for pagination metadata
    const totalCount = await Community.countDocuments(filter)
    const totalPages = Math.ceil(totalCount / pageSize)

    res.status(200).json({
      status: 200,
      data: community,
      pagination: {
        totalRecords: totalCount,
        totalPages,
        currentPage,
        limit: pageSize
      }
    })
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: err.message
    })
  }
})

router.get('/allComm', async (req, res) => {
  try {
    const { category } = req.query
    // Default pagination values

    // Build the query filter
    const filter = {}
    if (category) {
      filter.name = category // Filter by category if provided
    }

    // Fetch blogs with pagination and filter
    const community = await Community.find(filter)
      .populate({
        path: 'topics.posts.comments.user', // Populate user details
        select: USER_IDENTITY_SELECT // a byline, not a contact card
      })
      .sort({ _id: -1 })
    // Exclude internal Mongoose fields like `__v`

    // Fetch total count of blogs for pagination metadata
    const totalCount = await Community.countDocuments(filter)

    res.status(200).json({
      status: 200,
      data: community
    })
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: err.message
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Fetch the community by its ID
    const community = await Community.findById(id).populate({
      path: 'topics.posts.comments.user', // Populate user details
      select: USER_IDENTITY_SELECT // a byline, not a contact card
    })

    if (!community) {
      return res.status(404).json({
        status: 404,
        message: 'Community not found'
      })
    }

    res.status(200).json({
      status: 200,
      data: community
    })
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: err.message
    })
  }
})

// POST /community/:postId/comments/:commentId/replies
router.post("/:postId/comments/:commentId/replies", authMiddleware, async (req, res) => {
  const { postId, commentId } = req.params;
  const { reply, isAnonymous } = req.body;
  const userId = req.userId;

  // console.log("Commenting to post with postId:", postId);
  // console.log("Commenting to commentId with commentId:", commentId);
  // console.log("Comment:", reply);
  // console.log("Reply annonymous:", isAnonymous)
  // console

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const community = await Community.findOne({ "topics.posts._id": postId });
    if (!community) return res.status(404).json({ error: "Post not found" });

    let foundPost = null;

    for (const topic of community.topics) {
      const post = topic.posts.id(postId);
      if (post) {
        foundPost = post;
        break;
      }
    }

    if (!foundPost) return res.status(404).json({ error: "Post not found in topics" });

    // Find the comment to reference
    const commentToNest = foundPost.comments.find(
      (c) => c._id.toString() === commentId
    );

    if (!commentToNest) return res.status(404).json({ error: "Target comment not found" });

    console.log("ReplyComment", commentToNest)

    // Construct a new top-level comment that nests the existing one
    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      comment: reply,
      isAnonymous: isAnonymous,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: [],
      dislikes: [],
      replies: [commentToNest.toObject()], // directly embedding the existing comment
    };

    foundPost.comments.push(newComment);

    community.markModified("topics");
    await community.save();

    res.status(201).json({
      message: "New comment created with nested existing comment",
      comment: newComment,
    });
  } catch (err) {
    console.error("Error creating nested comment:", err);
    res.status(500).json({ error: "Server error" });
  }
});



router.get('/:communityId/topics/:topicId', async (req, res) => {
  try {
    const { communityId, topicId } = req.params

    // Find the community by ID
    const community = await Community.findById(communityId).populate({
      path: 'topics.posts.comments.user', // Populate user details
      select: USER_IDENTITY_SELECT // a byline, not a contact card
    })

    if (!community) {
      return res.status(404).json({
        status: 404,
        message: 'Community not found'
      })
    }

    // Find the specific topic within the community's topics
    const topic = community.topics.id(topicId)

    if (!topic) {
      return res.status(404).json({
        status: 404,
        message: 'Topic not found in the specified community'
      })
    }

    res.status(200).json({
      status: 200,
      data: topic
    })
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: err.message
    })
  }
})

router.get('/:postId/getPost', async (req, res) => {
  try {
    const { postId } = req.params

    // Find the community and get only the matching post
    const community = await Community.findOne({
      'topics.posts._id': postId // Match postId in nested structure
    }).populate({
      path: 'topics.posts.comments.user', // Populate user details for comments
      select: USER_IDENTITY_SELECT // a byline, not a contact card
    })

    if (!community) {
      return res.status(404).json({
        status: 404,
        message: 'Community not found'
      })
    }

    // Find the specific post within the community's topics
    const post = community.topics
      .flatMap(topic => topic.posts) // Flatten all posts from all topics
      .find(post => post._id.toString() === postId) // Find the specific post

    if (!post) {
      return res.status(404).json({
        status: 404,
        message: 'Post not found'
      })
    }

    res.status(200).json({
      status: 200,
      data: post // Return only the post
    })
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: err.message
    })
  }
})

router.post("/post", authMiddleware, upload.array("media", 5), async (req, res) => {
  try {
    const { topicId, description = "", anonymous } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!topicId || !description.trim())
      return res.status(400).json({ message: "Topic ID and description are required" });

    const community = await Community.findOne({ "topics._id": topicId });
    if (!community) return res.status(404).json({ message: "Topic not found" });

    const topic = community.topics.id(topicId);
    if (!topic) return res.status(404).json({ message: "Invalid topic ID" });

    // 🔽 Upload each file to Cloudinary
    const media = [];

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const url = await uploadImage(file.buffer, userId, `community_post_${Date.now()}_${i}`);
        media.push({
          url,
          type: file.mimetype.startsWith("image") ? "image" : "video",
        });
      }
    }

    const newPost = {
      description,
      createdBy: userId,
      isAnonymous: anonymous === "true" || anonymous === true,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: [],
      dislikes: [],
      comments: [],
      media,
    };

    topic.posts.unshift(newPost);
    topic.updatedAt = new Date();
    community.updatedAt = new Date();

    await community.save();

    res.status(201).json({
      message: "Post created successfully. Now you can view the post in your feed",
      post: topic.posts[0],
      topicId: topic._id,
      communityId: community._id,
    });
  } catch (error) {
    console.error("Error creating post with media:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



router.post('/:commentId/:replyId/replyLike', authMiddleware, async (req, res) => {
  const { commentId, replyId } = req.params;
  const userId = req.userId;

  try {
    const community = await Community.findOne({
      'topics.posts.comments._id': commentId,
    });

    if (!community) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Locate the topic and post
    const topic = community.topics.find(t =>
      t.posts.some(p => p.comments.id(commentId))
    );
    const post = topic.posts.find(p => p.comments.id(commentId));
    const comment = post.comments.id(commentId);

    // Find the reply
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // Toggle like/dislike logic
    if (reply.likes.includes(userId)) {
      reply.likes.pull(userId); // Unlike
    } else {
      reply.likes.unshift(userId); // Like
      reply.dislikes.pull(userId); // Remove from dislikes
    }

    await community.save();

    res.status(200).json({
      message: 'Reply like toggled successfully',
      likes: reply.likes.length,
      dislikes: reply.dislikes.length,
    });
  } catch (error) {
    console.error('Error liking reply:', error);
    res.status(500).json({ message: 'Error liking reply', error: error.message });
  }
});

router.post("/post/:postId/comment/:commentId/dislike", authMiddleware, async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.userId;

  try {
    const community = await Community.findOne({ 'topics.posts._id': postId });
    if (!community) return res.status(404).json({ message: "Post not found" });

    const topic = community.topics.find(t =>
      t.posts.some(p => p._id.toString() === postId)
    );
    const post = topic.posts.find(p => p._id.toString() === postId);
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.dislikes.includes(userId)) {
      comment.dislikes.pull(userId);
    } else {
      comment.dislikes.push(userId);
      comment.likes.pull(userId); // Remove from likes if present
    }

    await community.save();
    res.status(200).json({ message: "Comment dislike toggled", dislikes: comment.dislikes.length });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.post("/post/:postId/comment/:commentId/like", authMiddleware, async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.userId;

  try {
    const community = await Community.findOne({ 'topics.posts._id': postId });
    if (!community) return res.status(404).json({ message: "Post not found" });

    const topic = community.topics.find(t =>
      t.posts.some(p => p._id.toString() === postId)
    );
    const post = topic.posts.find(p => p._id.toString() === postId);
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.likes.includes(userId)) {
      comment.likes.pull(userId);
    } else {
      comment.likes.push(userId);
      comment.dislikes.pull(userId);
    }

    await community.save();
    res.status(200).json({ message: "Comment like toggled", likes: comment.likes.length });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// router.post('/:commentId/addReply', authMiddleware, async (req, res) => {
//   const { commentId } = req.params; // Parent comment or reply ID
//   const userId = req.userId; // Authenticated user's ID
//   const { replyText } = req.body; // Reply content
//   const maxDepth = 20
//   try {
//     // Find the user
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Find the community containing the comment or reply
//     let orConditions = [];
//     for (let i = 0; i < maxDepth; i++) {
//       let path = 'topics.posts.comments';
//       for (let j = 0; j < i; j++) {
//         path += '.replies';
//       }
//       path += '._id';

//       orConditions.push({ [path]: commentId });
//     }

//     // Find the community containing the comment or reply
//     const community = await Community.findOne({ $or: orConditions });

//     if (!community) {
//       return res.status(404).json({ message: 'Comment or reply not found' });
//     }

//     // Recursive function to find parent comment or reply
//     const findParent = (comments, id) => {
//       for (const comment of comments) {
//         if (comment._id.toString() === id) {
//           return comment;
//         }
//         if (comment.replies?.length) {
//           const nestedParent = findParent(comment.replies, id); // Recurse through replies
//           if (nestedParent) {
//             return nestedParent;
//           }
//         }
//       }
//       return null;
//     };

//     // Locate the topic, post, and parent comment or reply
//     const topic = community.topics.find(t =>
//       t.posts.some(p => findParent(p.comments, commentId))
//     );
//     const post = topic.posts.find(p => findParent(p.comments, commentId));

//     const parentComment = findParent(post.comments, commentId);

//     if (!parentComment) {
//       return res.status(404).json({ message: 'Parent comment or reply not found' });
//     }

//     // Ensure the parent comment or reply has a 'replies' array
//     if (!parentComment.replies) {
//       parentComment.replies = []; // Initialize the replies array if not already present
//     }

//     // Create a new reply object
//     const newReply = {
//       user: userId,
//       comment: replyText,
//       createdAt: new Date(),
//       replies: [], // Start with an empty array of replies for further nesting
//     };

//     // Add the new reply to the parent comment/reply
//     parentComment.replies.unshift(newReply);

//     // Save the community document with the updated replies
//     await community.save();

//     res.status(201).json({
//       message: 'Reply added successfully',
//       replies: parentComment.replies,
//     });
//   } catch (error) {
//     console.error('Error adding reply:', error);
//     res.status(500).json({ message: 'Error adding reply', error: error.message });
//   }
// });

export default router
