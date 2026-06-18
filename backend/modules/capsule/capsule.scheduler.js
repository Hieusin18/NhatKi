const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class NotificationLogService {
  static async createCapsuleUnlockedLogs(tx, userIds, capsule, title, body) {
    if (userIds.length === 0) {
      return { count: 0 };
    }

    const sentAt = new Date();

    return tx.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        capsuleId: capsule.id,
        type: 'capsule_unlocked',
        title,
        body,
        channel: 'push',
        status: 'sent',
        sentAt,
        metadata: JSON.stringify({
          capsule_id: capsule.id,
          capsule_title: capsule.title,
          creator_id: capsule.userId,
        }),
      })),
    });
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

        const notificationTitle = 'Time Capsule Mở Khóa!';
        const notificationBody = `Time Capsule "${capsule.title}" từ ${creatorName} đã được mở khóa!`;

        await prisma.$transaction(async (tx) => {
          // Claim the capsule atomically.
          const updateCount = await tx.capsule.updateMany({
            where: {
              id: capsule.id,
              isNotified: false,
            },
            data: {
              isNotified: true,
              isOpened: true,
              status: 'unlocked',
            },
          });

          if (updateCount.count === 0) {
            throw new Error('ALREADY_PROCESSED');
          }

          // Identify all recipient User IDs
          const recipientUserIds = new Set();
          
          // Add creator
          recipientUserIds.add(capsule.userId);

          // Add receiver if specified
          if (capsule.receiverId) {
            recipientUserIds.add(capsule.receiverId);
          }

          // Fetch groups the creator belongs to
          const creatorGroups = await tx.groupMember.findMany({
            where: { userId: capsule.userId },
          });

          const groupIds = creatorGroups.map(g => g.groupId);

          if (groupIds.length > 0) {
            // Fetch all members in those groups
            const relatedGroupMembers = await tx.groupMember.findMany({
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

          const result = await NotificationLogService.createCapsuleUnlockedLogs(
            tx,
            userIdsToNotify,
            capsule,
            notificationTitle,
            notificationBody
          );

          console.log(`[Time Capsule Scheduler] Stored ${result.count} notification log(s) for Capsule ID: ${capsule.id}.`);
        });

        console.log(`[Time Capsule Scheduler] [SUCCESS] Capsule ID: ${capsule.id} is notified and unlocked successfully.`);
      } catch (capsuleError) {
        if (capsuleError.message === 'ALREADY_PROCESSED') {
          console.log(`[Time Capsule Scheduler] Capsule ID: ${capsule.id} was already processed/claimed by another job instance. Skipping.`);
        } else {
          console.error(`[Time Capsule Scheduler] [ERROR] Failed to process Capsule ID: ${capsule.id}:`, capsuleError);
        }
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
