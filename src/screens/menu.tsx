import { useContext, useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { AppContext, ThemeContext } from '../context'
import { Divider, ListRowCard, ScreenHero, ScreenSurface, Section, Surface, ThemedButton } from '../components'
import { RADIUS, SPACING, TAB_BAR_HEIGHT, TYPOGRAPHY } from '../constants/layout'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { menuGroups } from '../data/mockData'
import { apiRequest } from '../api'
import { hasAdminPass, hydrateAdminPass, setAdminPass } from '../adminSession'

export function Menu({ navigation }: { navigation: any }) {
  const { theme } = useContext(ThemeContext)
  const { currentUser, setCurrentUser } = useContext(AppContext)
  const insets = useSafeAreaInsets()
  const styles = getStyles(theme)
  const scrollBottom = insets.bottom + TAB_BAR_HEIGHT + SPACING.xl
  const [adminModalVisible, setAdminModalVisible] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminVerifying, setAdminVerifying] = useState(false)

  async function openAdminHub() {
    await hydrateAdminPass()
    if (hasAdminPass()) {
      navigation.navigate('Admin')
      return
    }
    setAdminPassword('')
    setAdminModalVisible(true)
  }

  async function submitAdminPassword() {
    const trimmed = adminPassword.trim()
    if (!trimmed) {
      Alert.alert('Admin', 'Enter the admin password.')
      return
    }
    try {
      setAdminVerifying(true)
      await apiRequest<{ ok: boolean }>('/auth/verify-admin', {
        method: 'POST',
        body: JSON.stringify({ password: trimmed }),
      })
      setAdminPass(trimmed)
      setAdminModalVisible(false)
      setAdminPassword('')
      navigation.navigate('Admin')
    } catch (err: any) {
      Alert.alert('Admin', err?.message || 'Incorrect password')
    } finally {
      setAdminVerifying(false)
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottom }]}
    >
      <ScreenHero title="Menu" subtitle="Settings and account." />

      <ScreenSurface>
        <Surface variant="muted" padding="lg">
          <Text style={styles.accountName}>{currentUser?.name || 'Guest'}</Text>
          {!currentUser?.id ? (
            <Text style={styles.accountEmail}>Not signed in</Text>
          ) : null}
        </Surface>

        <Divider faint spacing="lg" />

        {menuGroups.map((group, gi) => (
          <Section key={group.id} title={group.title} compactTopSpacing={gi === 0}>
            <View style={styles.groupStack}>
              {group.items.map((item, ii) => {
                const onPress =
                  item.id === 'account' ? () => navigation.navigate('AccountManagement') : undefined
                const isLast = ii === group.items.length - 1
                return (
                  <ListRowCard
                    key={item.id}
                    title={item.title}
                    onPress={onPress}
                    style={isLast ? styles.rowLast : undefined}
                  />
                )
              })}
            </View>
          </Section>
        ))}

        <Section title="Admin" compactTopSpacing>
          <ThemedButton label="Admin hub" onPress={openAdminHub} />
        </Section>

        <Section title="Session" compactTopSpacing>
          <ThemedButton
            label="Log out"
            variant="outline"
            onPress={() => setCurrentUser(null)}
          />
        </Section>
      </ScreenSurface>

      <Modal
        visible={adminModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAdminModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setAdminModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Admin access</Text>
            <Text style={styles.modalHint}>Enter the organizer password to open admin tools.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Admin password"
              placeholderTextColor={theme.mutedForegroundColor}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={adminPassword}
              onChangeText={setAdminPassword}
              onSubmitEditing={submitAdminPassword}
            />
            <View style={styles.modalActions}>
              <ThemedButton
                label="Cancel"
                variant="outline"
                onPress={() => setAdminModalVisible(false)}
                style={styles.modalBtn}
              />
              <ThemedButton
                label={adminVerifying ? 'Checking…' : 'Continue'}
                onPress={submitAdminPassword}
                style={styles.modalBtn}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    content: {
      flexGrow: 1,
    },
    accountName: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      lineHeight: TYPOGRAPHY.h4 * 1.2,
    },
    accountEmail: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.4,
    },
    groupStack: {
      gap: 0,
    },
    rowLast: {
      marginBottom: 0,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      padding: SPACING.containerPadding,
    },
    modalCard: {
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
      borderRadius: RADIUS.lg,
      padding: SPACING.xl,
      borderWidth: 1.5,
      borderColor: theme.borderColor,
    },
    modalTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
    },
    modalHint: {
      marginTop: SPACING.sm,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.4,
    },
    modalInput: {
      marginTop: SPACING.lg,
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      backgroundColor: theme.surfaceMuted ?? theme.cardBackground ?? theme.backgroundColor,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      minHeight: 48,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
    },
    modalActions: {
      flexDirection: 'row',
      gap: SPACING.md,
      marginTop: SPACING.lg,
    },
    modalBtn: {
      flex: 1,
    },
  })
