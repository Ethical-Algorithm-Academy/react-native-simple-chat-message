// Utility functions for chat
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

export function groupMessagesWithSections(messages) {
  if (!messages.length) return [];
  const now = new Date();
  const todayStr = now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
  const groups = {};
  messages.forEach(msg => {
    const dateObj = new Date(msg.sent_at);
    const dateStr = dateObj.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(msg);
  });
  // Build the array with section headers
  const result = [];
  Object.keys(groups).sort((a, b) => new Date(a) - new Date(b)).forEach(dateStr => {
    result.push({ section: true, dateStr, label: dateStr === todayStr ? 'Today' : dateStr });
    result.push(...groups[dateStr]);
  });
  return result;
} 