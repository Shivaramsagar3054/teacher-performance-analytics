import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

interface NotificationButtonProps {
  iconColor?: string;
  iconSize?: number;
}

export function NotificationButton({
  iconColor = '#1e293b',
  iconSize = 28,
}: NotificationButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount, markAsSeen, refreshUnread } = useUnreadNotifications();

  // Refresh unread count whenever user returns to any screen
  useEffect(() => {
    refreshUnread();
  }, [pathname, refreshUnread]);

  const handlePress = async () => {
    await markAsSeen();
    router.push('/notifications');
  };

  return (
    <TouchableOpacity
      style={styles.notificationBtn}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={iconSize} color={iconColor} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  notificationBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#3b82f6', // Modern primary blue instead of red
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
