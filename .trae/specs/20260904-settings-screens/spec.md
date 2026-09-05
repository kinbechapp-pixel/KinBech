# Settings Menu Screens & APIs — Specification

## Problem

SettingsScreen (`Mobile/src/screens/SettingsScreen.js`) par 13 menu items hain. Unmein se 8 items generic `InfoScreen` placeholder par jaate hain (jo sirf ek icon + title + 2-line body dikhata hai, koi real functionality nahi). Sath hi:

- Backend `publicUser()` helper `preferences`, `coordinates`, aur `blockedUserIds` return nahi karta — jiski wajah se SettingsScreen ka Preferences section `user.preferences` read karne par `undefined` khata hai.
- HelpSupportScreen "Payments" category card ke liye colors (`supportPaymentsBg`, `supportPaymentsIcon`) missing hain `colors.js` mein.
- Mobile `api.js` service mein `createReport`, `blockUser`, `unblockUser`, `getMyReports` method definitions duplicate hain.
- Backend `reviewController.js` mein seller rating average calculate karte waqt `reviewedUser` (mongoose doc) ki jagah sirf ID query mein use honi chahiye — bug hai.
- "Privacy & Security" screen mein blocked users ki list dikhani chahiye + unblock karna chahiye, lekin koi `GET /auth/blocked` route nahi hai.
- "Edit Profile" placeholder hai, jabki `PATCH /auth/me` API backend mein exist karti hai.
- Language/Currency selection ke liye InfoScreen placeholder hai — proper bottom-sheet style selection + `PATCH /auth/preferences` ke saath persist karna chahiye.
- Terms & Conditions aur Privacy Policy khali InfoScreen placeholders hain — inko proper long-form content dena chahiye.

## Users & Goals

**Primary user:** KinBech app ka authenticated end user (buyer/seller).

**Goals:**
1. Settings menu har item ke liye dedicated apna screen khole — na ki generic placeholder.
2. Har screen ka design existing Settings/Help/MyListings style se consistent ho (gradient header, card rows, icon circles, 16–18 radius cards).
3. Jo backend API available hai (updateMe / updatePreferences / block-unblock / reports / reviews / my-listings) unko properly wire kiya jaye.
4. Jo domain features Saved Addresses / Payment Methods (models + APIs missing hain) unke liye placeholder ko improved copy + future indicator ke saath rakha jaye (naya dedicated screen nahi, kyunki backend model/route abhi nahi).

## Non-Goals (Out of Scope)

- Saved Addresses ka pura model/route/screen implement **nahi** karna (requires Address schema + CRUD).
- Payment Methods (wallets, UPI, bank) ka pura model/route/screen implement **nahi** karna.
- In-app contact-support chat ticket system.
- Multi-language / i18n translations.
- New seller/store discovery APIs (already stubbed — unrelated).

---

## Functional Requirements

### FR-1 — Navigation mapping (Settings menu → sahi screen)

Har Settings menu item ka route iss mapping ke according hona chahiye:

| Menu | Current | Required |
|---|---|---|
| Edit Profile | `INFO` / `INFO_COPY.EditProfile` | **Dedicated** `EditProfile` screen |
| Privacy & Security | `INFO` / `INFO_COPY.Privacy` | **Dedicated** `Privacy` screen (blocked users list + unblock) |
| Saved Addresses | `INFO` / `INFO_COPY.Addresses` | InfoScreen placeholder + improved copy (Out of Scope) |
| Payment Methods | `INFO` / `INFO_COPY.PaymentMethods` | InfoScreen placeholder + improved copy (Out of Scope) |
| My Listings | `MY_LISTINGS` | ✅ Same, no change |
| Notifications | inline Switch | ✅ Same, wired to prefs |
| Language | `INFO` / `INFO_COPY.LanguageSelect` | **Dedicated** `LanguageSelect` screen |
| Dark Mode | inline Switch | ✅ Same, wired to theme |
| Currency | `INFO` / `INFO_COPY.CurrencySelect` | **Dedicated** `CurrencySelect` screen |
| Help Center | `HELP` → HelpSupportScreen | ✅ Same, + fix missing payment colors |
| Contact Us | `INFO` / `INFO_COPY.ContactUs` | Keep InfoScreen route, but copy improved |
| Terms & Conditions | `INFO` / `INFO_COPY.Terms` | **Dedicated** `Terms` screen (scrollable long-form) |
| Privacy Policy | `INFO` / `INFO_COPY.PrivacyPolicy` | **Dedicated** `PrivacyPolicy` screen (scrollable long-form) |

Sabhi naye dedicated screens `AppNavigator.js` mein Stack.Screen ke roop mein aur `ROUTES` constant mein entry ke saath register hone chahiye.

### FR-2 — Backend publicUser mein missing fields expose karna

`Backend/src/utils/token.js` ke `publicUser()` function return object mein yeh add karna:
- `preferences: user.preferences` (default values ke saath)
- `location: user.location`
- `coordinates: user.coordinates`
- `blockedCount: user.blockedUserIds.length` (count, IDs nahi, for privacy)
- `createdAt: user.createdAt`

SettingsScreen preferences section render se pehle `undefined` state fallbacks already hain; lekin real data aana chahiye.

### FR-3 — Blocked users list endpoint + unblock action

Backend mein `GET /auth/blocked` route add karna jo authenticated user ke `blockedUserIds` ko populate karke `[{ id, name, avatarUrl }]` format mein return kare.

Mobile `api.js` mein `getBlockedUsers` + existing `unblockUser` method reuse karke Privacy screen mein list + unblock action dikhana.

### FR-4 — Edit Profile Screen

- Fields: Name, Avatar (existing `expo-image-picker` pattern), Location (city text, optional auto-locate), Phone (read-only display).
- Save button → `api.updateMe(payload)` → success toast/alert → go back.
- AuthContext user ko API ke response se sync karna (token already returned by updateMe; `useAuth` mein `refreshUser` ya direct setter use hona chahiye).

### FR-5 — LanguageSelect + CurrencySelect

- Dono screens mein radio-list pattern (jaise ReportBlockUserScreen ke reasons).
- Language options: English, Nepali, Hindi (Hinglish default "English").
- Currency options: NPR (₨), INR (₹), USD ($) (default "NPR (₨)" for Nepal market — abhi existing default `INR (₹)` hai, ise correct kiya jaye user preference ke zariye, hardcoded default NPR).
- Selection → `api.updatePreferences({ language/currency })` → auto goBack + SettingsScreen value reflect ho jaye (useFocusEffect + me() re-fetch, ya AuthContext sync).

### FR-6 — Terms + PrivacyPolicy dedicated screens

- Long-form static Nepali marketplace context appropriate content (multiple sections, scrollable).
- Consistent layout: gradient header, section headings, body paragraphs, proper spacing (16–20 lineHeight).

### FR-7 — Missing colors fix

`Mobile/src/theme/colors.js` mein `buildColors` output mein ye keys add karna:
- `supportPaymentsBg`: tint(accent/warning, opacity)  — jaise `supportSafetyBg`.
- `supportPaymentsIcon`: corresponding accent color (info / m.info).

### FR-8 — api.js duplicate methods remove

Lines 328–335 duplicate `createReport`, `blockUser`, `unblockUser`, `getMyReports` delete karna. Lines 317–324 original ko hi rakna.

### FR-9 — reviewController rating bug fix

`reviewController.createReview` line 48 mein:
```js
const allReviews = await Review.find({ reviewedUser, status: 'approved' });
```
isko:
```js
const allReviews = await Review.find({ reviewedUser: reviewedUserId, status: 'approved' });
```
kyunki `reviewedUser` ek mongoose document hai, query mein direct use hoga to `_id` match nahi karega.

### FR-10 — Design consistency

Har naya screen:
- `SafeAreaView` + `ThemeStatusBar variant="header"`.
- Gradient header bar → back chevron + title.
- Cards 16–18 borderRadius, `surface` bg + 1px `border`.
- Icon circles (40×40 rounded) `iconBackground`.
- Typography: title 22–24px 800w, section headings 15–16px 700w, subtitles 12–13px muted.
- Submit buttons → `LinearGradient` (gradientStart→End) 54px min-height, 16px radius.
- Bhaasha English (screen copy English mein hi; user Hinglish communicate karte hain, product copy consistent).

---

## Non-Functional Requirements

- **NFR-1 (No new RN deps):** jo deps already install hain (expo-image-picker, expo-location, react-native-safe-area-context, expo-linear-gradient, @expo/vector-icons/Ionicons) inhi ka use.
- **NFR-2 (Lazy mount safe):** koi bhi undefined `colors`/`user` state par null ho jana, crash nahi.
- **NFR-3 (Hermes / New Arch friendly):** direct global identifier access na ho — sab imports explicit (jaise ExploreScreen Skeleton bug).
- **NFR-4 (Network safe):** har API call loading state + error alert / success alert (AlertModal component reuse).

---

## Constraints, Dependencies, Assumptions

- **Constraints:** Expo SDK 54, React Navigation 7 Native Stack, existing `api.js` candidates pattern.
- **Dependencies:** Existing models (`User`, `Report`, `Review`), routes (`auth.js`, `reports.js`, `reviews.js`), components (`AlertModal`, `GradientButton`).
- **Assumptions:**
  - Saved Addresses aur Payment Models aane wale release mein — isliye inke dedicated screens abhi nahi.
  - `api.updateMe` already `location`, `coordinates`, `name`, `avatarUrl`, `profileComplete` accept karta hai ✅ (explore phase mein confirmed).
  - User already authenticated hai — Settings tab sirf tab navigation ke andar accessible hai, jo post-login stack hai.

---

## Open Questions

- **Q1:** Currency default `INR (₹)` hai lekin KinBech Nepal market ke liye lag raha hai (location "Kathmandu"). Kya hardcoded default `NPR (₨)` karna chahiye new users ke liye? → **Assumption: Haan, default NPR (₨) karte hain; User model default bhi update karna parega.**
- **Q2:** Edit Profile mein coordinates auto-locate add karun? → **Assumption: Haan, button ke saath (jaise HomeScreen Location.fetchCurrentLocation pattern).**
- **Q3:** PrivacyScreen mein, Report History (getMyReports) aur Reviews Received (getMyReviews) bhi tabs ke roop mein dikhayein ya sirf Blocked Users? → **Assumption: Single screen + inline sections (Blocked Users + My Reports mini-list). Dono hi show.**

---

## Acceptance Criteria

### Rule AC-1
Har Settings menu item tap karne par — EditProfile, Privacy, Language, Currency, Terms, PrivacyPolicy — dedicated registered Stack screen khole, InfoScreen placeholder **nahi**. Evidence: AppNavigator.js new Stack.Screen entries + SettingsScreen ACCOUNT_ROWS/SUPPORT_ROWS updated screen params.

### Rule AC-2
SettingsScreen preferences section (notifications/language/currency) initial values `user.preferences.*` se aayein, aur in-line toggles/nav-selection ke baad backend persist ho jayein. Evidence: network logs mein `PATCH /auth/preferences` call, aur next `GET /auth/me` response mein wohi values.

### Rule AC-3
HelpSupportScreen ka "Payments" category card render ho, missing colors ki wajah se NaN/undefined crash nahi. Evidence: resolvedCategories colors arrays non-empty for `payments` key.

### Rule AC-4
`publicUser()` response (auth/me payload) includes `preferences`, `location`, `blockedCount`. Evidence: logged-in app console `API Success: {"user":{...}}` mein yeh keys present hon.

### Rule AC-5
Backend `GET /auth/blocked` route returns array of blocked users; PrivacyScreen lists them with per-row Unblock action + confirmation Alert; after unblock the row disappears.

### Rule AC-6
Edit Profile form save karne par `PATCH /auth/me` fires; user.name/avatarUrl/location reflect in the next ProfileScreen + HomeScreen header greeting for the session.

### Rule AC-7
LanguageSelect aur CurrencySelect selection persist via prefs endpoint; SettingsScreen wapas aane par updated valueText dikhaye (e.g. "Nepali" ya "NPR (₨)").

### Rule AC-8
`Mobile/src/services/api.js` mein `createReport` etc. ke duplicate method lines nahi hain; grep count ek hi hota hai.

### Rule AC-9
Backend reviewController mein average rating query uses `reviewedUserId` string; after creating a review for a user with pre-existing reviews, avg rating correctly reflects N+1 denominator.

### Rubric AC-10 (Design fidelity 0-4, threshold ≥3)
| Score | Anchor |
|---|---|
| 0 | Layout broken, no gradient header, misaligned cards. |
| 1 | Rough layout present, but spacing / radius / colors inconsistent with Settings/Help screens. |
| 2 | Mostly consistent — minor mismatches (e.g. 14px vs 16px radius, missing icon circles). |
| 3 | Consistent: header, cards, radii, icon, typography match Settings/Help exactly. Evidence: screenshots. |
| 4 | Premium feel: subtle animations (fade on mount, animated list transitions), press feedback, polished empty states. |

### Rubric AC-11 (Code organization 0-3, threshold ≥2)
| Score | Anchor |
|---|---|
| 0 | Logic copy-pasted, helpers unused, broken imports. |
| 1 | Working but repeated pattern code, missing style consistency. |
| 2 | Clean: reusable Row components, useThemedStyles(createStyles) pattern, consistent imports order. |
| 3 | Thoughtful: shared helpers for selection screens, focused component separation, inline docs for flows. |
