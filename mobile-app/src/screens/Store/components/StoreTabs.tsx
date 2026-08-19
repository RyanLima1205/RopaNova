import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { brandColors, spacing, typography } from '../../../theme'

export type StoreTab = 'inicio' | 'productos' | 'informacion'

interface StoreTabsProps {
  active: StoreTab
  onChange: (tab: StoreTab) => void
  accentColor: string
}

const TABS: { key: StoreTab; label: string }[] = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'productos', label: 'Productos' },
  { key: 'informacion', label: 'Información' },
]

/** Uniquement pour plan PRO/ELITE — le plan START reste une page unique sans onglets. */
export function StoreTabs({ active, onChange, accentColor }: StoreTabsProps) {
  return (
    <View style={styles.wrap}>
      {TABS.map((tab) => {
        const isActive = tab.key === active
        return (
          <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
            <Text style={[styles.label, isActive && { color: accentColor }]}>{tab.label}</Text>
            {isActive && <View style={[styles.indicator, { backgroundColor: accentColor }]} />}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: brandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  label: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    color: brandColors.textSecondary,
  },
  indicator: {
    height: 2,
    width: '60%',
    borderRadius: 1,
    marginTop: spacing.xs,
  },
})
