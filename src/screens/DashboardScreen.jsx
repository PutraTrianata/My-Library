import React, { useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  ScrollView,
  Image,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const COLORS = {
  // Background utama tetap baby blue
  background: '#C9D8F0',

  // Biru utama
  primary: '#252B78',
  secondary: '#3B5FBF',

  // Warna card
  card: '#303A8C',
  cardDark: '#252B78',
  cardLight: '#4353A3',

  // Aksen sedikit saja
  accent: '#F4C542',

  // Text
  white: '#FFFFFF',
  text: '#FFFFFF',
  textLight: '#D9E2F3',

  // Border & hover
  border: '#7184B8',
  highlight: '#4353A3',

  success: '#2E9B62',
  danger: '#D64545',
};

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, "Times New Roman", serif',
});

const QUOTES = [
  'Ilmu adalah harta yang tidak akan pernah habis.',
  'Membaca adalah jendela dunia yang abadi.',
  'Ketelitian adalah kunci dari kearsipan yang sempurna.',
  'Perpustakaan adalah tempat penyimpanan peradaban.',
];

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [stats, setStats] = useState({ activeBorrows: 0, totalBooks: 0, overdue: 0 });

  const todayQuote = QUOTES[new Date().getDay() % QUOTES.length];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Sore';

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [booksData, borrowsData] = await Promise.all([
          apiService.get('/api/books'),
          apiService.get('/api/borrow'),
        ]);

        const books = Array.isArray(booksData) ? booksData : [];
        const borrows = Array.isArray(borrowsData) ? borrowsData : [];

        setStats({
          activeBorrows: borrows.length,
          totalBooks: books.length,
          overdue: borrows.filter((item) => item.isTerlambat).length,
        });
      } catch (error) {
        console.error('[DASHBOARD STATS ERROR]', error.message);
      }
    };

    fetchStats();
    const unsubscribe = navigation.addListener('focus', fetchStats);
    return unsubscribe;
  }, [navigation]);

  const renderStats = (isMobile = false) => (
    <View style={[styles.statsContainer, isMobile && styles.statsContainerMobile]}>
      <View style={styles.statBox}>
        <Text style={[styles.statNumber, isMobile && styles.statNumberMobile]}>{stats.activeBorrows}</Text>
        <Text style={styles.statLabel}>ARSIP PINJAM</Text>
      </View>
      <View style={isMobile ? styles.statDividerVertical : styles.statDivider} />
      <View style={styles.statBox}>
        <Text style={[styles.statNumber, isMobile && styles.statNumberMobile]}>{stats.totalBooks}</Text>
        <Text style={styles.statLabel}>TOTAL KOLEKSI</Text>
      </View>
      <View style={isMobile ? styles.statDividerVertical : styles.statDivider} />
      <View style={styles.statBox}>
        <Text style={[styles.statNumber, isMobile && styles.statNumberMobile]}>{stats.overdue}</Text>
        <Text style={styles.statLabel}>TELAT KEMBALI</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header/Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navbarContent}>
          <View style={styles.navLeft}>
  <Image
    source={require('../../assets/logo sekolah.png')}
    style={styles.schoolLogo}
  />

  <View>
    <Text style={styles.schoolName}>
      SMP PGRI 2 DRIYOREJO
    </Text>

    <Text style={styles.navLogo}>
      MyLibrary
    </Text>
  </View>
</View>
          <View style={styles.navRight}>
            <View style={styles.userInfo}>
              <Text style={styles.navUser}>{user?.name}</Text>
            </View>
            <TouchableOpacity 
              style={styles.navAvatar} 
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.navAvatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
      >
        <Animated.View style={[styles.mainLayout, { opacity: fadeAnim }]}>
          
          <View style={styles.contentArea}>
            <View style={styles.welcomeSection}>
              <Text style={styles.greetingText}>{greeting.toUpperCase()}</Text>
              <Text style={styles.userNameText}>{user?.name}</Text>
              <View style={styles.accentLine} />
            </View>

            {/* Statistik Cepat untuk Mobile */}
            {Platform.OS !== 'web' && (
              <View style={styles.mobileStatsCard}>
                <Text style={styles.sideCardTitle}>Statistik Cepat</Text>
                {renderStats(true)}
              </View>
            )}

            <View style={styles.heroCard}>
  <View style={styles.heroInfo}>
    
    <Text style={styles.heroTag}>
      IKHTISAR SISTEM
    </Text>

    <Text style={styles.heroTitle}>
      Pusat Kendali Literatur
    </Text>

    <Text style={styles.heroSubtitle}>
      Kelola sirkulasi, data buku, dan kearsipan dalam satu antarmuka terintegrasi.
    </Text>

    <View style={styles.heroActions}>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.navigate('Borrow')}
        activeOpacity={0.7}
      >
        <Text style={styles.primaryBtnText}>
          MULAI TRANSAKSI
        </Text>
      </TouchableOpacity>
    </View>

  </View>
</View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Layanan Utama</Text>
              <View style={styles.titleLine} />
            </View>
            
            <View style={styles.menuGrid}>
              {[
                { title: 'Peminjaman', icon: '📖', screen: 'Borrow', desc: 'Arsipkan transaksi baru' },
                { title: 'Daftar Pinjam', icon: '📋', screen: 'BorrowList', desc: 'Pantau status & tenggat' },
                { title: 'Registrasi Buku', icon: '🖋️', screen: 'Scan', desc: 'Input koleksi literatur' },
                { title: 'Katalog Koleksi', icon: '🏛️', screen: 'BookList', desc: 'Eksplorasi arsip lengkap' },
              ].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    hoveredIndex === index && styles.menuItemHovered
                  ]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.8}
                  {...(Platform.OS === 'web' ? {
                    onMouseEnter: () => setHoveredIndex(index),
                    onMouseLeave: () => setHoveredIndex(null)
                  } : {})}
                >
                  <View style={styles.menuIconContainer}>
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuDesc} numberOfLines={1}>{item.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Kutipan Hari Ini untuk Mobile */}
            {Platform.OS !== 'web' && (
              <View style={[styles.sideCard, { marginTop: 30, marginBottom: 10 }]}>
                <Text style={styles.sideCardTitle}>Kutipan Hari Ini</Text>
                <View style={styles.quoteWrapper}>
                  <Text style={styles.quoteText}>"{todayQuote}"</Text>
                </View>
              </View>
            )}
          </View>

          {/* Sidebar Area (Web Only) */}
          <View style={styles.sidebar}>
            <View style={styles.sideCard}>
              <Text style={styles.sideCardTitle}>Statistik Cepat</Text>
              {renderStats()}
            </View>

            <View style={styles.sideCard}>
              <Text style={styles.sideCardTitle}>Kutipan Hari Ini</Text>
              <View style={styles.quoteWrapper}>
                <Text style={styles.quoteText}>"{todayQuote}"</Text>
              </View>
            </View>

            <View style={[styles.sideCard, { backgroundColor: COLORS.accent, borderLeftWidth: 0 }]}>
              <Text style={[styles.sideCardTitle, { color: COLORS.secondary }]}>Status Sistem</Text>
              <View style={styles.systemInfo}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.systemText}>Server: Online</Text>
                </View>
                <Text style={styles.systemText}>Database: Terhubung</Text>
                <Text style={styles.systemText}>Versi: 2.1.4 (Web App)</Text>
              </View>
              <TouchableOpacity
              style={styles.sideLogoutButton}
              onPress={logout}
              activeOpacity={0.7}
              >
                <Text style={styles.sideLogoutText}>KELUAR SISTEM</Text>
                </TouchableOpacity>
            </View>
          </View>

          {/* Tombol Logout untuk Android */}
          {Platform.OS !== 'web' && (
            <TouchableOpacity style={styles.mobileLogout} onPress={logout}>
              <Text style={styles.mobileLogoutText}>KELUAR DARI SISTEM</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
  flex: 1,
  backgroundColor: COLORS.background,
  paddingTop: Platform.OS === 'android' ? 30 : 0,
},
  navbar: {
    height: 70,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 40 : 20,
    zIndex: 100,
    ...Platform.select({
      web: { position: 'fixed', top: 0, left: 0, right: 0 }
    })
  },
  navbarContent: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLogo: { fontSize: Platform.OS === 'web' ? 22 : 18, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userInfo: { alignItems: 'flex-end', marginRight: 5, display: Platform.OS === 'web' ? 'flex' : 'none' },
  navUser: {
  fontSize: 14,
  fontWeight: '700',
  color: COLORS.primary
},
  navAvatar: { 
    width: 38, 
    height: 38, 
    backgroundColor: COLORS.primary, 
    borderRadius: 4, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent
  },
  navAvatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },

  navLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},

schoolLogo: {
  width: 65,
  height: 65,
  resizeMode: 'contain',
},

schoolName: {
  fontSize: 12,
  fontWeight: '800',
  color: COLORS.primary,
  letterSpacing: 0.8,
  marginBottom: 2,
},

  scroll: { 
    flexGrow: 1, 
    paddingTop: Platform.OS === 'web' ? 100 : 20,
    paddingBottom: 60 
  },
  mainLayout: {
    width: '100%',
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    paddingHorizontal: Platform.OS === 'web' ? 40 : 20,
    gap: Platform.OS === 'web' ? 35 : 0,
  },
  contentArea: { flex: 3 },
  sidebar: { 
    flex: 1, 
    gap: 25,
    display: Platform.OS === 'web' ? 'flex' : 'none'
  },

  welcomeSection: { marginBottom: Platform.OS === 'web' ? 35 : 25 },
  greetingText: { fontSize: 11, color: COLORS.primary, fontWeight: '800', letterSpacing: 1.5 },
 userNameText: {
  fontSize: Platform.OS === 'web' ? 42 : 32,
  fontWeight: 'bold',
  color: COLORS.primary,
  fontFamily: serifFont,
  marginTop: 4
},
  accentLine: { width: 60, height: 4, backgroundColor: COLORS.primary, marginTop: 15 },

  mobileStatsCard: {
  backgroundColor: COLORS.primary, // NAVY
  padding: 35,
  borderWidth: 1,
  borderColor: COLORS.primary,
  borderLeftWidth: 8,
  borderLeftColor: COLORS.accent, // KUNING
},

  heroCard: {
  backgroundColor: COLORS.primary, // NAVY
  padding: Platform.OS === 'web' ? 40 : 25,

  borderWidth: 1,
  borderColor: COLORS.white, // pinggiran putih

  flexDirection: 'row',
  marginBottom: 35,

  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 10,

  borderLeftWidth: 8,
  borderLeftColor: COLORS.accent, // aksen kuning
},

heroInfo: {
  flex: 2
},

heroVisual: {
  flex: 1,
  alignItems: 'flex-end',
  justifyContent: 'center'
},

// IKHTISAR SISTEM
heroTag: {
  fontSize: 10,
  fontWeight: '900',
  color: COLORS.white, // PUTIH
  letterSpacing: 1.5,
  marginBottom: 15
},

// PUSAT KENDALI LITERATUR
heroTitle: {
  fontSize: Platform.OS === 'web' ? 28 : 20,
  fontWeight: 'bold',
  color: COLORS.white, // KUNING
  marginBottom: 10
},

// KELOLA SIRKULASI...
heroSubtitle: {
  fontSize: 14,
  color: COLORS.white, // PUTIH
  lineHeight: 22,
  marginBottom: 25
},

heroActions: {
  flexDirection: 'row'
},

// KOTAK MULAI TRANSAKSI
primaryBtn: {
  backgroundColor: COLORS.white, // PUTIH
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 2
},

// TEKS MULAI TRANSAKSI
primaryBtnText: {
  color: COLORS.primary, // NAVY
  fontWeight: '800',
  fontSize: 11,
  letterSpacing: 1
},
  heroIcon: { fontSize: 100, opacity: 0.08 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: COLORS.primary, letterSpacing: 1.5, textTransform: 'uppercase' },
  titleLine: { flex: 1, height: 1, backgroundColor: COLORS.border },

  menuGrid: { 
  flexDirection: 'row', 
  flexWrap: 'wrap', 
  gap: 15 
},

menuItem: {
  width: Platform.OS === 'web' ? '48.5%' : '100%',
  backgroundColor: COLORS.primary, // NAVY
  padding: 20,
  borderWidth: 1,
  borderColor: COLORS.accent, // KUNING
  borderLeftWidth: 5,
  borderLeftColor: COLORS.accent,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 15,
},

menuItemHovered: {
  borderColor: COLORS.accent,
  backgroundColor: COLORS.secondary, // biru lebih terang
},

menuIconContainer: {
  width: 50,
  height: 50,
  backgroundColor: COLORS.secondary,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 4,
  borderWidth: 1,
  borderColor: COLORS.accent,
},

menuIcon: { 
  fontSize: 22 
},

menuText: { 
  flex: 1 
},

menuTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: COLORS.accent, // KUNING
},

menuDesc: {
  fontSize: 12,
  color: COLORS.white, // PUTIH
  marginTop: 2,
},

  statsContainer: { gap: 20 },
  statsContainerMobile: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 15 },
  statBox: { flex: 1, alignItems: 'flex-start' },
  statNumber: {
  fontSize: 42,
  fontWeight: 'bold',
  color: COLORS.white, 
},
  statNumberMobile: { fontSize: 24, textAlign: 'center', width: '100%' },
  statLabel: {
  fontSize: 12,
  fontWeight: '800',
  color: COLORS.accent, // KUNING
  letterSpacing: 1.5,
},
  statDivider: {
  height: 1.5,
  backgroundColor: 'rgba(255,255,255,0.55)',
  marginVertical: 10,
},
  statDividerVertical: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.25)',
  marginVertical: 20, },

  sideCard: {
    backgroundColor: COLORS.primary,
    padding: 25,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.accent,
  },
  sideCardTitle: { fontSize: 11, fontWeight: '900', color: COLORS.white, letterSpacing: 1.5, marginBottom: 20, textTransform: 'uppercase' },
  quoteWrapper: { borderLeftWidth: 3, borderLeftColor: COLORS.highlight, paddingLeft: 15 },
  quoteText: { fontSize: 15, color: COLORS.accent, fontStyle: 'italic', lineHeight: 24, fontFamily: serifFont },
  
  systemInfo: { gap: 10, marginBottom: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  systemText: { fontSize: 12, color: COLORS.secondary, fontWeight: '500' },
sideLogout: {
  marginTop: 15,
  paddingTop: 15,
  alignItems: 'flex-start',
},

sideLogoutButton: {
  backgroundColor: COLORS.primary,
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 3,
  borderWidth: 1,
  borderColor: COLORS.primary,

  justifyContent: 'center',
  alignItems: 'center',
  alignSelf: 'stretch',
},

sideLogoutText: {
  color: COLORS.white,
  fontSize: 10,
  fontWeight: 'bold',
  letterSpacing: 1,
  textAlign: 'center',
},

  mobileLogout: { marginHorizontal: 20, marginTop: 10, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: COLORS.danger },
  mobileLogoutText: { color: COLORS.danger, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },

  safeArea: {
  flex: 1,
  backgroundColor: COLORS.white,
},
});
