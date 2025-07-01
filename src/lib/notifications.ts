/**
 * Utility functions for handling browser notifications
 */

/**
 * Request permission to show browser notifications
 * @returns Promise that resolves to the permission status
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  // Check if the browser supports notifications
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return "denied";
  }

  // Check if we already have permission
  if (Notification.permission === "granted") {
    return "granted";
  }

  // Otherwise, ask for permission
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "denied";
  }
};

/**
 * Send a browser notification
 * @param title - The title of the notification
 * @param body - The body text of the notification
 * @param icon - Optional icon URL
 * @param onClick - Optional callback function when notification is clicked
 */
export const sendNotification = (
  title: string,
  body: string,
  icon?: string,
  onClick?: () => void
): void => {
  // Check if notifications are supported and permission is granted
  if (!("Notification" in window) || Notification.permission !== "granted") {
    console.log("Notifications not available or permission not granted");
    return;
  }

  try {
    // Create and show the notification
    const notification = new Notification(title, {
      body,
      icon: icon || "/favicon.ico", // Default to favicon
      silent: false,
    });

    // Set click handler if provided
    if (onClick) {
      notification.onclick = () => {
        onClick();
        notification.close();
        window.focus();
      };
    } else {
      // Default click behavior
      notification.onclick = () => {
        notification.close();
        window.focus();
      };
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}; 