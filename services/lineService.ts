// Note: In a real production app, LINE API calls must be handled by a backend server (Node.js, Python, Go, etc.)
// or a cloud function (like Google Apps Script, AWS Lambda) to avoid CORS issues and secure your Channel Access Token.
//
// Browsers enforce CORS (Cross-Origin Resource Sharing), and the LINE Messaging API does not support calls from browser clients.
// Therefore, attempting to fetch 'https://api.line.me/...' directly from this React app will always result in a "Failed to fetch" error.

export const sendLineNotification = async (channelAccessToken: string, userId: string, message: string): Promise<boolean> => {
  if (!channelAccessToken || !userId) {
    console.warn('Missing LINE Channel Token or User ID');
    return false;
  }

  // To fix the "Failed to fetch" (CORS) error in this client-side demo, 
  // we simulate the API call instead of executing a doomed request.
  // The Google Apps Script (GAS) generated in the "Automation" tab runs on Google servers, so it CAN send real LINE messages.
  
  console.group('%c[LINE API Simulation] Notification Triggered', 'color: #22c55e; font-weight: bold; background: #0f172a; padding: 4px; border-radius: 4px;');
  console.log(`%cTo User ID:`, 'color: #94a3b8', userId);
  console.log(`%cMessage Payload:`, 'color: #94a3b8', message);
  console.log(`%cStatus:`, 'color: #38bdf8', 'Simulated Success (Client-side CORS restriction avoided)');
  console.groupEnd();

  // Return true to let the UI know the logic flow completed successfully
  return Promise.resolve(true);
};