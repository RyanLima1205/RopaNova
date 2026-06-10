import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  progress?: number;
  reward?: {
    points: number;
    benefits?: string[];
  };
}

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  showDescription?: boolean;
  onPress?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badge,
  size = 'md',
  showProgress = false,
  showDescription = false,
  onPress,
}) => {
  const getLevelColor = (level: Badge['level']) => {
    switch (level) {
      case 'bronze':
        return { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' };
      case 'silver':
        return { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' };
      case 'gold':
        return { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' };
      case 'platinum':
        return { bg: '#F3E8FF', text: '#7C3AED', border: '#A855F7' };
      case 'diamond':
        return { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' };
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' };
    }
  };

  const getRarityColor = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common':
        return '#9CA3AF';
      case 'rare':
        return '#3B82F6';
      case 'epic':
        return '#A855F7';
      case 'legendary':
        return '#F59E0B';
      default:
        return '#9CA3AF';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return {
          container: { width: 64, height: 64 },
          icon: 24,
          name: 10,
          card: { padding: 8 },
        };
      case 'lg':
        return {
          container: { width: 96, height: 96 },
          icon: 32,
          name: 14,
          card: { padding: 16 },
        };
      default:
        return {
          container: { width: 80, height: 80 },
          icon: 28,
          name: 12,
          card: { padding: 12 },
        };
    }
  };

  const sizeClasses = getSizeClasses(size);
  const levelColors = getLevelColor(badge.level);
  const rarityColor = getRarityColor(badge.rarity);

  const getIconName = (icon: string) => {
    // Map icon strings to Ionicons names
    const iconMap: { [key: string]: string } = {
      '🏆': 'trophy',
      '⭐': 'star',
      '🔥': 'flame',
      '💎': 'diamond',
      '👑': 'crown',
      '🎯': 'target',
      '🚀': 'rocket',
      '💪': 'fitness',
      '🎉': 'party-popper',
      '🏅': 'medal',
    };
    return iconMap[icon] || 'star';
  };

  const BadgeContent = () => (
    <TouchableOpacity
      style={[
        styles.card,
        sizeClasses.card,
        {
          backgroundColor: levelColors.bg,
          borderColor: levelColors.border,
          opacity: badge.unlocked ? 1 : 0.5,
        },
        !badge.unlocked && styles.grayscale,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.container, sizeClasses.container]}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getIconName(badge.icon) as any}
            size={sizeClasses.icon}
            color={levelColors.text}
          />
        </View>
        
        <Text style={[styles.name, { fontSize: sizeClasses.name, color: levelColors.text }]}>
          {badge.name}
        </Text>

        {badge.unlocked && (
          <View style={[styles.levelBadge, { backgroundColor: levelColors.bg, borderColor: levelColors.border }]}>
            <Text style={[styles.levelText, { color: levelColors.text }]}>
              {badge.level.toUpperCase()}
            </Text>
          </View>
        )}

        {showProgress && !badge.unlocked && badge.progress !== undefined && badge.progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${badge.progress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{badge.progress}%</Text>
          </View>
        )}

        {showDescription && (
          <Text style={styles.description} numberOfLines={2}>
            {badge.description}
          </Text>
        )}

        {badge.reward && badge.unlocked && (
          <Text style={styles.rewardText}>+{badge.reward.points} puntos</Text>
        )}

        {/* Rarity indicator */}
        <View
          style={[
            styles.rarityIndicator,
            { backgroundColor: rarityColor },
          ]}
        />
      </View>
    </TouchableOpacity>
  );

  return <BadgeContent />;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 4,
  },
  name: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  levelBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  levelText: {
    fontSize: 8,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
  },
  description: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 10,
  },
  rewardText: {
    fontSize: 8,
    color: '#059669',
    fontWeight: '500',
    marginTop: 4,
  },
  rarityIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  grayscale: {
    opacity: 0.5,
  },
}); 