const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { publicUser } = require('../utils/token');

function otherParticipant(chat, userId) {
  return (chat.participants || []).find(
    (person) => String(person._id || person) !== String(userId)
  );
}

async function getChats(req, res, next) {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name phone avatarUrl rating')
      .populate('listing', 'title photos price')
      .sort({ lastMessageAt: -1 });

    res.json({
      chats: chats.map((chat) => ({
        id: chat._id,
        listing: chat.listing,
        otherUser: otherParticipant(chat, req.user._id)
          ? publicUser(otherParticipant(chat, req.user._id))
          : null,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

async function createChat(req, res, next) {
  try {
    const { listingId, userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ message: 'Cannot start a chat with yourself' });
    }

    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, userId] },
      ...(listingId ? { listing: listingId } : {}),
    });

    if (!chat) {
      chat = await Chat.create({
        listing: listingId || undefined,
        participants: [req.user._id, userId],
      });
    }

    await chat.populate('participants', 'name phone avatarUrl rating');
    await chat.populate('listing', 'title photos price');

    res.status(201).json({
      chat: {
        id: chat._id,
        listing: chat.listing,
        otherUser: publicUser(otherParticipant(chat, req.user._id)),
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getMessages(req, res, next) {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const messages = await Message.find({ chat: chat._id }).sort({ createdAt: 1 });
    res.json({
      messages: messages.map((message) => ({
        id: message._id,
        text: message.text,
        senderId: message.sender,
        createdAt: message.createdAt,
        mine: String(message.sender) === String(req.user._id),
      })),
    });
  } catch (error) {
    next(error);
  }
}

async function sendMessage(req, res, next) {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const message = await Message.create({
      chat: chat._id,
      sender: req.user._id,
      text,
    });

    chat.lastMessage = text;
    chat.lastMessageAt = new Date();
    await chat.save();

    res.status(201).json({
      message: {
        id: message._id,
        text: message.text,
        senderId: message.sender,
        createdAt: message.createdAt,
        mine: true,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getChats, createChat, getMessages, sendMessage };
