const { Notification } = require('../models/Transaction');
const { AppError }     = require('../middlewares/error.middleware');

exports.getAll = async (userId, q) => {
  const page  = Math.max(1, parseInt(q.page  ||1));
  const limit = Math.min(50, parseInt(q.limit ||20));
  const filter = { user:userId };
  if (q.unreadOnly==='true') filter.isRead = false;

  const [list, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt:-1 }).skip((page-1)*limit).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user:userId, isRead:false }),
  ]);
  return {
    data: list.map(n => ({ ...n, id:n._id.toString() })),
    total, page, limit,
    totalPages: Math.ceil(total/limit),
    unreadCount,
  };
};

exports.markRead = async (id, userId) => {
  const n = await Notification.findOneAndUpdate(
    { _id:id, user:userId }, { isRead:true }, { new:true }
  );
  if (!n) throw new AppError('Notification not found', 404);
  const obj = n.toObject(); obj.id = obj._id.toString(); return obj;
};

exports.markAllRead = async (userId) =>
  Notification.updateMany({ user:userId, isRead:false }, { isRead:true });
