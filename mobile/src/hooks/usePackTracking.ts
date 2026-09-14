import { useState, useEffect, useCallback } from 'react';
import {
  IMemberLocationState,
  IPackStatusSummary,
  UserRole,
} from '@packleader/shared';
import { packTrackingService } from '../services/pack-tracking.service';
import { useAuth } from '../contexts/AuthContext';

export interface UsePackTrackingReturn {
  isTracking: boolean;
  packSummary: IPackStatusSummary | null;
  packMembers: IMemberLocationState[];
  selectedMember: IMemberLocationState | null;
  activeAlert: { message: string; type: string } | null;
  startTracking: (tripId: string, role?: UserRole) => Promise<void>;
  stopTracking: () => void;
  selectMember: (member: IMemberLocationState | null) => void;
  dismissAlert: () => void;
}

/**
 * Hook providing live pack tracking telemetry, member positions, and pack radar controls.
 */
export function usePackTracking(): UsePackTrackingReturn {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState<boolean>(packTrackingService.getIsTracking());
  const [packSummary, setPackSummary] = useState<IPackStatusSummary | null>(
    packTrackingService.getCurrentPackSummary()
  );
  const [selectedMember, setSelectedMember] = useState<IMemberLocationState | null>(null);
  const [activeAlert, setActiveAlert] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    const unsubPack = packTrackingService.onPackUpdate((summary) => {
      setPackSummary(summary);
      setIsTracking(packTrackingService.getIsTracking());
    });

    const unsubAlert = packTrackingService.onAlert((alert) => {
      setActiveAlert(alert);
    });

    return () => {
      unsubPack();
      unsubAlert();
    };
  }, []);

  const startTracking = useCallback(
    async (tripId: string, role: UserRole = UserRole.MEMBER) => {
      if (!user) {
        throw new Error('Must be authenticated to start live pack tracking');
      }
      await packTrackingService.startTracking(
        tripId,
        { id: user.id, name: user.name },
        role
      );
      setIsTracking(true);
    },
    [user]
  );

  const stopTracking = useCallback(() => {
    packTrackingService.stopTracking();
    setIsTracking(false);
  }, []);

  const selectMember = useCallback((member: IMemberLocationState | null) => {
    setSelectedMember(member);
  }, []);

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  return {
    isTracking,
    packSummary,
    packMembers: packSummary?.members || [],
    selectedMember,
    activeAlert,
    startTracking,
    stopTracking,
    selectMember,
    dismissAlert,
  };
}
