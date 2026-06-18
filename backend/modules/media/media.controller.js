const { uploadToCloudinary, searchMedia } = require('./media.service');
const { SocketHandler } = require('../../realtime/socket.handler');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const handleMediaUpload = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // req.user is populated by authenticate middleware
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    // GroupId can be in body or query
    const groupId = req.body.groupId || req.query.groupId;
    if (!groupId) {
      return res.status(400).json({ success: false, message: 'groupId is required.' });
    }

    // Check membership in DB first
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Bạn không phải là thành viên của nhóm này.' });
    }

    // Fetch user details for username
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    const username = user ? user.username : 'Unknown User';

    const result = await uploadToCloudinary(file.buffer, 'convenience_store');

    // Save to database
    const media = await prisma.media.create({
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        resourceType: result.resource_type,
        format: result.format,
        sizeBytes: result.bytes,
        ownerId: userId,
        groupId: groupId,
      },
    });

    const socketId = req.headers['x-socket-id'];
    const socketHandlerInstance = SocketHandler.getInstance();
    socketHandlerInstance.broadcastNewCapture(
      {
        photo_id: media.publicId,
        url: media.url,
        owner_id: userId,
        owner_name: username,
        group_id: groupId,
        uploaded_at: media.createdAt.toISOString(),
      },
      socketId
    );

    return res.status(200).json({
      success: true,
      message: 'Upload media thành công.',
      data: {
        media_id: media.publicId,
        url: media.url,
        resource_type: media.resourceType,
        format: media.format,
        size_bytes: media.sizeBytes,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

const searchMediaController = async (req, res) => {
  try {
    const { groupId, ownerId, startDate, endDate, page, limit } = req.query;

    const data = await searchMedia({
      groupId,
      ownerId,
      startDate,
      endDate,
      page,
      limit,
      requesterId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

module.exports = {
  handleMediaUpload,
  uploadMediaController: handleMediaUpload,
  searchMediaController
};
