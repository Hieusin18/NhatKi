const { register, login } = require('./auth.service');

const registerController = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

    const data = await register(username, email, password);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

    const data = await login(email, password);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

module.exports = { registerController, loginController };
