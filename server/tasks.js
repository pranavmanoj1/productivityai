// tasks.js
const { createClient } = require('@supabase/supabase-js');

// If you want to keep a dedicated Supabase client here:
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * fetchTasks
 * Fetch tasks from Supabase for a given user, possibly sorted or filtered.
 *
 * @param {string} userId - The user’s Supabase user ID
 * @param {string} sortBy - Which field to filter/sort by (e.g. "today", "dueDate", etc.)
 * @returns {Promise<Array>} - Array of task objects, or an empty array if error
 */
async function fetchTasks(userId, sortBy) {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);

  // Add filters/sorts based on sortBy
  if (sortBy === 'today') {
    const today = new Date().toISOString().slice(0, 10);
    query = query.eq('due_date', today);
  } else if (sortBy === 'thisWeek') {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const todayStr = today.toISOString().slice(0, 10);
    const nextWeekStr = nextWeek.toISOString().slice(0, 10);
    query = query.gte('due_date', todayStr).lte('due_date', nextWeekStr);
  } else if (sortBy === 'thisMonth') {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
    const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    query = query.gte('due_date', firstDay).lte('due_date', lastDay);
  } else if (sortBy === 'priority') {
    query = query.order('priority', { ascending: false });
  } else if (sortBy === 'dueDate') {
    query = query.order('due_date', { ascending: true });
  } else if (sortBy === 'dueTime') {
    query = query.order('due_time', { ascending: true });
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return data;
}

module.exports = { fetchTasks };
