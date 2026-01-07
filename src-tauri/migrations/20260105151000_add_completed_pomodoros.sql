-- Add completed_pomodoros column
ALTER TABLE tasks ADD COLUMN completed_pomodoros INTEGER DEFAULT 0;

-- Backfill data: Count finished sessions for each task and update completed_pomodoros
UPDATE tasks 
SET completed_pomodoros = (
    SELECT COUNT(*) 
    FROM sessions 
    WHERE sessions.task_id = tasks.id AND sessions.finished = 1
);

-- Trigger: After INSERT on sessions
CREATE TRIGGER update_completed_pomodoros_insert
AFTER INSERT ON sessions
WHEN NEW.finished = 1 AND NEW.task_id IS NOT NULL
BEGIN
    UPDATE tasks 
    SET completed_pomodoros = completed_pomodoros + 1
    WHERE id = NEW.task_id;
END;

-- Trigger: After UPDATE on sessions (marking as finished)
CREATE TRIGGER update_completed_pomodoros_update_finished
AFTER UPDATE OF finished ON sessions
WHEN NEW.finished = 1 AND OLD.finished = 0 AND NEW.task_id IS NOT NULL
BEGIN
    UPDATE tasks 
    SET completed_pomodoros = completed_pomodoros + 1
    WHERE id = NEW.task_id;
END;

-- Trigger: After UPDATE on sessions (marking as unfinished)
CREATE TRIGGER update_completed_pomodoros_update_unfinished
AFTER UPDATE OF finished ON sessions
WHEN NEW.finished = 0 AND OLD.finished = 1 AND NEW.task_id IS NOT NULL
BEGIN
    UPDATE tasks 
    SET completed_pomodoros = MAX(0, completed_pomodoros - 1)
    WHERE id = NEW.task_id;
END;

-- Trigger: After DELETE on sessions
CREATE TRIGGER update_completed_pomodoros_delete
AFTER DELETE ON sessions
WHEN OLD.finished = 1 AND OLD.task_id IS NOT NULL
BEGIN
    UPDATE tasks 
    SET completed_pomodoros = MAX(0, completed_pomodoros - 1)
    WHERE id = OLD.task_id;
END;

-- Trigger: After UPDATE on sessions (changing task_id)
-- If moving FROM a task TO another task (both finished)
CREATE TRIGGER update_completed_pomodoros_move_task
AFTER UPDATE OF task_id ON sessions
WHEN NEW.finished = 1 AND OLD.finished = 1
BEGIN
    UPDATE tasks 
    SET completed_pomodoros = MAX(0, completed_pomodoros - 1)
    WHERE id = OLD.task_id;

    UPDATE tasks 
    SET completed_pomodoros = completed_pomodoros + 1
    WHERE id = NEW.task_id;
END;
