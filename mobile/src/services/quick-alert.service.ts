import { SocketEvents, IQuickAlert, QuickAlertType } from '@packleader/shared';
import { getSocket } from './socket.service';

type QuickAlertCallback = (alert: IQuickAlert) => void;

/**
 * Service managing real-time convoy quick alerts.
 */
class QuickAlertService {
  private alertListeners = new Set<QuickAlertCallback>();
  private isListening = false;

  public initListeners(): void {
    if (this.isListening) return;
    const socket = getSocket();
    if (socket) {
      socket.on(SocketEvents.QUICK_ALERT_BROADCAST, (alert: IQuickAlert) => {
        this.notifyListeners(alert);
      });
      this.isListening = true;
    }
  }

  public sendAlert(
    tripId: string,
    type: QuickAlertType,
    user: { id: string; name: string; role?: string },
    coords?: { latitude: number; longitude: number },
    customMessage?: string
  ): void {
    const socket = getSocket();
    if (!socket?.connected) {
      console.warn('[QuickAlert] Socket offline; alert cannot be broadcast');
      return;
    }

    const payload: Partial<IQuickAlert> = {
      tripId,
      type,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      message: customMessage || this.getDefaultMessage(type),
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    };

    socket.emit(SocketEvents.QUICK_ALERT_SEND, payload);
  }

  public onAlert(callback: QuickAlertCallback): () => void {
    this.alertListeners.add(callback);
    this.initListeners();
    return () => {
      this.alertListeners.delete(callback);
    };
  }

  private notifyListeners(alert: IQuickAlert): void {
    this.alertListeners.forEach((cb) => {
      try {
        cb(alert);
      } catch (err) {
        console.warn('[QuickAlert] Listener error:', err);
      }
    });
  }

  private getDefaultMessage(type: QuickAlertType): string {
    switch (type) {
      case QuickAlertType.LOW_FUEL:
        return '⛽ Low Fuel: Rider needs to refuel soon';
      case QuickAlertType.OBSTACLE_AHEAD:
        return '⚠️ Obstacle Ahead: Road hazard or debris detected';
      case QuickAlertType.PULL_OVER:
        return '🛑 Pull Over: Need immediate stop at safe shoulder';
      case QuickAlertType.REGROUP:
        return '🔄 Regroup: Reduce pace and close formation';
      case QuickAlertType.HAZARD_WEATHER:
        return '🌧️ Weather Hazard: Slick conditions or low visibility ahead';
      case QuickAlertType.POLICE_TRAP:
        return '🚔 Police Ahead: Speed enforcement checkpoint observed';
      default:
        return 'Pack Alert Broadcast';
    }
  }
}

export const quickAlertService = new QuickAlertService();
