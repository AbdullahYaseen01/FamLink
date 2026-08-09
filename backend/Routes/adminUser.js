import express from 'express'
import User from '../Schema/user.js'
import Chat from '../Schema/chat.js'
import Booking from '../Schema/booking.js'
import bcrypt from 'bcryptjs'
import { adminOnly } from '../Services/utils/adminAuth.js'
import { sendAccountDeactivatedEmail } from '../Services/email/email.js'
import Stripe from 'stripe'
import moment from 'moment'

const router = express.Router()

// Every route in this legacy admin module is admin-gated.
router.use(adminOnly)

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
})

const sendErrorResponse = (res, status, message, error = null) => {
  if (error) console.error(error)
  return res.status(status).json({ error: message })
}

const sendSuccessResponse = (res, status, data) => {
  return res.status(status).json(data)
}

router.put('/update-status/:id', async (req, res) => {
  const { id } = req.params // Extract user ID from the route
  const { status } = req.body // Extract the new status from the request body

  // Validate status input
  if (!['Active', 'Block'].includes(status)) {
    return res
      .status(400)
      .json({ error: "Invalid status value. Must be 'Active' or 'Block'." })
  }

  
  try {
    // Find the user by ID and update the status
    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Return the updated document
    )

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Notify the user when their account is deactivated (non-blocking). Keep the
    // reason generic — never expose internal moderation notes in the email.
    if (status === 'Block' && user.email) {
      sendAccountDeactivatedEmail(
        user.email,
        user.name,
        'a violation of our community guidelines'
      ).catch(err =>
        console.error('Failed to send account-deactivated email:', err)
      )
    }

    res.status(200).json({ message: 'Status updated successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message })
  }
})

router.put('/edit/:id', async (req, res) => {
  const { name, email, dob, location, zipCode } = req.body
  const { id } = req.params
  try {
    // Validate the ID
    if (!id) {
      return res.status(400).json({ message: 'User ID is required' })
    }
    
    // Find the user by ID
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Update the fields if provided
    if (name !== undefined) user.name = name
    if (email !== undefined) user.email = email
    if (dob !== undefined) {
      // Validate and set the date of birth
      const date = new Date(dob)
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: 'Invalid date format for dob' })
      }
      user.dob = date
    }
    if (location !== undefined) user.location = location
    if (zipCode !== undefined) user.zipCode = zipCode

    // Save the updated user data
    await user.save()

    return res
      .status(200)
      .json({ message: 'User updated successfully', data: user })
  } catch (error) {
    console.error('Error updating user:', error) // Log the error for debugging
    return res.status(500).json({ message: 'Error updating user', error })
  }
})

router.put('/password/:userId', async (req, res) => {
  const { password } = req.body
  const { userId } = req.params
  try {
    // Find the target user
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'User not found.'
      })
    }

    // Ensure newPassword is provided and valid
    if (!password) {
      return res.status(400).json({
        status: 400,
        message: 'New password is required.'
      })
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)

    // Update the user's password
    user.password = hashedNewPassword
    await user.save()

    return res.status(200).json({
      status: 200,
      message: 'Password updated successfully'
    })
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
})

router.get('/get-save-cards/:userId', async (req, res) => {
  const { userId } = req.params
  try {
    
    // Find user by ID
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found!' })

    // Check if user has a Stripe ID
    if (!user.stripeId) {
      return res.status(404).json({ message: 'No Cards found for the user!' })
    }

    // List payment methods for the Stripe customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeId,
      type: 'card' // Assuming you want to retrieve only card payment methods
    })

    res.status(200).json(paymentMethods)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete(
  '/delete-card/:paymentMethodId/:userId',
  async (req, res) => {
    const { paymentMethodId, userId } = req.params
    try {
      const user = await User.findById(userId)
      if (!user) return res.status(404).json({ message: 'User not found!' })

      // Check if user has a Stripe ID
      if (!user.stripeId) {
        return res
          .status(400)
          .json({ message: 'No Stripe customer found for this user.' })
      }

      // Detach the payment method from the customer
      await stripe.paymentMethods.detach(paymentMethodId)

      res.status(200).json({ message: 'Card removed successfully.' })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
)

router.get('/chats', async (req, res) => {
  const userId = req.userId
  const { exclude = [] } = req.query // Optional: IDs to exclude

  try {
    // Fetch all users except the logged-in user and excluded users
    const allUsers = await User.find({
      _id: { $ne: userId, $nin: exclude }
    }).select('email name imageUrl type _id')

    // Fetch all chats where the logged-in user is a participant
    const chats = await Chat.find({
      participants: userId
    })
      .populate('participants', 'email name imageUrl type _id')
      .sort({ updatedAt: -1 }) // Sort chats by latest updatedAt

    // Map the chats to include only the other participant and chat details
    const chatMap = chats.reduce((acc, chat) => {
      const otherParticipant = chat.participants.find(
        participant => participant._id.toString() !== userId
      )
      if (otherParticipant) {
        acc[otherParticipant._id.toString()] = {
          _id: chat._id,
          lastMessage: chat.lastMessage,
          otherParticipant,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          type: chat.type
        }
      }
      return acc
    }, {})

    // Combine all users with chat details if they exist
    const filteredData = allUsers.map(user => {
      if (chatMap[user._id.toString()]) {
        return chatMap[user._id.toString()] // Return chat details if exists
      }
      return {
        otherParticipant: user, // Return user details if no chat exists
        lastMessage: null,
        createdAt: null,
        updatedAt: null,
        type: null
      }
    })

    // Sort combined data by latest `updatedAt`
    const sortedData = filteredData.sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0).getTime()
      const dateB = new Date(b.updatedAt || 0).getTime()
      return dateB - dateA // Descending order (latest first)
    })

    sendSuccessResponse(res, 200, sortedData)
  } catch (error) {
    console.error(error)
    sendErrorResponse(res, 500, 'Error fetching chats', error)
  }
})

router.get('/complete-bookings', async (req, res) => {
  try {
    const { limit, page, preferredSchedule } = req.query

    // Default pagination values
    const pageSize = parseInt(limit) || 10 // Number of bookings per page
    const currentPage = parseInt(page) || 1 // Current page
    const skip = (currentPage - 1) * pageSize // Calculate items to skip

    // Build the query filter
    const filter = { status: 'completed' } // Fetch only completed bookings

    // Add filter for preferredSchedule if provided
    // if (preferredSchedule) {
    //   console.log(filter['familyId.additionalInfo.preferredSchedule.value.option'] = preferredSchedule)
    //   filter['familyId.additionalInfo.preferredSchedule.value.option'] = preferredSchedule;
    // }
    // console.log(filter)
    // Fetch completed bookings with pagination, filter, and populate familyId
    const bookings = await Booking.find(filter)
      .populate('familyId', 'name email imageUrl zipCode additionalInfo') // Optionally populate nannyId fields
      .skip(skip)
      .limit(pageSize)
      .sort({ _id: -1 }) // Sort by newest first

    // Fetch total count of bookings for pagination metadata
    const totalCount = await Booking.countDocuments(filter)
    const totalPages = Math.ceil(totalCount / pageSize)

    // Respond with data and pagination metadata
    res.status(200).json({
      status: 200,
      data: bookings,
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

router.get('/stats', async (req, res) => {
  try {
    // Find the earliest application date
    
    const { filter } = req.query // Accept filter from query params (1M, 6M, 1Y)
    const now = new Date()

    // Calculate the start date based on the filter
    let startDate
    if (filter === '1M') {
      startDate = new Date(now.setMonth(now.getMonth() - 1))
    } else if (filter === '6M') {
      startDate = new Date(now.setMonth(now.getMonth() - 6))
    } else if (filter === '1Y') {
      startDate = new Date(now.setFullYear(now.getFullYear() - 1))
    } else {
      // Default: Fetch from the first application date
      const firstApplication = await Booking.findOne()
        .sort({ createdAt: 1 })
        .select('createdAt')
      if (!firstApplication) {
        return res.status(404).json({ message: 'No applications found.' })
      }
      startDate = firstApplication.createdAt
    }

    // General statistics based on the start date
    const totalApplications = await Booking.countDocuments({
      createdAt: { $gte: startDate }
    })
    const totalRejected = await Booking.countDocuments({
      status: 'rejected',
      createdAt: { $gte: startDate }
    })
    const totalCompleted = await Booking.countDocuments({
      status: 'completed',
      createdAt: { $gte: startDate }
    })
    const totalEarnings = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPayment' }
        }
      }
    ])

    // Graph data: Group bookings by date (day) from the start date
    const graphData = await Booking.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            }
          },
          totalApplications: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          earnings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$totalPayment', 0]
            }
          }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ])

    // Format total earnings result
    const earnings = totalEarnings.length > 0 ? totalEarnings[0].total : 0

    // Respond with the statistics and graph data
    res.status(200).json({
      startDate,
      totalApplications,
      totalRejected,
      totalCompleted,
      totalEarnings: earnings,
      graphData
    })
  } catch (error) {
    console.error('Error fetching booking statistics and graph data:', error)
    res.status(500).json({
      message: 'Failed to fetch booking statistics and graph data',
      error: error.message
    })
  }
})

router.get('/userStats', async (req, res) => {
  try {
    
    const now = new Date()
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(now.getMonth() - 1)

    // Fetch weekly data grouped by type and week
    const weeklyStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: oneMonthAgo, $lte: now },
          type: { $in: ['Nanny', 'Parents'] }
        }
      },
      {
        $group: {
          _id: {
            week: { $week: '$createdAt' },
            year: { $year: '$createdAt' },
            type: '$type'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          week: '$_id.week',
          year: '$_id.year',
          type: '$_id.type',
          count: 1
        }
      },
      {
        $sort: { year: 1, week: 1 }
      }
    ])

    // Fetch total counts for "Nanny" and "Parents"
    const totalCounts = await User.aggregate([
      {
        $match: { type: { $in: ['Nanny', 'Parents'] } }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ])

    // Fetch counts from one month ago to calculate percentage change
    const previousMonthCounts = await User.aggregate([
      {
        $match: {
          createdAt: { $lte: oneMonthAgo },
          type: { $in: ['Nanny', 'Parents'] }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ])

    // Calculate all weeks in the range with actual date range for each week
    const allWeeks = []
    const currentDate = new Date(oneMonthAgo)

    while (currentDate <= now) {
      const startOfWeek = new Date(currentDate)
      const endOfWeek = new Date(currentDate)
      endOfWeek.setDate(endOfWeek.getDate() + 6)

      allWeeks.push({
        startOfWeek,
        endOfWeek
      })
      currentDate.setDate(currentDate.getDate() + 7)
    }

    // Fill in missing weeks
    const filledWeeklyStats = allWeeks.map(({ startOfWeek, endOfWeek }) => {
      const nannyStat = weeklyStats.find(
        stat =>
          stat.week === getWeekNumber(startOfWeek) &&
          stat.year === startOfWeek.getFullYear() &&
          stat.type === 'Nanny'
      )
      const parentStat = weeklyStats.find(
        stat =>
          stat.week === getWeekNumber(startOfWeek) &&
          stat.year === startOfWeek.getFullYear() &&
          stat.type === 'Parents'
      )

      return {
        startOfWeek,
        endOfWeek,
        Nanny: nannyStat ? nannyStat.count : 0,
        Parents: parentStat ? parentStat.count : 0
      }
    })

    // Map total counts into an object
    const totalCountsObj = totalCounts.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    // Map previous month counts into an object
    const previousCountsObj = previousMonthCounts.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    // Calculate percentage change for each week (for Nanny and Parents)
    const percentageChanges = ['Nanny', 'Parents'].map(type => {
      const currentCount = totalCountsObj[type] || 0
      const previousCount = previousCountsObj[type] || 0
      let percentageChange = 0

      if (previousCount > 0) {
        percentageChange =
          ((currentCount - previousCount) / previousCount) * 100
      } else if (currentCount > 0) {
        percentageChange = 100 // New users this month
      }

      return {
        type,
        percentageChange: parseFloat(percentageChange.toFixed(2)) // Rounded to 2 decimal places
      }
    })

    // Calculate percentage change for weekly stats
    const weeklyPercentageChanges = filledWeeklyStats.map((week, index) => {
      if (index === 0)
        return { ...week, NannyPercentage: 0, ParentsPercentage: 0 }

      const prevWeek = filledWeeklyStats[index - 1]

      const calculatePercentage = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
      }

      const nannyPercentage = calculatePercentage(week.Nanny, prevWeek.Nanny)
      const parentsPercentage = calculatePercentage(
        week.Parents,
        prevWeek.Parents
      )

      return {
        ...week,
        NannyPercentage: parseFloat(nannyPercentage.toFixed(2)),
        ParentsPercentage: parseFloat(parentsPercentage.toFixed(2))
      }
    })

    // Response structure
    res.json({
      totalCounts: totalCountsObj,
      percentageChanges,
      weeklyStats: weeklyPercentageChanges
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/earningStats', async (req, res) => {
  try {
        // Get all completed bookings
    const completedBookings = await Booking.find({ status: 'completed' })

    // Calculate total earnings
    const totalEarning = completedBookings.reduce(
      (sum, booking) => sum + (booking.totalPayment || 0),
      0
    )

    // Group by week for the last month
    const now = moment()
    const oneMonthAgo = moment().subtract(1, 'month')
    const weeklyEarnings = []

    for (
      let weekStart = oneMonthAgo.startOf('week');
      weekStart.isBefore(now);
      weekStart.add(1, 'week')
    ) {
      const weekEnd = moment(weekStart).endOf('week')

      const weeklyTotal = completedBookings
        .filter(booking =>
          moment(booking.completedAt).isBetween(
            weekStart,
            weekEnd,
            undefined,
            '[]'
          )
        )
        .reduce((sum, booking) => sum + (booking.totalPayment || 0), 0)

      weeklyEarnings.push({
        week: weekStart.format('YYYY-MM-DD'),
        earnings: weeklyTotal
      })
    }

    // Calculate percentage change for the current week
    const currentWeekEarnings =
      weeklyEarnings[weeklyEarnings.length - 1]?.earnings || 0

    const percentageChanges =
      totalEarning === 0
        ? currentWeekEarnings > 0
          ? 100
          : 0 // If no total earnings, show 100% increase or 0% decrease
        : ((currentWeekEarnings - totalEarning) / totalEarning) * 100

    // Response
    res.status(200).json({
      totalEarning,
      weeklyEarnings,
      percentageChanges
    })
  } catch (error) {
    res.status(500).json({ message: error })
  }
})

// Helper function to get week number
function getWeekNumber (d) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayNum = (date.getDay() + 6) % 7
  const firstThursday = new Date(date.getFullYear(), 0, 4)
  const firstDayOfWeek = new Date(
    firstThursday.getFullYear(),
    firstThursday.getMonth(),
    firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7)
  )
  const weekNumber = Math.ceil(((date - firstDayOfWeek) / 86400000 + 1) / 7)
  return weekNumber
}

router.get('/recentBookings', async (req, res) => {
  try {
        // Fetch top 5 recent bookings with family (Parents) and nanny info
    const recentBookings = await Booking.aggregate([
      // Match bookings that are not rejected
      {
        $match: {
          status: { $ne: 'rejected' } // Exclude rejected bookings
        }
      },
      // Join with 'users' collection to get family info
      {
        $lookup: {
          from: 'users', // The collection to join with
          localField: 'familyId', // The field in Booking that references the user
          foreignField: '_id', // The field in the users collection to match
          as: 'familyInfo' // Alias for the result of the join
        }
      },
      // Unwind the family info array to get a single object
      {
        $unwind: {
          path: '$familyInfo',
          preserveNullAndEmptyArrays: false // Exclude bookings with no family info
        }
      },
      // Filter for users whose type is 'Parents'
      {
        $match: {
          'familyInfo.type': 'Parents' // Only include families with type 'Parents'
        }
      },
      // Join with 'users' collection to get nanny info
      {
        $lookup: {
          from: 'users', // The collection to join with
          localField: 'nannyId', // The field in Booking that references the nanny
          foreignField: '_id', // The field in the users collection to match
          as: 'nannyInfo' // Alias for the result of the join
        }
      },
      // Unwind the nanny info array to get a single object
      {
        $unwind: {
          path: '$nannyInfo',
          preserveNullAndEmptyArrays: false // Exclude bookings with no nanny info
        }
      },
      // Project the required fields
      {
        $project: {
          _id: 1,
          nannyId: 1,
          familyId: 1,
          status: 1,
          totalPayment: 1,
          createdAt: 1,
          startAt: 1,
          completedAt: 1,
          familyInfo: {
            email: 1,
            name: 1,
            imageUrl: 1,
            location: 1,
            age: 1
          },
          nannyInfo: {
            email: 1,
            name: 1,
            imageUrl: 1,
            location: 1,
            age: 1,
            experience: 1 // Include more fields if needed
          }
        }
      },
      // Sort by the 'createdAt' field in descending order to get the most recent bookings
      {
        $sort: {
          createdAt: -1
        }
      },
      // Limit to top 5 recent bookings
      {
        $limit: 5
      }
    ])

    // Respond with the result
    res.json(recentBookings)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/nanny-locations', async (req, res) => {
  try {
        // Step 1: Fetch all nannies' data
    const nannies = await User.find(
      { type: 'Nanny' }, // Filter for nannies
      { name: 1, location: 1, email: 1, age: 1, gender: 1, imageUrl: 1 } // Project required fields
    )

    // Step 2: Calculate the top 3 locations
    const topLocations = await User.aggregate([
      { $match: { type: 'Nanny' } }, // Match only nannies
      { $group: { _id: '$location.format_location', count: { $sum: 1 } } }, // Group by location
      { $sort: { count: -1 } }, // Sort by count in descending order
      { $limit: 3 }, // Limit to top 3 locations
      {
        $addFields: {
          percentage: {
            $multiply: [
              { $divide: ['$count', nannies.length] }, // Calculate percentage
              100
            ]
          }
        }
      }
    ])

    // Combine results
    res.json({
      nannies,
      topLocations
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/topUsers', async (req, res) => {
  try {
    const { type, sort, page = 1, limit = 5 } = req.query;

    // Ensure the type filter is provided
    if (!type || !['Nanny', 'Parents'].includes(type)) {
      return res.status(400).json({ error: 'Invalid or missing type filter.' });
    }

    const pageNum = parseInt(page); // Current page number
    const limitNum = parseInt(limit); // Records per page
    const skip = (pageNum - 1) * limitNum; // Calculate the number of records to skip

    // Aggregation pipeline with pagination
    const users = await User.aggregate([
      // Step 1: Match users by type
      { $match: { type } },

      // Step 2: Unwind the reviews array to process each review individually
      { $unwind: { path: '$reviews', preserveNullAndEmptyArrays: true } },

      // Step 3: Group users back with aggregated review info
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          email: { $first: '$email' },
          location: { $first: '$location' },
          type: { $first: '$type' },
          age: { $first: '$age' },
          gender: { $first: '$gender' },
          imageUrl: { $first: '$imageUrl' },
          avgRating: { $avg: '$reviews.rating' }, // Calculate average rating
          totalReviews: {
            $sum: { $cond: [{ $ifNull: ['$reviews', false] }, 1, 0] }
          } // Count reviews
        }
      },

      // Step 4: Sort results based on average rating or total reviews
      {
        $sort:
          sort === 'reviews'
            ? { totalReviews: -1 } // Sort by total reviews descending
            : { avgRating: -1 } // Sort by average rating descending
      },

      // Step 5: Pagination stages
      { $skip: skip }, // Skip records for pagination
      { $limit: limitNum } // Limit records per page
    ]);

    // Count total documents matching the query
    const totalUsers = await User.aggregate([
      { $match: { type } },
      { $unwind: { path: '$reviews', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$_id',
          totalReviews: {
            $sum: { $cond: [{ $ifNull: ['$reviews', false] }, 1, 0] }
          }
        }
      }
    ]);

    const totalRecords = totalUsers.length; // Total number of matching users
    const totalPages = Math.ceil(totalRecords / limitNum); // Calculate total pages

    // Respond with the paginated user data
    res.status(200).json({
      users,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


export default router
