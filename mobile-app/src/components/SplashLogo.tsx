import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Circle, Path, G, Text as SvgText } from 'react-native-svg';

interface SplashLogoProps {
  size?: number;
  showText?: boolean;
}

export const SplashLogo: React.FC<SplashLogoProps> = ({ 
  size = 200, 
  showText = true 
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Background circle */}
        <Circle cx="100" cy="100" r="90" fill="#6366f1" opacity="0.1"/>
        
        {/* Main icon - clothing hanger */}
        <G transform="translate(100, 100)">
          {/* Hanger hook */}
          <Path 
            d="M-15 -40 Q-15 -50 -5 -50 Q5 -50 5 -40 L5 -35 Q5 -30 0 -30 Q-5 -30 -5 -35 Z" 
            fill="#6366f1"
          />
          
          {/* Hanger body */}
          <Path 
            d="M-5 -35 L-5 -20 Q-5 -15 0 -15 Q5 -15 5 -20 L5 -35" 
            fill="none" 
            stroke="#6366f1" 
            strokeWidth="3"
          />
          
          {/* Hanger bottom curve */}
          <Path 
            d="M-5 -20 Q-5 -10 0 -10 Q5 -10 5 -20" 
            fill="none" 
            stroke="#6366f1" 
            strokeWidth="3"
          />
          
          {/* Small clothing item */}
          <Circle cx="0" cy="-5" r="6" fill="#6366f1" opacity="0.3"/>
        </G>
        
        {showText && (
          <>
            {/* Text "RopaNova" */}
            <SvgText 
              x="100" 
              y="140" 
              textAnchor="middle" 
              fontSize="18" 
              fontWeight="bold" 
              fill="#6366f1"
            >
              RopaNova
            </SvgText>
            
            {/* Subtitle */}
            <SvgText 
              x="100" 
              y="155" 
              textAnchor="middle" 
              fontSize="10" 
              fill="#6b7280"
            >
              Fashion Marketplace
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
}); 