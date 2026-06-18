const cloudinary = require('./cloudinary.helper');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const uploadToCloudinary = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload returned undefined result.'));
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

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

const parseDateFilter = (value, fieldName) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${fieldName} is invalid.`);
    error.statusCode = 400;
    throw error;
  }

  return date;
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
    const error = new Error('Bạn không có quyền xem media của nhóm này.');
    error.statusCode = 403;
    throw error;
  }
};

const searchMedia = async ({ groupId, requesterId, ownerId, startDate, endDate, page, limit }) => {
  if (!groupId) {
    const error = new Error('groupId is required.');
    error.statusCode = 400;
    throw error;
  }

  await assertGroupMember(groupId, requesterId);

  const pagination = normalizePagination(page, limit);
  const skip = (pagination.page - 1) * pagination.limit;
  const createdAt = {};
  const parsedStartDate = parseDateFilter(startDate, 'startDate');
  const parsedEndDate = parseDateFilter(endDate, 'endDate');

  if (parsedStartDate) {
    createdAt.gte = parsedStartDate;
  }

  if (parsedEndDate) {
    createdAt.lte = parsedEndDate;
  }

  const where = {
    groupId,
    ...(ownerId ? { ownerId } : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pagination.limit,
    }),
    prisma.media.count({ where }),
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

const createMediaRecord = async ({ cloudinaryResult, ownerId, groupId }) => {
  await assertGroupMember(groupId, ownerId);

  return prisma.media.create({
    data: {
      publicId: cloudinaryResult.public_id,
      url: cloudinaryResult.secure_url,
      resourceType: cloudinaryResult.resource_type,
      format: cloudinaryResult.format,
      sizeBytes: cloudinaryResult.bytes,
      ownerId,
      groupId,
    },
  });
};

module.exports = {
  uploadToCloudinary,
  searchMedia,
  createMediaRecord,
  assertGroupMember
};
