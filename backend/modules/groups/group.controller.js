const { getGroupActivities } = require('./group.service');

const getGroupActivitiesController = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page, limit } = req.query;

    if (!groupId) {
      return res.status(400).json({ success: false, message: 'groupId is required.' });
    }

    const data = await getGroupActivities({
      groupId,
      userId: req.user.id,
      page,
      limit,
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
  getGroupActivitiesController
};
