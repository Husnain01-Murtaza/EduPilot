const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { accessibleCourseIds } = require('../utils/access');

const setupSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const decoded = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) return next(new Error('Unauthorized'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    // Personal room (grades, enrollment changes) + a room per accessible course
    socket.join(`user:${socket.user._id}`);
    const courseIds = await accessibleCourseIds(socket.user);
    courseIds.forEach((id) => socket.join(`course:${id}`));
  });
};

module.exports = { setupSocketHandlers };
