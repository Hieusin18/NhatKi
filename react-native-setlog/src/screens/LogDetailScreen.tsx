import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Share,
  StatusBar
} from 'react-native';
import { useApp } from '../context/AppContext';
import { LogRoom, Clip } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOUR_SLOTS = ['Tất cả', '07:00', '11:00', '15:00', '18:00', '21:00'];

interface LogDetailScreenProps {
  room: LogRoom;
  onBack: () => void;
  onOpenCamera: (hourSlot: string) => void;
  onOpenPlayer: (clips: Clip[]) => void;
}

export const LogDetailScreen: React.FC<LogDetailScreenProps> = ({
  room,
  onBack,
  onOpenCamera,
  onOpenPlayer
}) => {
  const { currentUser, currentRoomClips, showToast } = useApp();
  const [selectedHour, setSelectedHour] = useState('Tất cả');

  // Filter clips by selected hour
  const filteredClips = selectedHour === 'Tất cả'
    ? currentRoomClips
    : currentRoomClips.filter((c) => c.hourSlot === selectedHour);

  const handleSharePin = async () => {
    try {
      await Share.share({
        message: `Tham gia phòng Log "${room.name}" trên SetLog với mã PIN: ${room.pinCode}`
      });
    } catch (err) {
      showToast(`Mã PIN phòng: ${room.pinCode}`);
    }
  };

  // Get current user's clip for selected hour or latest
  const myClip = currentRoomClips.find(
    (c) => c.memberId === currentUser?.id && (selectedHour === 'Tất cả' || c.hourSlot === selectedHour)
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0c0c0e" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.titleBox}>
          <Text style={styles.roomNameTitle}>
            {room.icon || '⚡'} {room.name}
          </Text>
          <TouchableOpacity style={styles.pinBadge} onPress={handleSharePin}>
            <Text style={styles.pinBadgeText}>PIN: {room.pinCode} 📋</Text>
          </TouchableOpacity>
        </View>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* DAILY VLOG PLAYER LAUNCH BANNER */}
        <TouchableOpacity
          style={styles.vlogBanner}
          onPress={() => {
            if (currentRoomClips.length === 0) {
              showToast('Chưa có clip nào trong phòng! Vui lòng quay clip đầu tiên.');
            } else {
              onOpenPlayer(currentRoomClips);
            }
          }}
        >
          <View style={styles.vlogBannerInner}>
            <View style={styles.playIconBox}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
            <View>
              <Text style={styles.vlogTitle}>XEM DAILY VLOG 2S</Text>

              <Text style={styles.vlogSubtitle}>
                {currentRoomClips.length > 0
                  ? `Ghép liền mạch ${currentRoomClips.length} clips 2.0s`
                  : 'Chưa có clip 2s nào hôm nay'}
              </Text>
            </View>
          </View>

          <View style={styles.clipCountBadge}>
            <Text style={styles.clipCountText}>{currentRoomClips.length} CLIPS</Text>
          </View>
        </TouchableOpacity>

        {/* TIMELINE HOUR FILTER TABS */}
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>TIMELINE KHUNG GIỜ</Text>
          <Text style={styles.filterActiveLabel}>{selectedHour}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourScroll}>
          {HOUR_SLOTS.map((hour) => (
            <TouchableOpacity
              key={hour}
              style={[styles.hourTab, selectedHour === hour && styles.hourTabActive]}
              onPress={() => setSelectedHour(hour)}
            >
              <Text style={[styles.hourTabText, selectedHour === hour && styles.hourTabTextActive]}>
                {hour}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 2X2 MEMBER SLOTS GRID */}
        <View style={styles.slotsGrid}>
          {/* SLOT 1: MY CAMERA SLOT */}
          <View style={styles.gridCell}>
            <View style={styles.cellHeaderOverlay}>
              <View style={styles.cellUserBadge}>
                <Text style={styles.cellUserBadgeText}>BẠN (ME)</Text>
              </View>
            </View>

            {myClip ? (
              <TouchableOpacity
                style={styles.cellClipContent}
                onPress={() => onOpenPlayer([myClip])}
              >
                <View style={styles.clipVideoPlaceholder}>
                  <Text style={styles.clipPlayBadge}>▶ PLAY 2S</Text>
                  <Text style={styles.clipCaptionText} numberOfLines={2}>
                    "{myClip.caption || 'Khoảnh khắc 2s'}"
                  </Text>
                  <Text style={styles.clipTimeText}>{myClip.hourSlot}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.cellEmptyTouch}
                onPress={() => onOpenCamera(selectedHour === 'Tất cả' ? '15:00' : selectedHour)}
              >
                <View style={styles.cameraIconCircle}>
                  <Text style={styles.cameraEmoji}>📸</Text>
                </View>
                <Text style={styles.cellEmptyTitle}>QUAY 2S VLOG</Text>
                <Text style={styles.cellEmptySubtitle}>Chưa đăng bài khung giờ này</Text>
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>+ Bấm để quay</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* CLIPS FROM MEMBERS */}
          {filteredClips
            .filter((c) => c.memberId !== currentUser?.id)
            .map((clip) => (
              <View key={clip.id} style={styles.gridCell}>
                <View style={styles.cellHeaderOverlay}>
                  <View style={styles.cellMemberBadge}>
                    <Text style={styles.cellMemberBadgeText}>
                      {clip.memberAvatar} {clip.memberName}
                    </Text>
                  </View>
                  <View style={styles.hourBadge}>
                    <Text style={styles.hourBadgeText}>{clip.hourSlot}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.cellClipContent}
                  onPress={() => onOpenPlayer([clip])}
                >
                  <View style={styles.clipVideoPlaceholderFriend}>
                    <Text style={styles.clipPlayBadge}>▶ 2S VLOG</Text>
                    <Text style={styles.clipCaptionText} numberOfLines={2}>
                      "{clip.caption || 'Khoảnh khắc'}"
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}

          {/* INVITE FRIEND SLOT */}
          <TouchableOpacity style={[styles.gridCell, styles.inviteCell]} onPress={handleSharePin}>
            <View style={styles.invitePlusBox}>
              <Text style={styles.invitePlusText}>+</Text>
            </View>
            <Text style={styles.inviteTitle}>MỜI BẠN BÈ</Text>
            <Text style={styles.inviteSubtitle}>Chia sẻ PIN {room.pinCode} để rủ bạn vào phòng</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0e',
    paddingTop: 50
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f23'
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111115',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#27272a',
    borderWidth: 1
  },
  backBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  titleBox: {
    alignItems: 'center'
  },
  roomNameTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff'
  },
  pinBadge: {
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#111115',
    borderColor: 'rgba(200,255,0,0.3)',
    borderWidth: 1,
    borderRadius: 8
  },
  pinBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#c8ff00',
    fontWeight: 'bold'
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40
  },
  vlogBanner: {
    backgroundColor: '#111115',
    borderColor: 'rgba(255,42,122,0.3)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  vlogBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  playIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff2a7a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  playIcon: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 2
  },
  vlogTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#fff'
  },
  vlogSubtitle: {
    fontSize: 10,
    color: '#a1a1aa',
    marginTop: 2
  },
  clipCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#c8ff00',
    borderRadius: 8
  },
  clipCountText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '900',
    color: '#000'
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  filterTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#71717a',
    letterSpacing: 1
  },
  filterActiveLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#c8ff00',
    fontWeight: 'bold'
  },
  hourScroll: {
    flexDirection: 'row',
    marginBottom: 16
  },
  hourTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#111115',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    marginRight: 8
  },
  hourTabActive: {
    backgroundColor: '#c8ff00',
    borderColor: '#c8ff00'
  },
  hourTabText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#a1a1aa',
    fontWeight: 'bold'
  },
  hourTabTextActive: {
    color: '#000'
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  gridCell: {
    width: (SCREEN_WIDTH - 52) / 2,
    aspectRatio: 3 / 4,
    borderRadius: 20,
    backgroundColor: '#111115',
    borderColor: '#1f1f23',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative'
  },
  cellHeaderOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10
  },
  cellUserBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  cellUserBadgeText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#ff2a7a'
  },
  cellMemberBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  cellMemberBadgeText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#fff'
  },
  hourBadge: {
    backgroundColor: '#c8ff00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  hourBadgeText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#000'
  },
  cellEmptyTouch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12
  },
  cameraIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,42,122,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  cameraEmoji: {
    fontSize: 20
  },
  cellEmptyTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff'
  },
  cellEmptySubtitle: {
    fontSize: 8,
    color: '#71717a',
    textAlign: 'center',
    marginTop: 2
  },
  actionBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(255,42,122,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  actionBadgeText: {
    fontSize: 9,
    color: '#ff2a7a',
    fontWeight: 'bold'
  },
  cellClipContent: {
    flex: 1
  },
  clipVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#18181c',
    padding: 12,
    justifyContent: 'flex-end',
    borderColor: '#ff2a7a',
    borderWidth: 1
  },
  clipVideoPlaceholderFriend: {
    flex: 1,
    backgroundColor: '#18181c',
    padding: 12,
    justifyContent: 'flex-end'
  },
  clipPlayBadge: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '900',
    color: '#c8ff00',
    marginBottom: 4
  },
  clipCaptionText: {
    fontSize: 11,
    color: '#fff',
    lineHeight: 14,
    fontWeight: '600'
  },
  clipTimeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#71717a',
    marginTop: 4
  },
  inviteCell: {
    borderStyle: 'dashed',
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  invitePlusBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111115',
    borderColor: '#27272a',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  invitePlusText: {
    fontSize: 20,
    color: '#a1a1aa'
  },
  inviteTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#a1a1aa'
  },
  inviteSubtitle: {
    fontSize: 8,
    color: '#52525b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 12
  }
});
