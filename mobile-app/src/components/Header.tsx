import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { IconButton } from './IconButton'
import { brandColors, spacing, typography } from '../theme'

interface HeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  rightElement?: React.ReactNode
}

export function Header({ title, showBack = true, onBack, rightElement }: HeaderProps) {
  const navigation = useNavigation()

  return (
    <View style={styles.wrap}>
      <View style={styles.side}>
        {showBack && (
          <IconButton
            name="chevron-back"
            onPress={onBack ?? (() => navigation.goBack())}
            variant="ghost"
          />
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>{rightElement}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: spacing.lg,
    backgroundColor: brandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  side: {
    width: 40,
    alignItems: 'flex-start',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: typography.sectionTitle.fontSize,
    color: brandColors.textPrimary,
  },
})
