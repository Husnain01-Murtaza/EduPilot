// Socket.IO helpers: events are scoped to rooms, never broadcast globally.
const emitToCourse = (req, courseId, event, payload = {}) =>
  req.app.get('io').to(`course:${courseId}`).emit(event, { courseId: String(courseId), ...payload });

const emitToUser = (req, userId, event, payload = {}) =>
  req.app.get('io').to(`user:${userId}`).emit(event, payload);

module.exports = { emitToCourse, emitToUser };
