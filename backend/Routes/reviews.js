import express from "express";
import User from "../Schema/user.js";
import Booking from "../Schema/booking.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import { sendEmail } from "../Services/email/email.js";

const router = express.Router();


// router.post('/nanny', authMiddleware, async (req, res) => {
//     const userId = req.userId; // Current logged-in user (nanny)
//     const { bookingId, rating, msg } = req.body;

//     try {
//         // Step 1: Verify booking exists
//         const booking = await Booking.findById(bookingId).populate('familyId');
//         if (!booking) {
//             return res.status(404).json({ message: 'Booking not found' });
//         }

//         // Step 2: Check if the current user is the nanny associated with the booking
//         if (!booking.nannyId.equals(userId)) {
//             return res.status(403).json({ message: 'Unauthorized to submit review for this booking' });
//         }

//         // Step 3: Ensure the booking status is completed
//         if (booking.status !== 'completed') {
//             return res.status(400).json({ message: 'Review can only be submitted for completed bookings' });
//         }

//         // Step 4: Find the family user and check for existing review
//         const familyUser = await User.findById(booking.familyId._id);
//         if (!familyUser) {
//             return res.status(404).json({ message: 'Family user not found' });
//         }

//         if (!Array.isArray(familyUser.reviews)) {
//             familyUser.reviews = [];
//         }

//         // Check if a review from the current nanny already exists
//         const existingReview = familyUser.reviews.find(
//             (review) => review.bookingId.toString() === bookingId
//         );

//         if (existingReview) {
//             return res.status(400).json({ message: 'You have already submitted a review for this booking' });
//         }

//         // Step 5: Create review data object
//         const reviewData = {
//             userId,
//             rating,
//             msg,
//             bookingId,
//         };

//         // Add the new review at the start of the reviews array
//         familyUser.reviews.unshift(reviewData);

//         // Step 6: Update the nannyReview flag on the booking
//         booking.nannyReview = true;

//         // Save the updates
//         await familyUser.save();
//         await booking.save();

//         // Step 7: Send an email notification to the family with the review information
//         // await sendReviewEmail(familyUser.email, {
//         //     rating,
//         //     msg,
//         //     nannyName: req.user.name,  // Assuming user info is stored in auth middleware
//         // });

//         return res.status(200).json({ message: 'Review submitted and email sent successfully' });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'An error occurred while submitting the review' });
//     }
// });

router.post('/', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { bookingId, rating, msg, userType } = req.body;
  
    try {
      // Step 1: Find the booking and populate job details (which includes family)
      const booking = await Booking.findById(bookingId)
        .populate({
          path: 'jobId',
          populate: { path: 'user', model: 'users' }, // family user
        })
        .populate('requestBy'); // nanny user
  
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
  
      let reviewTargetUser;
  
      if (userType === 'nanny') {
        if (!booking.requestBy._id.equals(userId)) {
          return res.status(403).json({ message: 'Unauthorized to submit review for this booking' });
        }
  
        reviewTargetUser = await User.findById(booking.jobId.user._id); // target = family
  
        if (!reviewTargetUser) {
          return res.status(404).json({ message: 'Family user not found' });
        }
  
        if (booking.nannyReview) {
          return res.status(400).json({ message: 'You have already submitted a review for this booking' });
        }
  
        booking.nannyReview = true;
  
      } else if (userType === 'family') {
        if (!booking.jobId.user._id.equals(userId)) {
          return res.status(403).json({ message: 'Unauthorized to submit review for this booking' });
        }
  
        reviewTargetUser = await User.findById(booking.requestBy._id); // target = nanny
  
        if (!reviewTargetUser) {
          return res.status(404).json({ message: 'Nanny user not found' });
        }
  
        if (booking.familyReview) {
          return res.status(400).json({ message: 'You have already submitted a review for this booking' });
        }
  
        booking.familyReview = true;
  
      } else {
        return res.status(400).json({ message: 'Invalid user type' });
      }
  
      // Step 3: Check booking status
      if (booking.status !== 'completed') {
        return res.status(400).json({ message: 'Review can only be submitted for completed bookings' });
      }
  
      // Step 4: Prevent duplicate reviews
      if (!Array.isArray(reviewTargetUser.reviews)) {
        reviewTargetUser.reviews = [];
      }
  
      const existingReview = reviewTargetUser.reviews.find(
        (r) => r.bookingId.toString() === bookingId
      );
  
      if (existingReview) {
        return res.status(400).json({ message: 'You have already submitted a review for this booking' });
      }
  
      // Step 5: Push new review
      const reviewData = {
        userId,
        rating,
        msg,
        bookingId,
      };
  
      reviewTargetUser.reviews.unshift(reviewData);
  
      await reviewTargetUser.save();
      await booking.save();
  
      // Step 6: Email notification
      const reviewer = await User.findById(userId);
  
      if (reviewer.type === 'Parents') {
        sendEmail(
          reviewTargetUser.email,
          `⭐ New Review after completing "${reviewer.name}" booking!`,
          `<div style="padding: 12px">
            <h2 style="color: #28a745;">You've Received a New Review!</h2>
            <p><strong>Reviewer:</strong> ${reviewer.name}</p>
            <p><strong>Rating:</strong> ⭐ ${rating} / 5</p>
            <p><strong>Message:</strong> "${msg}"</p>
            <br>
            <a href="https://famylink.us/nanny" style="padding: 10px 15px; background: #d9534f; color: white; text-decoration: none; border-radius: 5px;">Job Board</a>
            <br><br>
            <p style="font-size: 14px; color: #555;">Need help? Contact us at <a href="mailto:info@famylink.us">info@famylink.us</a></p>
          </div>`
        );
      } else if (reviewer.type === 'Nanny') {
        sendEmail(
          reviewTargetUser.email,
          `⭐ New Review after completing "${reviewer.name}" job!`,
          `<div style="padding: 12px">
            <h2 style="color: #28a745;">You've Received a New Review!</h2>
            <p><strong>Reviewer:</strong> ${reviewer.name}</p>
            <p><strong>Rating:</strong> ⭐ ${rating} / 5</p>
            <p><strong>Message:</strong> "${msg}"</p>
            <br>
            <a href="https://famylink.us/family" style="padding: 10px 15px; background: #d9534f; color: white; text-decoration: none; border-radius: 5px;">Hire Board</a>
            <br><br>
            <p style="font-size: 14px; color: #555;">Need help? Contact us at <a href="mailto:info@famylink.us">info@famylink.us</a></p>
          </div>`
        );
      }
  
      return res.status(200).json({ message: 'Review submitted and email sent successfully' });
  
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'An error occurred while submitting the review' });
    }
  });
  


router.get('/:uid', async (req, res) => {
    const { uid } = req.params;

    try {
        // Step 1: Fetch the user with the specified ID and populate the userId field in reviews
        const user = await User.findById(uid).populate({
            path: 'reviews.userId', // Populate the userId in reviews
            select: 'name imageUrl', // Only fetch name and imageUrl fields
        });

        // Step 2: Check if the user exists
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Step 3: Calculate the average rating from the reviews
        const totalRatings = user.reviews.reduce((acc, review) => acc + review.rating, 0);
        const averageRating = user.reviews.length > 0 ? (totalRatings / user.reviews.length).toFixed(1) : 0;

        // Step 4: Format the response with reviews, user details, and average rating
        const response = {
            reviews: user.reviews.map(review => ({
                rating: review.rating,
                msg: review.msg,
                createdAt: review.createdAt,
                reviewer: {
                    name: review.userId?.name || 'Unknown', // Use populated name
                    imageUrl: review.userId?.imageUrl || null, // Use populated imageUrl
                },
            })),
            averageRating, // Include the average rating in the response
            totalRatings
        };

        // Step 5: Send the response
        res.status(200).json({ success: true, data: response });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});



export default router;