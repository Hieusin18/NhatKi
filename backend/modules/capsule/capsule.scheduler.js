const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mock Firebase Cloud Messaging Service
class FcmNotificationService {
  /**
   * Mock FCM token retrieval for users
   */
  static async getUserFcmTokens(userIds) {
    const tokenMap = {};
    for (const userId of userIds) {
      tokenMap[userId] = [`fcm_token_mock_for_user_${userId}`];
    }
    return tokenMap;
  }

  /**
   * Mock sending push notification via FCM
   */
  static async sendPush(tokens, title, body) {
    console.log(`[FCM Notification] Sending notification to ${tokens.length} token(s):`);
    console.log(`  -> Title: "${title}"`);
    console.log(`  -> Body: "${body}"`);
    for (const token of tokens) {
      console.log(`  -> [SUCCESS] Push sent to token: ${token}`);
    }
    return true;
  }
}

/**
 * Scan for Time Capsules that are ready to open, send notifications, and update status.
 */
async function runCapsuleCheckingJob() {
  const jobStartTime = new Date();
  console.log(`[Time Capsule Scheduler] Cron job started at: ${jobStartTime.toISOString()}`);

  try {
    // 1. Query Database using Prisma Client
    // Conditions: open_at <= new Date() AND isNotified = false
    const capsules = await prisma.capsule.findMany({
      where: {
        open_at: {
          lte: jobStartTime,
        },
        isNotified: false,
      },
    });

    if (capsules.length === 0) {
      console.log('[Time Capsule Scheduler] No new Time Capsules ready to unlock at this time.');
      return;
    }

    console.log(`[Time Capsule Scheduler] Found ${capsules.length} Time Capsule(s) to process.`);

    for (const capsule of capsules) {
      try {
        console.log(`[Time Capsule Scheduler] Processing Capsule ID: ${capsule.id} (Title: "${capsule.title}")`);

        // Fetch Creator details using Prisma
        const creator = await prisma.user.findUnique({
          where: { id: capsule.userId },
        });
        const creatorName = creator ? creator.username : 'Unknown User';

        // 2. Identify all recipient User IDs
        const recipientUserIds = new Set();
        
        // Add creator
        recipientUserIds.add(capsule.userId);

        // Add receiver if specified
        if (capsule.receiverId) {
          recipientUserIds.add(capsule.receiverId);
        }

        // Fetch groups the creator belongs to
        const creatorGroups = await prisma.groupMember.findMany({
          where: { userId: capsule.userId },
        });

        const groupIds = creatorGroups.map(g => g.groupId);

        if (groupIds.length > 0) {
          // Fetch all members in those groups
          const relatedGroupMembers = await prisma.groupMember.findMany({
            where: {
              groupId: {
                in: groupIds,
              },
            },
          });

          for (const member of relatedGroupMembers) {
            recipientUserIds.add(member.userId);
          }
        }

        const userIdsToNotify = Array.from(recipientUserIds);
        console.log(`[Time Capsule Scheduler] Identified ${userIdsToNotify.length} users to notify for Capsule ID ${capsule.id}.`);

        // 3. Push Notification: Get tokens and send push notifications
        const tokenMap = await FcmNotificationService.getUserFcmTokens(userIdsToNotify);
        const allTokens = [];
        
        for (const userId of userIdsToNotify) {
          if (tokenMap[userId]) {
            allTokens.push(...tokenMap[userId]);
          }
        }

        if (allTokens.length > 0) {
          const notificationTitle = 'Time Capsule Mở Khóa!';
          const notificationBody = `Time Capsule "${capsule.title}" từ ${creatorName} đã được mở khóa!`;
          
          await FcmNotificationService.sendPush(allTokens, notificationTitle, notificationBody);
        } else {
          console.warn(`[Time Capsule Scheduler] No FCM tokens found for recipients of Capsule ID: ${capsule.id}`);
        }

        // 4. Update status: update capsule state to prevent duplication
        await prisma.capsule.update({
          where: { id: capsule.id },
          data: {
            isNotified: true,
            isOpened: true,
            status: 'unlocked',
          },
        });

        console.log(`[Time Capsule Scheduler] [SUCCESS] Capsule ID: ${capsule.id} is notified and unlocked successfully.`);
      } catch (capsuleError) {
        console.error(`[Time Capsule Scheduler] [ERROR] Failed to process Capsule ID: ${capsule.id}:`, capsuleError);
      }
    }
  } catch (error) {
    console.error('[Time Capsule Scheduler] [FATAL ERROR] Failed to run database query/operation:', error);
  }
}

/**
 * Register and schedule the Cron Job
 */
function initCapsuleScheduler() {
  console.log('[Time Capsule Scheduler] Registering Cron Job for checking Capsules: Scheduled to run every minute (* * * * *).');
  
  cron.schedule('* * * * *', async () => {
    try {
      await runCapsuleCheckingJob();
    } catch (err) {
      console.error('[Time Capsule Scheduler] Unexpected error running cron job callback:', err);
    }
  });
}

module.exports = {
  initCapsuleScheduler,
  runCapsuleCheckingJob
};
