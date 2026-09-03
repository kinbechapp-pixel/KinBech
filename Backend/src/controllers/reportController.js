const Report = require('../models/Report');
const User = require('../models/User');

async function createReport(req, res, next) {
  try {
    const { reportedUserId, reason, details, blockUser } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ message: 'Reported user ID and reason are required' });
    }

    if (String(reportedUserId) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }

    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create report
    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      reportedListing: req.body.listingId || null,
      reason,
      details: details || '',
    });

    // Block user if requested
    if (blockUser) {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { blockedUserIds: reportedUserId }
      });
      await User.findByIdAndUpdate(reportedUserId, {
        $addToSet: { blockedUserIds: req.user._id }
      });
    }

    res.status(201).json({ 
      message: 'Report submitted successfully',
      report: {
        id: report._id,
        reason: report.reason,
        status: report.status,
      }
    });
  } catch (error) {
    next(error);
  }
}

async function blockUser(req, res, next) {
  try {
    const { userId } = req.params;

    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add to both users' blocked lists
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUserIds: userId }
    });
    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUserIds: req.user._id }
    });

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    next(error);
  }
}

async function unblockUser(req, res, next) {
  try {
    const { userId } = req.params;

    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot unblock yourself' });
    }

    // Remove from both users' blocked lists
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUserIds: userId }
    });
    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUserIds: req.user._id }
    });

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    next(error);
  }
}

async function getMyReports(req, res, next) {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .populate('reportedUser', 'name phone avatarUrl')
      .populate('reportedListing', 'title photos')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ reports });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReport,
  blockUser,
  unblockUser,
  getMyReports,
};