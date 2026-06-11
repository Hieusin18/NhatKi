import { Request, Response } from 'express';
import { uploadToCloudinary } from './media.service';
import { SocketHandler } from '../../realtime/socket.handler';

export const handleMediaUpload = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'convenience_store');

    // Extract user/socket metadata from headers for broadcasting
    const socketId = req.headers['x-socket-id'] as string | undefined;
    const userId = (req.headers['x-user-id'] as string) || 'usr_mock_uploader';
    const username = (req.headers['x-username'] as string) || 'Mock Uploader';
    const groupId = (req.headers['x-group-id'] as string) || 'grp_550e8400';

    // Broadcast photo details to the group room via Socket.io
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
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

export const uploadMediaController = handleMediaUpload;

