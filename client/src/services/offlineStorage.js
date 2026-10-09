// offline sync
    if(req.body.lastKnownUpdatedAt && !req.body.force) {
      const clientTimestamp = new Date(req.body.lastKnownUpdatedAt).getTime();
      const serverTimestamp = new Date(task.UpdatedAt).getTime();
      if (serverTimestamp - clientTimestamp > 1000) {
        const currentTask = await Task.findById(task._id)
          .populate('assignee','name email role department avatar')
          .populate('creator','name email role department avatar')
          .populate('comments.user','name email role department avatar');
        return res.status(409).json({
          success: false,
          conflict: true,
          message: 'Conflict detected: Task has been updated on the server since you went offline.',
          serverTask: currentTask,
        });
      }

    }