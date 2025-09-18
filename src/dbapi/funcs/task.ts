import { invoke } from "@tauri-apps/api/core";
import type { RecurrenceType } from "../../defines/recur.ts";

interface taskInsert {
  title: string;
  category_id: number;
  estimated_cycles: number;
  estimated_duration_seconds: number | null;
  is_recurring: RecurrenceType;
  series_id: number | null;
  completed: boolean;
  description: string | null;
  // cut out timezone
  deadline: string;
  created_at: null;
  updated_at: null;
}

export interface DatabaseCategory {
  id: number;
  name: string;
  color?: string;
}

export const getCategoriesByName = async (category_name: string) => {
  const cat: DatabaseCategory = await invoke(
    "categories_get_category_by_name",
    {
      cat_name: category_name
    }
  );

  if (cat) {
    return cat;
  } else {
    return null;
  }
};

export const createNewCategory = async (category_name: string) => {
  const newCat: DatabaseCategory = {
    id: 0,
    name: category_name
  };
  let cat_id: number;
  try {
    cat_id = await invoke("categories_add_category", {
      cat: newCat
    });
  } catch (err) {
    console.error(err);
    return null;
  }

  return cat_id;
};

export const addNewTask = async (task: taskInsert) => {
  let task_id: number;
  try {
    task_id = await invoke("task_add_task", { task: task });
  } catch (err) {
    console.error(err);
    return null;
  }

  return task_id;
};

interface ruleInsert {
  task_id: number;
  rrule: string;
  dtstart: string;
  until: string;
  timezone: string;
}

export const addNewRecurrenceRule = async (rule: ruleInsert) => {
  let rule_id: number;
  try {
    rule_id = await invoke("task_add_rule", {
      task_id: rule.task_id,
      rrule: rule.rrule,
      dtstart: rule.dtstart,
      until: rule.until,
      timezone: rule.timezone
    });
  } catch (err) {
    console.error(err);
    return null;
  }

  return rule_id;
};

// only updates task, not recurrance rules
export const updateTask = async (newTask: taskInsert) => {
  let task_id = 0;
  try {
    task_id = await invoke("task_update_task", { task: newTask });
  } catch (err) {
    console.error(err);
    return null;
  }
  return task_id;
};

export const updateRecurrence = async (
  task_id: number,
  newRule: ruleInsert
) => {
  let rule_id = 0;
  try {
    // fetch the old rule for task
    const old_rule_id = await invoke("task_get_rules_for_task", {
      task_id: task_id
    });

    // insert new rule
    rule_id = await invoke("task_update_rule", {
      rule_id: old_rule_id,
      rrule: newRule.rrule,
      dtstart: newRule.dtstart,
      until: newRule.until,
      timezone: newRule.timezone
    });
  } catch (err) {
    console.error(err);
    return null;
  }
  return rule_id;
};

export const deleteTaskRule = async (rule_id: number) => {
  try {
    await invoke("task_delete_rule", {
      rule_id: rule_id
    });
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
};
