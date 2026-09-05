import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body:
      'We collect the following categories of information when you use KinBech: (a) Information you provide to us directly: your verified phone number, name, optional profile photo, optional location text address, and content of any support tickets or reports you submit. (b) Information collected automatically: your approximate or precise geographic coordinates (if you grant location permissions), device model and OS version, IP address, mobile carrier, interaction timestamps, app screen flow events, photos you upload for listings, and in-app chat message metadata. (c) Information from third-party identity verification providers (if required for future seller verification tiers) — currently not collected.',
  },
  {
    title: '2. How We Use Your Information',
    body:
      'We use the information we collect for the following purposes: to create and maintain your account; to authenticate you via SMS OTP; to allow you to list items for sale and discover listings near you via location filtering; to facilitate direct chat between Buyer and Seller; to deliver push notifications or SMS transactional alerts (if enabled); to personalize recommended listings and search rankings; to detect, prevent, and investigate fraud, spam, safety incidents, or violations of our Terms; to respond to your customer support requests; to comply with legal obligations, lawful requests, or court orders under Nepalese or Indian law; and for internal product research, analytics, and Service improvement with aggregated or pseudonymized data.',
  },
  {
    title: '3. Location Data',
    body:
      'We collect location data in two ways. First, if you tap "Use Current Location" in Profile Setup or Edit Profile, we request "When in Use" location permission, use reverse geocoding to derive a human-readable city/region name, and we store that resolved location label plus the precise latitude/longitude on your user profile. Second, on the Explore and Home screens, location permission is used only to sort listings by proximity and is never persisted to your profile; you may still browse the app by manually selecting a district if permission is denied. You can revoke location permissions at any time from your device System Settings → KinBech → Location, and you can clear your stored location from Edit Profile.',
  },
  {
    title: '4. Information Sharing & Disclosure',
    body:
      'We do not sell, rent, or license any of your personal data to third parties for their own direct marketing purposes. We share your information only in the following limited circumstances: (a) With other users of the Service: when you post a listing, your display name, profile photo, and approximate neighborhood-level location are visible to any other user who views the listing. When you start a chat or agree to meet, the other user sees your phone number only if you explicitly choose to share it. (b) With our trusted service providers who process data on our behalf (cloud hosting, SMS delivery, crash reporting, analytics providers) under binding confidentiality obligations. (c) When required by law, such as to a Nepali or Indian government authority, law enforcement agency, or court with valid jurisdiction, or when we in good faith believe disclosure is necessary to protect the life, safety, or property of any person.',
  },
  {
    title: '5. Security Measures',
    body:
      'We take commercially reasonable administrative, technical, and physical security measures designed to protect your personal data against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access. Your authentication token is stored encrypted on device using the OS-provided secure storage via AsyncStorage; API traffic uses HTTPS/TLS 1.2 or higher end-to-end; production databases are encrypted at rest; and access to production infrastructure is restricted by role-based access controls, multi-factor authentication, and audit logging. However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.',
  },
  {
    title: '6. Data Retention',
    body:
      'We retain your account data (name, phone, profile, preferences) for as long as your account remains active. When you voluntarily close your account, we anonymize or delete your personal data within ninety (90) days except where longer retention is required by law — such as tax and accounting records (retained 7 years), pending dispute records, and submitted reports related to public safety incidents (retained 5 years). Listing photos, chat history, and reviews are retained for 24 months after the listing is marked sold or deleted, after which they are purged from active servers and 6 months later from encrypted backups.',
  },
  {
    title: '7. Your Privacy Rights',
    body:
      'Depending on your jurisdiction, you may have the following rights in relation to your personal data, free of charge for up to two requests per calendar year: (a) Right of Access — request a machine-readable export of all personal data we hold about you. (b) Right of Rectification — correct inaccurate or incomplete information (name, location, profile photo, preferences can be updated directly from Edit Profile). (c) Right to Erasure — request deletion of your account and associated personal data, subject to legal retention exceptions. (d) Right to Restrict or Object — request that we stop certain processing. To exercise any of these rights, email privacy@kinbech.app from your registered phone number\'s email contact or include in your message your full name and verified phone number so we can authenticate the request.',
  },
  {
    title: '8. Children\'s Privacy',
    body:
      'The Service is not directed to children under the age of 16. We do not knowingly collect personal information from children under 16. If you become aware that a child has provided us with personal information, please contact us at privacy@kinbech.app and we will take steps to delete such information from our systems as soon as practicable.',
  },
  {
    title: '9. Cross-Border Transfers',
    body:
      'Your personal data is primarily processed on servers located within Nepal and India. In limited cases, for cloud-hosted backup storage or third-party analytics tooling that is only operated from the European Union or the United States, your data may be transferred outside Nepal or India. Such transfers are made only on the basis of Standard Contractual Clauses approved by the Nepal Ministry of Communications and Information Technology or equivalent adequacy decisions, with appropriate safeguards documented in our sub-processor inventory available upon request.',
  },
  {
    title: '10. Cookies and Local Storage',
    body:
      'KinBech is a native mobile app and does not use web browser cookies. We do use on-device local storage via AsyncStorage to securely cache your authentication token, your most recently viewed location filter, and basic UI preferences such as dark mode selection. No third-party tracking cookies are placed. You can clear all cached local data by uninstalling the app from your device.',
  },
  {
    title: '11. Changes to this Privacy Policy',
    body:
      'We may update this Privacy Policy from time to time. Material changes that reduce your rights or expand the categories of data we collect or share will be communicated via prominent in-app banner, registered email, or SMS at least thirty (30) days before becoming effective, and the "Last updated" date below will be revised. Your continued use of the Service after the effective date constitutes acceptance of the revised Privacy Policy.',
  },
  {
    title: '12. Contact & Data Protection Officer',
    body:
      'If you have any questions, concerns, or complaints about this Privacy Policy or our data handling practices, please contact our Data Protection Officer at: privacy@kinbech.app. Alternatively, write to us at: KinBech Pvt. Ltd., Attn: Data Protection Officer, Gairidhara - 2, Kathmandu 44600, Bagmati Province, Nepal. We aim to acknowledge all complaints within 7 business days and resolve them within 30 days. If you are not satisfied with our response, you may also have the right to lodge a complaint with your local data protection authority in Nepal or India.',
  },
];

const createStyles = (colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  docCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  docLastUpdated: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
    lineHeight: 22,
  },
  sectionBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footerBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.iconBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  footerBody: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
});

export default function PrivacyPolicyScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ThemeStatusBar variant="header" />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.docCard}>
          <Text style={styles.docLastUpdated}>Last updated: March 2026</Text>
          {SECTIONS.map((sec) => (
            <View key={sec.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              <Text style={styles.sectionBody}>{sec.body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerBox}>
          <Text style={styles.footerTitle}>Data requests</Text>
          <Text style={styles.footerBody}>
            To export, correct, or delete your personal data, email privacy@kinbech.app with your verified phone number. We respond to all valid requests within 30 days.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
