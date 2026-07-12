import express from 'express'
import Chat from '../Schema/chat.js'
import User from '../Schema/user.js'
import mongoose from 'mongoose'
import Notification from '../Schema/notificaion.js'
import { authMiddleware } from '../Services/utils/middlewareAuth.js'

const { ObjectId } = mongoose.Types

const router = express.Router()

const sendErrorResponse = (res, status, message, error = null) => {
  if (error) console.error(error)
  return res.status(status).json({ error: message })
}

const sendSuccessResponse = (res, status, data) => {
  return res.status(status).json(data)
}

router.get('/', authMiddleware, async (req, res) => {
  const userId = req.userId // Get logged-in user ID from authMiddleware

  try {
    // Step 1: Fetch chats where the logged-in user is a participant
    const chats = await Chat.find({
      participants: userId
    }).populate('participants', 'email name imageUrl type _id online lastSeen')

    // Step 2: Fetch all users with type 'Admin'
    const admins = await User.find({ type: 'Admin' }).select(
      'email name imageUrl type _id online lastSeen'
    )

    // Step 3: Filter the chats to include only the other participant's data
    const filteredChats = chats.map(chat => {
      const otherParticipant = chat.participants.find(
        participant => participant._id.toString() !== userId
      )
      return {
        _id: chat._id,
        lastMessage: chat.lastMessage,
        otherParticipant,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        type: chat.type
      }
    })

    // Step 4: Include admins who don't have a chat with the user
    const adminChatIds = filteredChats.map(chat =>
      chat.otherParticipant?._id.toString()
    )
    const adminsWithoutChats = admins.filter(
      admin => !adminChatIds.includes(admin._id.toString())
    )

    // Step 5: Format the adminsWithoutChats to match the chat structure
    const adminChats = adminsWithoutChats.map(admin => ({
      _id: null, // No chat ID since it's not started
      lastMessage: null,
      otherParticipant: admin,
      createdAt: null,
      updatedAt: null,
      type: null
    }))

    // Step 6: Combine chats and adminsWithoutChats
    const combinedData = [...filteredChats, ...adminChats]

    sendSuccessResponse(res, 200, combinedData)
  } catch (error) {
    console.error(error)
    sendErrorResponse(res, 500, 'Error fetching chats', error)
  }
})

router.post('/', async (req, res) => {
  try {
    const { participants } = req.body

    if (!participants || participants.length < 2) {
      return sendErrorResponse(
        res,
        400,
        'Participants are required and should include at least two users.'
      )
    }

    const sortedParticipants = participants
      .map(participant => new ObjectId(participant))
      .sort()

    const existingChat = await Chat.findOne({
      participants: {
        $all: sortedParticipants,
        $size: sortedParticipants.length
      }
    })

    if (existingChat) {
      return sendSuccessResponse(res, 200, existingChat)
    }

    const newChat = new Chat({
      participants: sortedParticipants
    })
    await newChat.save()

    sendSuccessResponse(res, 201, newChat)
  } catch (error) {
    sendErrorResponse(res, 500, 'Error creating chat', error)
  }
})

router.get('/:id/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params
    if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
      return sendErrorResponse(res, 400, 'Invalid chat or user ID.')
    }

    const userObjectId = new ObjectId(userId)
    const chat = await Chat.aggregate([
      {
        $match: { _id: new ObjectId(id) }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participantsDetails'
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'chatId',
          as: 'messages'
        }
      },
      {
        $addFields: {
          receiver: {
            $let: {
              vars: {
                participantIndex: {
                  $cond: {
                    if: {
                      $eq: [
                        { $arrayElemAt: ['$participants', 0] },
                        userObjectId
                      ]
                    },
                    then: {
                      $cond: {
                        if: { $gt: [{ $size: '$participants' }, 1] },
                        then: 1,
                        else: 0
                      }
                    },
                    else: {
                      $cond: {
                        if: { $gt: [{ $size: '$participants' }, 0] },
                        then: 0,
                        else: null
                      }
                    }
                  }
                }
              },
              in: {
                $let: {
                  vars: {
                    participant: {
                      $arrayElemAt: [
                        '$participantsDetails',
                        '$$participantIndex'
                      ]
                    }
                  },
                  in: {
                    email: '$$participant.email',
                    name: '$$participant.name',
                    imageUrl: '$$participant.imageUrl',
                    type: '$$participant.type',
                    _id: '$$participant._id'
                  }
                }
              }
            }
          },
          sender: {
            $let: {
              vars: {
                participantIndex: {
                  $indexOfArray: ['$participants', userObjectId]
                }
              },
              in: {
                $let: {
                  vars: {
                    participant: {
                      $arrayElemAt: [
                        '$participantsDetails',
                        '$$participantIndex'
                      ]
                    }
                  },
                  in: {
                    email: '$$participant.email',
                    name: '$$participant.name',
                    imageUrl: '$$participant.imageUrl',
                    type: '$$participant.type',
                    _id: '$$participant._id'
                  }
                }
              }
            }
          },
          unReadMessages: {
            $size: {
              $filter: {
                input: '$messages',
                as: 'message',
                cond: {
                  $and: [
                    { $eq: ['$$message.seen', false] },
                    { $ne: ['$$message.sender', userObjectId] }
                  ]
                }
              }
            }
          }
        }
      },    
      { $project: { participants: 0, participantsDetails: 0, messages: 0 } }
    ])

    if (!chat.length) {
      return sendErrorResponse(res, 404, 'Chat not found.')
    }

    sendSuccessResponse(res, 200, chat[0])
  } catch (error) {
    sendErrorResponse(res, 500, 'Error fetching chat by ID', error)
  }
})

// Update a chat
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { participants } = req.body

    if (!ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid chat ID.')
    }

    const chat = await Chat.findById(id)
    if (!chat) {
      return sendErrorResponse(res, 404, 'Chat not found.')
    }

    if (participants) chat.participants = participants

    await chat.save()
    sendSuccessResponse(res, 200, chat)
  } catch (error) {
    sendErrorResponse(res, 500, 'Error updating chat', error)
  }
})

// Delete a chat
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate chat ID
    if (!ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid chat ID.');
    }

    // Delete the chat
    const chat = await Chat.findByIdAndDelete(id);

    if (!chat) {
      return sendErrorResponse(res, 404, 'Chat not found.');
    }

    // Delete associated notifications
    await Notification.deleteMany({ chatId: id });

    sendSuccessResponse(res, 200, { message: 'Chat and related notifications deleted successfully.' });
  } catch (error) {
    sendErrorResponse(res, 500, 'Error deleting chat and related notifications', error);
  }
});

export default router
