class PushNotificationService {
  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  async ensurePermission() {
    if (!this.isSupported()) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return Notification.requestPermission();
  }

  async show(title, options = {}) {
    const permission = await this.ensurePermission();
    if (permission !== 'granted') return false;

    new Notification(title, {
      body: options.body || '',
      icon: options.icon || '/vite.svg',
      tag: options.tag || 'hound-heart-notification',
      requireInteraction: !!options.requireInteraction,
    });

    return true;
  }

  async showStressAlert(dogName = 'your dog') {
    return this.show('Stress Alert', {
      body: `High stress detected. Please check in with ${dogName}.`,
      tag: 'hound-heart-stress-alert',
      requireInteraction: true,
    });
  }

  async showBackfillResult(successCount, failedCount) {
    const body = failedCount > 0
      ? `Calendar backfill done: ${successCount} succeeded, ${failedCount} failed.`
      : `Calendar backfill complete for ${successCount} days.`;

    return this.show('Calendar Update', {
      body,
      tag: 'hound-heart-calendar-backfill',
    });
  }
}

export default new PushNotificationService();