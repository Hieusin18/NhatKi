const { uploadToCloudinary } = require('./media.service');
const { SocketHandler } = require('../../realtime/socket.handler');

const handleMediaUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'convenience_store');

    const socketId = req.headers['x-socket-id'];
    const userId = req.headers['x-user-id'] || 'usr_mock_uploader';
    const username = req.headers['x-username'] || 'Mock Uploader';
    const groupId = req.headers['x-group-id'] || 'grp_550e8400';

    const socketHandlerInstance = SocketHandler.getInstance();
    socketHandlerInstance.broadcastNewCapture(
      {
        photo_id: result.public_id,
        url: result.secure_url,
        owner_id: userId,
        owner_name: username,
        group_id: groupId,
        uploaded_at: new Date().toISOString(),
      },
      socketId
    );

    return res.status(200).json({
      success: true,
      message: 'Upload media thành công.',
      data: {
        media_id: result.public_id,
        url: result.secure_url,
        resource_type: result.resource_type,
        format: result.format,
        size_bytes: result.bytes,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

module.exports = {
  handleMediaUpload,
  uploadMediaController: handleMediaUpload
};
