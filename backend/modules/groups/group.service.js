const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const normalizePagination = (page, limit) => {
  const parsedPage = Number.parseInt(page, 10);
  const parsedLimit = Number.parseInt(limit, 10);

  return {
    page: Number.isNaN(parsedPage) || parsedPage < 1 ? DEFAULT_PAGE : parsedPage,
    limit: Number.isNaN(parsedLimit) || parsedLimit < 1
      ? DEFAULT_LIMIT
      : Math.min(parsedLimit, MAX_LIMIT),
  };
};

const assertGroupMember = async (groupId, userId) => {
  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!membership) {
    const error = new Error('Bạn không có quyền xem lịch sử nhóm này.');
    error.statusCode = 403;
    throw error;
  }
};

const getGroupActivities = async ({ groupId, userId, page, limit }) => {
  const pagination = normalizePagination(page, limit);
  const skip = (pagination.page - 1) * pagination.limit;

  await assertGroupMember(groupId, userId);

  const [items, total] = await prisma.$transaction([
    prisma.groupActivity.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pagination.limit,
    }),
    prisma.groupActivity.count({
      where: { groupId },
    }),
  ]);

  return {
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

module.exports = {
  getGroupActivities
};
