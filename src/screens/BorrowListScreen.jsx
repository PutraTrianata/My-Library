import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { apiService } from '../services/api';

const COLORS = {
  background: '#F1F2ED', // Light Sage/Cream
  primary: '#656D4A',    // Dark Olive Green
  secondary: '#C2C5AA',  // Sage Green
  accent: '#414833',     // Deep Moss
  text: '#1A1A1A',       // Deep Charcoal
  textLight: '#545454',
  card: '#FFFFFF',
  border: '#C2C5AA',
  danger: '#800000',
  success: '#2E7D32',
};

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, serif',
});

export default function BorrowListScreen({ navigation }) {
  const [borrows, setBorrows] = useState([]);
  const [filteredBorrows, setFilteredBorrows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [finePerDay, setFinePerDay] = useState('');
  const [returnSummary, setReturnSummary] = useState({ title: '', totalFine: 0, isLate: false });

  useEffect(() => {
    fetchBorrows();
  }, []);

  const fetchBorrows = async () => {
    try {
      if (!refreshing) setLoading(true);
      const data = await apiService.get('/api/borrow');
      const list = Array.isArray(data) ? data : [];
      setBorrows(list);
      filterData(list, searchQuery);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterData = (list, query) => {
    const lowerQuery = query.toLowerCase();
    const filtered = list.filter(item => 
      (item.borrower_name?.toLowerCase() || '').includes(lowerQuery) ||
      (item.title?.toLowerCase() || '').includes(lowerQuery) ||
      (item.barcode?.toString() || '').includes(lowerQuery)
    );
    setFilteredBorrows(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    filterData(borrows, text);
  };

  const openReturnConfirm = (item) => {
    setSelectedBorrow(item);
    setFinePerDay('');
    setConfirmModalVisible(true);
  };

  const handleReturn = async () => {
    if (!selectedBorrow) return;

    const normalizedFine = Number(finePerDay.replace(/[^0-9]/g, ''));
    if (selectedBorrow.hariTerlambat > 0 && (!Number.isFinite(normalizedFine) || normalizedFine < 0 || !finePerDay.trim())) {
      const message = 'Masukkan nominal denda per hari yang valid.';
      if (Platform.OS === 'web') alert(`Peringatan: ${message}`);
      else Alert.alert('Peringatan', message);
      return;
    }

    const totalFine = selectedBorrow.hariTerlambat * normalizedFine;

    try {
      setLoading(true);
      await apiService.delete(`/api/borrow/${selectedBorrow.id}`);
      setConfirmModalVisible(false);
      setReturnSummary({
        title: selectedBorrow.title,
        totalFine,
        isLate: selectedBorrow.hariTerlambat > 0,
      });
      setSuccessModalVisible(true);
      setSelectedBorrow(null);
      setFinePerDay('');
      fetchBorrows();
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('Error: Gagal memproses data pengembalian.');
      } else {
        Alert.alert('Error', 'Gagal memproses data pengembalian.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.borrowCard, item.isTerlambat && styles.cardOverdue]}>
      <View style={styles.borrowInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.borrowerName} numberOfLines={1}>{item.borrower_name}</Text>
        </View>
        <Text style={styles.bookTitle}>📘 {item.title}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.dateInfo}>
            {new Date(item.borrow_date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})} › {item.return_date ? new Date(item.return_date).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '-'}
          </Text>
          <View style={styles.thinLine} />
          <Text style={[styles.statusText, item.isTerlambat && {color: COLORS.danger}]}>
            {item.isTerlambat ? 'TERLAMBAT' : 'AKTIF'}
          </Text>
        </View>
        {item.isTerlambat && (
          <Text style={styles.fineText}>TERLAMBAT {item.hariTerlambat} HARI</Text>
        )}
      </View>
      
      <View style={styles.actionColumn}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openReturnConfirm(item)}>
          <Text style={styles.actionEmoji}>✅</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerLabel}>LOG AKTIVITAS</Text>
          <Text style={styles.headerTitle}>Daftar Peminjaman</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari dalam arsip pinjam..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <View style={styles.searchBorder} />
      </View>

      <FlatList
        key={Platform.OS === 'web' ? 'web-grid' : 'mobile-list'}
        numColumns={Platform.OS === 'web' ? 2 : 1}
        columnWrapperStyle={Platform.OS === 'web' ? styles.columnWrapper : null}
        data={filteredBorrows}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchBorrows} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>Tidak ada sirkulasi literatur aktif.</Text>
        }
      />

      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.confirmCard}>
            <Text style={styles.modalTitle}>Konfirmasi Selesai</Text>
            <View style={styles.modalDivider} />
            <Text style={styles.confirmText}>
              Apakah literatur "{selectedBorrow?.title}" sudah dikembalikan oleh {selectedBorrow?.borrower_name}?
            </Text>
            {selectedBorrow?.hariTerlambat > 0 && (
              <View style={styles.fineInputGroup}>
                <Text style={styles.lateDaysText}>Keterlambatan: {selectedBorrow.hariTerlambat} hari</Text>
                <Text style={styles.fineInputLabel}>Denda per hari</Text>
                <TextInput
                  style={styles.fineInput}
                  placeholder="Contoh: 1000"
                  placeholderTextColor={COLORS.textLight}
                  value={finePerDay}
                  onChangeText={(value) => setFinePerDay(value.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
                <Text style={styles.totalFineText}>
                  Total denda: Rp {((Number(finePerDay) || 0) * selectedBorrow.hariTerlambat).toLocaleString('id-ID')}
                </Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, styles.cBtn]} onPress={() => { setConfirmModalVisible(false); setSelectedBorrow(null); setFinePerDay(''); }}>
                <Text style={styles.cBtnText}>BATAL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.sBtn]} onPress={handleReturn}>
                <Text style={styles.sBtnText}>KONFIRMASI</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Pengembalian Berhasil</Text>
            <Text style={styles.successMessage}>
              Buku &quot;{returnSummary.title}&quot; telah dikembalikan dan arsip peminjaman berhasil diselesaikan.
              {returnSummary.isLate ? ` Total denda: Rp ${returnSummary.totalFine.toLocaleString('id-ID')}.` : ''}
            </Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.successBtnText}>SELESAI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading && !refreshing && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color={COLORS.primary} /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 25, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { fontSize: 40, color: COLORS.primary, fontWeight: '300' },
  headerLabel: { fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 2 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.accent, fontFamily: serifFont },
  searchContainer: { paddingHorizontal: 25, marginBottom: 25 },
  searchInput: { paddingVertical: 10, color: COLORS.text, fontSize: 16, fontFamily: serifFont, fontStyle: 'italic' },
  searchBorder: { height: 1, backgroundColor: COLORS.primary, opacity: 0.3 },
  listContent: { paddingHorizontal: 25, paddingBottom: 40 },
  columnWrapper: { gap: 15, justifyContent: 'flex-start' },
  borrowCard: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.card, 
    padding: 20, 
    marginBottom: 15, 
    borderWidth: 0.5, 
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    alignItems: 'center',
    width: Platform.OS === 'web' ? 'calc(50% - 7.5px)' : '100%',
    maxWidth: Platform.OS === 'web' ? 'calc(50% - 7.5px)' : '100%',
  },
  cardOverdue: { borderLeftColor: COLORS.danger },
  borrowInfo: { flex: 1 },
  titleRow: { marginBottom: 4 },
  borrowerName: { fontSize: 17, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 0.3 },
  bookTitle: { fontSize: 13, color: COLORS.text, marginBottom: 8, fontStyle: 'italic' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateInfo: { fontSize: 11, color: COLORS.textLight, letterSpacing: 0.5 },
  thinLine: { width: 1, height: 10, backgroundColor: COLORS.border },
  statusText: { fontSize: 11, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  fineText: { fontSize: 11, fontWeight: 'bold', color: COLORS.danger, marginTop: 5, letterSpacing: 0.5 },
  actionColumn: { paddingLeft: 15, borderLeftWidth: 0.5, borderLeftColor: COLORS.border },
  actionBtn: { padding: 5 },
  actionEmoji: { fontSize: 22 },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textLight, fontStyle: 'italic' },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  confirmCard: { backgroundColor: COLORS.background, padding: 25, width: Platform.OS === 'web' ? 420 : '100%', borderLeftWidth: 6, borderLeftColor: COLORS.primary, alignItems: 'center' },
  confirmText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 0.5 },
  modalDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 15, width: '100%' },
  fineInputGroup: { width: '100%', marginBottom: 20 },
  lateDaysText: { color: COLORS.danger, fontWeight: 'bold', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  fineInputLabel: { color: COLORS.text, fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
  fineInput: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, color: COLORS.text, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  totalFineText: { color: COLORS.primary, fontSize: 13, fontWeight: 'bold', marginTop: 10, textAlign: 'right' },
  modalButtons: { flexDirection: 'row', gap: 15 },
  btn: { flex: 1, padding: 15, alignItems: 'center' },
  cBtn: { borderWidth: 1, borderColor: COLORS.primary },
  cBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  sBtn: { backgroundColor: COLORS.primary },
  sBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  successCard: { backgroundColor: COLORS.background, padding: 25, width: Platform.OS === 'web' ? 380 : '100%', borderLeftWidth: 6, borderLeftColor: COLORS.primary, alignItems: 'center' },
  successTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 },
  successMessage: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  successBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 2 },
  successBtnText: { color: '#FFF', fontWeight: 'bold', letterSpacing: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(241, 242, 237, 0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
});
