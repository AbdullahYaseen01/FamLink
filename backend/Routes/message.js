import express from 'express';
import Message from '../Schema/message.js';
import Chat from '../Schema/chat.js';
import { authMiddleware } from '../Services/utils/middlewareAuth.js';
import { USER_IDENTITY_SELECT } from '../Services/utils/userPrivacy.js';

const router = express.Router();

// Message CRUD. The app itself sends and reads messages over the socket
// (Routes/Socket/chat.js); this router is the REST equivalent and was entirely
// unauthenticated — a bare message id read anyone's message, edited it, or
// deleted it, and GET /:id populated `sender` with no projection at all, so the
// response carried the sender's whole user document.
//
// Every route below now requires a signed-in caller who is a participant of the
// message's chat.

// True when `userId` is in the chat the message belongs to.
const isParticipant = async (chatId, userId) =>
    Boolean(chatId) && Boolean(await Chat.exists({ _id: chatId, participants: userId }));

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { chatId, content } = req.body;

        if (!(await isParticipant(chatId, req.userId))) {
            return res.status(403).json({ message: 'You are not part of this chat.' });
        }

        // The sender is whoever is signed in — never a value from the body, which
        // would let a caller post messages as somebody else.
        const newMessage = new Message({
            chatId,
            sender: req.userId,
            content,
        });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findById(id)
            .populate('chatId')
            .populate('sender', USER_IDENTITY_SELECT);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Same 404 as a missing message, so this can't be used to probe which
        // message ids exist.
        if (!(await isParticipant(message.chatId?._id || message.chatId, req.userId))) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.status(200).json(message);
    } catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, seen, seenAt } = req.body;
        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (!(await isParticipant(message.chatId, req.userId))) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Read receipts are the recipient's to set; the text is the author's.
        if (content !== undefined) {
            if (String(message.sender) !== String(req.userId)) {
                return res
                    .status(403)
                    .json({ message: 'You can only edit your own messages.' });
            }
            message.content = content;
        }
        if (seen !== undefined) message.seen = seen;
        if (seenAt !== undefined) message.seenAt = seenAt;

        await message.save();
        res.status(200).json(message);
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (String(message.sender) !== String(req.userId)) {
            return res
                .status(403)
                .json({ message: 'You can only delete your own messages.' });
        }

        await message.deleteOne();
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
