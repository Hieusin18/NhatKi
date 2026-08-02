import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useApp } from '../context/AppContext';
import { LogRoom } from '../types';

const THEME_OPTIONS = ['Đời Thường', 'Chăm Chỉ', 'Chill', 'Thể Thao', 'Du Lịch'];
const ICON_OPTIONS = ['⚡', '🔥', '🌸', '🚀', '☕', '🎮', '🏀', '🎬'];

interface HomeScreenProps {
  onSelectRoom: (room: LogRoom) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectRoom }) => {
  const { currentUser, userRooms, logout, createRoom, joinRoomByPin, showToast } = useApp();

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Form States
  const [roomName, setRoomName] = useState('');
  const [roomTheme, setRoomTheme] = useState('Đời Thường');
  const [roomIcon, setRoomIcon] = useState('⚡');
  const [maxMembers, setMaxMembers] = useState(12);

  const [pinCodeInput, setPinCodeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateRoomSubmit = async () => {
    if (!roomName.trim()) {
      showToast('Vui lòng nhập tên phòng Log!');
      return;
    }
    setSubmitting(true);
    try {
      const room = await createRoom(roomName.trim(), roomTheme, roomIcon, maxMembers);
      setShowCreateModal(false);
      setRoomName('');
      onSelectRoom(room);
    } catch (err: any) {
      showToast(err?.message || 'Không thể tạo phòng!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinRoomSubmit = async () => {
    if (!pinCodeInput.trim()) {
      showToast('Vui lòng nhập mã PIN phòng!');
      return;
    }
    setSubmitting(true);
    try {
      const room = await joinRoomByPin(pinCodeInput.trim());
      setShowJoinModal(false);
      setPinCodeInput('');
      onSelectRoom(room);
    } catch (err: any) {
      showToast(err?.message || 'Không tìm thấy phòng!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0c0c0e" />

      {/* TOP USER BAR */}
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatarBox}>
            <Text style={styles.userAvatarText}>{currentUser?.avatarUrl || '😎'}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{currentUser?.displayName || 'Member'}</Text>
            <Text style={styles.userEmail}>{currentUser?.email}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* BANNER / INTRO */}
        <View style={styles.bannerBox}>
          <View style={styles.bannerHeaderRow}>
            <Text style={styles.bannerTitle}>Group Log Rooms 👥</Text>
            <View style={styles.badgeLive}>
              <View style={styles.dotLive} />
              <Text style={styles.textLive}>REALTIME</Text>
            </View>
          </View>
          <Text style={styles.bannerSubtitle}>
            Tạo phòng nhóm tối đa 12 thành viên để cùng nhau quay 2s Vlog mỗi ngày. Dữ liệu đồng bộ tức thì trên thiết bị của bạn bè!
          </Text>
        </View>

        {/* ACTION BUTTONS ROW */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnCreate]}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.actionBtnIcon}>✨</Text>
            <Text style={styles.actionBtnTitleCreate}>Tạo phòng mới</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnJoin]}
            onPress={() => setShowJoinModal(true)}
          >
            <Text style={styles.actionBtnIcon}>🔑</Text>
            <Text style={styles.actionBtnTitleJoin}>Nhập mã PIN</Text>
          </TouchableOpacity>
        </View>

        {/* ROOMS LIST SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PHÒNG LOG CỦA BẠN ({userRooms.length})</Text>
        </View>

        {userRooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏕️</Text>
            <Text style={styles.emptyTitle}>Chưa tham gia phòng nào</Text>
            <Text style={styles.emptyDesc}>
              Hãy tạo phòng mới hoặc nhập mã PIN từ bạn bè để bắt đầu lưu giữ khoảnh khắc Daily Vlog!
            </Text>
          </View>
        ) : (
          <View style={styles.roomsGrid}>
            {userRooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.roomCard}
                onPress={() => onSelectRoom(room)}
              >
                <View style={styles.roomCardLeft}>
                  <View style={styles.roomIconBox}>
                    <Text style={styles.roomIconText}>{room.icon || '⚡'}</Text>
                  </View>
                  <View style={styles.roomInfo}>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <View style={styles.roomSubRow}>
                      <Text style={styles.roomTheme}>{room.theme}</Text>
                      <Text style={styles.dotDivider}>•</Text>
                      <Text style={styles.pinText}>PIN: {room.pinCode}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.roomCardRight}>
                  <View style={styles.activeClipsBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeClipsText}>{room.activeClipsCount || 0} clips</Text>
                  </View>
                  <Text style={styles.membersCountText}>
                    {(room.members || []).length}/{room.maxMembers || 12} 👤
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* CREATE ROOM MODAL */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Tạo phòng Log mới</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>TÊN PHÒNG</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: Team Sài Gòn Vlog"
                  placeholderTextColor="#52525b"
                  value={roomName}
                  onChangeText={setRoomName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CHỦ ĐỀ</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {THEME_OPTIONS.map((theme) => (
                    <TouchableOpacity
                      key={theme}
                      style={[styles.chip, roomTheme === theme && styles.chipActive]}
                      onPress={() => setRoomTheme(theme)}
                    >
                      <Text style={[styles.chipText, roomTheme === theme && styles.chipTextActive]}>
                        {theme}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>BIỂU TƯỢNG</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {ICON_OPTIONS.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[styles.chip, roomIcon === icon && styles.chipActive]}
                      onPress={() => setRoomIcon(icon)}
                    >
                      <Text style={styles.iconEmoji}>{icon}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateRoomSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>TẠO PHÒNG VÀ LẤY MÃ PIN</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* JOIN ROOM MODAL */}
      <Modal visible={showJoinModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔑 Tham gia phòng qua PIN</Text>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContent}>
              <Text style={styles.joinDesc}>
                Nhập mã PIN 6 ký tự được chia sẻ bởi chủ phòng để tham gia nhóm:
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>MÃ PIN PHÒNG</Text>
                <TextInput
                  style={[styles.input, styles.pinInput]}
                  placeholder="X8K9L2"
                  placeholderTextColor="#52525b"
                  autoCapitalize="characters"
                  maxLength={6}
                  value={pinCodeInput}
                  onChangeText={setPinCodeInput}
                />
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtnJoin}
                onPress={handleJoinRoomSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitBtnTextJoin}>THAM GIA NGAY</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0e',
    paddingTop: 50
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f23'
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  userAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111115',
    borderColor: '#27272a',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  userAvatarText: {
    fontSize: 20
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  },
  userEmail: {
    fontSize: 10,
    color: '#71717a'
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#111115',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12
  },
  logoutBtnText: {
    fontSize: 11,
    color: '#f87171',
    fontWeight: '600'
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40
  },
  bannerBox: {
    backgroundColor: 'rgba(200,255,0,0.03)',
    borderColor: 'rgba(200,255,0,0.2)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#c8ff00'
  },
  badgeLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  dotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e'
  },
  textLive: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#22c55e'
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#a1a1aa',
    lineHeight: 16
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  actionBtnCreate: {
    backgroundColor: '#c8ff00'
  },
  actionBtnJoin: {
    backgroundColor: '#ff2a7a'
  },
  actionBtnIcon: {
    fontSize: 18
  },
  actionBtnTitleCreate: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000'
  },
  actionBtnTitleJoin: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff'
  },
  sectionHeader: {
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#71717a',
    letterSpacing: 1.5
  },
  emptyState: {
    backgroundColor: '#111115',
    borderColor: '#1f1f23',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center'
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  emptyDesc: {
    fontSize: 11,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 240
  },
  roomsGrid: {
    gap: 12
  },
  roomCard: {
    backgroundColor: '#111115',
    borderColor: '#1f1f23',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  roomCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  roomIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0c0c0e',
    borderColor: '#27272a',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  roomIconText: {
    fontSize: 22
  },
  roomInfo: {
    gap: 2
  },
  roomName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  },
  roomSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  roomTheme: {
    fontSize: 10,
    color: '#ff2a7a',
    fontWeight: '600'
  },
  dotDivider: {
    color: '#52525b',
    fontSize: 10
  },
  pinText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#c8ff00',
    fontWeight: 'bold'
  },
  roomCardRight: {
    alignItems: 'flex-end',
    gap: 4
  },
  activeClipsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#22c55e'
  },
  activeClipsText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#22c55e',
    fontWeight: 'bold'
  },
  membersCountText: {
    fontSize: 10,
    color: '#71717a'
  },

  // MODAL STYLES
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#0c0c0e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#1f1f23',
    padding: 20,
    paddingBottom: 40
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  modalClose: {
    fontSize: 18,
    color: '#a1a1aa',
    padding: 4
  },
  formContent: {
    gap: 16
  },
  joinDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 18
  },
  inputGroup: {
    gap: 6
  },
  label: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#71717a',
    letterSpacing: 1
  },
  input: {
    backgroundColor: '#111115',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14
  },
  pinInput: {
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#c8ff00',
    textAlign: 'center',
    letterSpacing: 4
  },
  chipRow: {
    flexDirection: 'row'
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#111115',
    borderColor: '#27272a',
    borderWidth: 1,
    marginRight: 8
  },
  chipActive: {
    borderColor: '#c8ff00',
    backgroundColor: 'rgba(200,255,0,0.1)'
  },
  chipText: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '600'
  },
  chipTextActive: {
    color: '#c8ff00',
    fontWeight: 'bold'
  },
  iconEmoji: {
    fontSize: 18
  },
  modalSubmitBtn: {
    backgroundColor: '#c8ff00',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  modalSubmitBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5
  },
  modalSubmitBtnJoin: {
    backgroundColor: '#ff2a7a',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  modalSubmitBtnTextJoin: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5
  }
});
