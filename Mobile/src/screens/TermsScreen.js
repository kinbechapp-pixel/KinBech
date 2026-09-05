import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles, ThemeStatusBar } from '../theme';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body:
      'By creating an account or accessing or using the KinBech mobile application, the KinBech website, or any related services (collectively, the "Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to all of these Terms, do not use the Service. The Service is owned and operated by KinBech Pvt. Ltd., a company registered in Kathmandu, Nepal. These Terms may be updated from time to time; your continued use after changes are posted constitutes acceptance of the revised Terms.',
  },
  {
    title: '2. Eligibility and Accounts',
    body:
      'You must be at least 16 years old to use the Service. By creating an account, you represent that you are of legal age to form a binding contract in Nepal or India (whichever applies to your jurisdiction of residence). You are responsible for maintaining the confidentiality of your account credentials, including one-time passwords (OTPs) sent via SMS to your verified phone number. You are solely responsible for all activities that occur under your account. You may not transfer your account to any third party without our prior written consent. If you discover any unauthorized use of your account, you must notify us immediately at support@kinbech.app.',
  },
  {
    title: '3. User Conduct',
    body:
      'You agree to use the Service only for lawful purposes and in a way that does not infringe the rights of, or restrict or inhibit, any other person\'s use and enjoyment of the Service. You agree not to: harass, abuse, threaten, impersonate, or defraud any user; post content that is hateful, violent, discriminatory, sexually explicit, or violates community norms; use the Service for commercial solicitation unrelated to secondhand classifieds; harvest, scrape, or crawl user data without permission; attempt to gain unauthorized access to the Service or its underlying infrastructure; or use any automated bot, script, or tool to submit listings, messages, or reports.',
  },
  {
    title: '4. Listing Rules',
    body:
      'All listings posted on KinBech must be for legally owned physical goods or permitted in-person services that you are authorized to sell. You must provide accurate, complete, and current information including clear photos, honest descriptions, a fair price, and your actual location. The following categories are strictly prohibited: counterfeit, stolen, or seized goods; illegal drugs, alcohol, tobacco, or prescription medication; weapons, ammunition, or explosives; endangered wildlife products; pornography or adult services; financial instruments, securities, loans, or pyramid schemes; and anything that violates any federal, state, or local law in Nepal or India. We may remove any listing, with or without notice, if we believe it violates these Rules.',
  },
  {
    title: '5. Transactions Between Users',
    body:
      'KinBech is a peer-to-peer marketplace. We do not own, inspect, or authenticate items, and we are not a party to any transaction between a Buyer and a Seller. All negotiations, payments, exchanges, and disputes are conducted directly between users. For high-value items, we strongly recommend meeting in a safe public location (bank lobby, police station "exchange zone"), inspecting the item thoroughly before payment, and obtaining a signed receipt. We are not responsible for the quality, safety, legality, or availability of items listed, nor for any fraud, misrepresentation, or loss arising from a transaction.',
  },
  {
    title: '6. Payments and Fees',
    body:
      'Currently, KinBech does not charge any listing, success, or subscription fees for standard use of the marketplace. In the future, certain premium features (such as promoted listings, verified seller badges, or priority support) may be offered for a fee. Any applicable taxes, customs duties, or cross-border remittance charges arising from a cross-border sale between Nepal and India are the sole responsibility of the Buyer and Seller as required by applicable law. Third-party payment providers (eSewa, Khalti, IME Pay, PhonePe, Paytm, bank transfers, etc.) are governed by their respective terms of service.',
  },
  {
    title: '7. User Content and Licensing',
    body:
      'Any content you submit, post, or display on or through the Service (including listing titles, descriptions, photos, messages, reviews, and profile information) is your "User Content". You retain ownership of your User Content. By posting it, you grant KinBech a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, modify, adapt, publicly display, and perform such User Content for the purpose of operating, improving, promoting, and protecting the Service. This license survives termination of your account for a reasonable period required for us to wind down operations.',
  },
  {
    title: '8. Reviews and Ratings',
    body:
      'Ratings and reviews are provided by other users as subjective opinions and are not endorsed by KinBech. You may only submit one review per completed transaction, and the review must reflect your genuine experience. Fake reviews, review swapping, bribes for favorable reviews, or retaliatory negative reviews are grounds for account suspension. We reserve the right to remove or edit any review that we believe violates these Terms, contains offensive language, or is otherwise inappropriate.',
  },
  {
    title: '9. Disclaimers',
    body:
      'THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE DO NOT MAKE ANY WARRANTY REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY LISTING, USER PROFILE, REVIEW, OR OTHER CONTENT ON THE SERVICE.',
  },
  {
    title: '10. Limitation of Liability',
    body:
      'TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL KINBECH, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO YOUR ACCESS TO, OR USE OF, OR INABILITY TO ACCESS OR USE, THE SERVICE. OUR TOTAL AGGREGATE LIABILITY FOR ANY CLAIMS ARISING UNDER THESE TERMS, WHETHER IN CONTRACT, TORT, OR OTHERWISE, SHALL NOT EXCEED THE TOTAL AMOUNT OF FEES, IF ANY, THAT YOU HAVE PAID TO US IN THE TWELVE (12) MONTHS PRIOR TO THE EVENT GIVING RISE TO THE CLAIM.',
  },
  {
    title: '11. Termination',
    body:
      'You may terminate your account at any time from the Settings screen of the app. Upon termination, your profile and active listings will be hidden from public view, though certain data (including past transaction records, submitted reports, and required accounting records) may be retained by us for as long as required by applicable Nepalese or Indian law. We may suspend or terminate your account, with or without prior notice, if we believe you have materially breached these Terms, engaged in fraudulent or illegal activity, or if doing so is reasonably necessary to protect the safety, rights, or property of KinBech, our users, or the general public.',
  },
  {
    title: '12. Changes to the Terms',
    body:
      'We may modify these Terms from time to time. When we make material changes, we will provide notice to you through the Service, by email, or by SMS to your verified phone number, at least thirty (30) days before the changes become effective. By continuing to use the Service after the effective date of the revised Terms, you agree to be bound by the revised Terms. If you do not agree to the revised Terms, you must stop using the Service and terminate your account.',
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

export default function TermsScreen({ navigation }) {
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
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
          <Text style={styles.footerTitle}>Questions?</Text>
          <Text style={styles.footerBody}>
            Contact our support team at support@kinbech.app or start a chat with "KinBech Support" inside the app. We are available every day from 8 AM to 10 PM NPT.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
