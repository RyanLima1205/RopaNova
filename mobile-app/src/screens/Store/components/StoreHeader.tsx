import React from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeImage } from '../../../components/SafeImage'
import { brandColors, radii, spacing, typography } from '../../../theme'
import { StoreIdentity, StoreStats } from '../../../types/store'

interface StoreHeaderProps {
  identity: StoreIdentity
  stats: StoreStats
  isOwner: boolean
  accentColor: string
  isFollowing: boolean
  followLoading: boolean
  onFollow: () => void
}

const formatStat = (value: number): string => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value))

/** Logo + identité à gauche, stats + Seguir en une ligne. */
export function StoreHeader({
  identity,
  stats,
  isOwner,
  accentColor,
  isFollowing,
  followLoading,
  onFollow,
}: StoreHeaderProps) {
  const isStore = identity.kind === 'store'
  const location = [identity.province, identity.city].filter(Boolean).join(', ')

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <SafeImage
          uri={identity.logo}
          style={[styles.avatar, isStore ? styles.avatarSquare : styles.avatarRound]}
          fallbackText={identity.name.charAt(0) || 'T'}
        />

        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {identity.name}
            </Text>
            {identity.verified && (
              <View style={[styles.verifiedBadge, { backgroundColor: accentColor }]}>
                <Ionicons name="checkmark" size={11} color={brandColors.white} />
              </View>
            )}
          </View>

          {identity.username && <Text style={styles.username}>@{identity.username.replace(/^@/, '')}</Text>}

          {location !== '' && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={15} color={brandColors.textSecondary} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          )}

          {stats.reviewCount > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={15} color="#F5A623" />
              <Text style={styles.ratingValue}>{stats.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({stats.reviewCount} reseñas)</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatStat(stats.followerCount)}</Text>
          <Text style={styles.statLabel}>Seguidores</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatStat(stats.productCount)}</Text>
          <Text style={styles.statLabel}>Productos</Text>
        </View>
        {stats.responseRate > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(stats.responseRate)}%</Text>
            <View style={styles.statLabelRow}>
              <Text style={styles.statLabel}>Respuesta</Text>
              <Ionicons name="information-circle-outline" size={12} color={brandColors.textMuted} />
            </View>
          </View>
        )}

        {!isOwner && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing ? styles.followButtonFollowing : { backgroundColor: accentColor },
            ]}
            onPress={onFollow}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? brandColors.textPrimary : brandColors.white} />
            ) : (
              <>
                {!isFollowing && <Ionicons name="add" size={18} color={brandColors.white} />}
                <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextFollowing]}>
                  {isFollowing ? 'Siguiendo' : 'Seguir'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: brandColors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    borderWidth: 1,
    borderColor: brandColors.border,
    backgroundColor: brandColors.surfaceSecondary,
  },
  avatarSquare: {
    width: 84,
    height: 84,
    borderRadius: radii.large,
  },
  avatarRound: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  identity: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: 21,
    color: brandColors.textPrimary,
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: brandColors.textSecondary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: spacing.sm,
  },
  locationText: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: brandColors.textSecondary,
    lineHeight: 19,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  ratingValue: {
    fontFamily: typography.cardTitle.fontFamily,
    fontSize: 15,
    color: brandColors.textPrimary,
  },
  ratingCount: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: brandColors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: 19,
    color: brandColors.textPrimary,
    textAlign: 'center',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  statLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: brandColors.textSecondary,
    textAlign: 'center',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginLeft: 'auto',
    minWidth: 96,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
  },
  followButtonFollowing: {
    backgroundColor: brandColors.surface,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  followButtonText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 15,
    color: brandColors.white,
  },
  followButtonTextFollowing: {
    color: brandColors.textPrimary,
  },
})
