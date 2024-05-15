const hookshotUrl = process.env.HOOKSHOT_URL;

/*
 * Call Hookshot webhook with a message.
 * @param message - Markdown message to send to the webhook.
 */
export const notifyWebhook = async (message: string) => {
  if (!hookshotUrl) {
    return;
  }

  try {
    await fetch(hookshotUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: message }),
    });
  } catch (error) {
    console.error('Failed to notify webhook:', error);
  }
}
