// Sends a notification to all FCM tokens for the given user via Supabase Edge Function
// showError/showSuccess are optional callbacks for UI feedback
async function sendNotificationToUser(userId, title, body, showError, showSuccess) {
  console.log('[sendNotificationToUser] START', { userId, title, body });
  try {
    const edgeUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/simplechat-api`;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const payload = { user_id: userId, title, body };
    console.log('[sendNotificationToUser] Fetching:', { edgeUrl, payload });
    const res = await fetch(edgeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify(payload),
    });
    let data;
    let text;
    try {
      text = await res.text();
      console.log('[sendNotificationToUser] Raw response text:', text);
      data = JSON.parse(text);
      console.log('[sendNotificationToUser] Parsed response JSON:', data);
    } catch (jsonErr) {
      console.error('[sendNotificationToUser] Failed to parse JSON:', jsonErr, 'Raw response:', text);
      if (showError) showError(`Invalid response from server: ${text || res.status}`);
      return;
    }
    console.log('[sendNotificationToUser] Response status:', res.status);
    if (!res.ok) {
      console.error('[sendNotificationToUser] Error response:', data);
      if (showError) showError(data.error || `Failed to send notification (status ${res.status})`);
    } else {
      console.log('[sendNotificationToUser] Notification sent successfully!');
      if (showSuccess) showSuccess("Notification sent to all devices!");
    }
  } catch (e) {
    console.error('[sendNotificationToUser] Exception:', e);
    if (showError) showError(e.message || "Failed to send notification");
  }
  console.log('[sendNotificationToUser] END');
}

export default sendNotificationToUser; 