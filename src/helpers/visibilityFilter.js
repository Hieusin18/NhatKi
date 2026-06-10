function buildVisibilityWhere(requesterId, ownerId = null) {
  const targetId = ownerId || requesterId;

  if (targetId === requesterId) {
    return { userId: requesterId };
  }

  return {
    userId:     targetId,
    visibility: 'public',
  };
}

module.exports = { buildVisibilityWhere };