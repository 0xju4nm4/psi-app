---
name: ios-react-uiux
description: Design and develop React applications with iOS-inspired UI/UX, including glassmorphism effects, native iOS patterns, animations, and accessibility. Use for creating premium, polished interfaces with iOS aesthetic on web or React Native.
---

# iOS-Style React UI/UX Design Skill

This skill helps you create React applications (web and React Native) with authentic iOS design patterns, modern glassmorphism effects, and premium user experiences that feel native to Apple platforms.

## When to Use This Skill

Trigger this skill when the user wants to:
- Build React interfaces with iOS design language
- Implement glassmorphism or liquid glass effects
- Create premium, polished UI with iOS aesthetics
- Follow Apple's Human Interface Guidelines in React
- Add iOS-native animations and transitions
- Build accessible, responsive iOS-style components
- Design DeFi, fintech, or premium web apps with iOS feel

## Core Design Principles

### 1. Apple Human Interface Guidelines (HIG)

**Always prioritize:**
- **Clarity**: Text is legible at every size, icons precise, adornments subtle
- **Deference**: Fluid motion and crisp interface help people understand content
- **Depth**: Visual layers and realistic motion imply hierarchy and vitality

**Platform-Specific Behaviors:**
- iOS uses bottom tab navigation (not top tabs)
- Modal presentations slide up from bottom
- Swipe gestures for navigation (back, dismiss)
- Pull-to-refresh from top of scrollable content
- Long-press for contextual menus

### 2. iOS Safe Area

**Critical for modern iOS devices:**
```jsx
// React Native
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={styles.container}>
  {/* Your content */}
</SafeAreaView>
```

**Always:**
- Use SafeAreaView or safe-area-inset-* CSS
- Avoid placing interactive elements in notch/home indicator areas
- Test on devices with different safe area configurations

### 3. iOS Typography System

**Font Stack:**
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 
             'Helvetica Neue', Arial, sans-serif;
```

**iOS Text Styles:**
- Large Title: 34pt/41pt, bold
- Title 1: 28pt/34pt, regular
- Title 2: 22pt/28pt, regular
- Title 3: 20pt/25pt, regular
- Headline: 17pt/22pt, semibold
- Body: 17pt/22pt, regular
- Callout: 16pt/21pt, regular
- Subheadline: 15pt/20pt, regular
- Footnote: 13pt/18pt, regular
- Caption 1: 12pt/16pt, regular
- Caption 2: 11pt/13pt, regular

**Support Dynamic Type:**
```jsx
// React Native
<Text style={{ fontSize: 17, lineHeight: 22 }}>Body text</Text>

// Respect user's text size preferences
import { useWindowDimensions } from 'react-native';
```

## Glassmorphism & Liquid Glass Effects

### Understanding the Effect

**Glassmorphism** creates frosted glass appearance using:
- Semi-transparent backgrounds (rgba with 10-25% opacity)
- Backdrop blur (10-30px)
- Subtle borders (1px, 20-30% opacity)
- Layered depth with shadows

**Liquid Glass** (iOS 26+) adds:
- Real-time light refraction
- Dynamic blur based on context
- Morphing between adjacent glass elements
- Specular highlights

### Implementation Guidelines

**Web (CSS):**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
}

/* Dark mode variant */
.glass-card-dark {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

**React Native:**
```jsx
import { BlurView } from '@react-native-community/blur';

<View style={styles.container}>
  <BlurView
    style={styles.absolute}
    blurType="light" // or "dark", "regular", "prominent"
    blurAmount={20}
    reducedTransparencyFallbackColor="white"
  />
  <View style={styles.content}>
    {/* Your content */}
  </View>
</View>
```

**iOS 26 Liquid Glass (React Native):**
```jsx
import { LiquidGlassView } from '@callstack/liquid-glass';

<LiquidGlassView
  effect="regular" // or "clear"
  tintColor="rgba(255, 255, 255, 0.1)"
  colorScheme="system" // or "light", "dark"
  style={styles.glass}
>
  <Text style={styles.text}>Content</Text>
</LiquidGlassView>
```

### Glassmorphism Best Practices

**DO:**
- Use blur values between 10-30px
- Keep background opacity between 0.1-0.25
- Add semi-transparent solid overlay (10-30% opacity) under text for readability
- Maintain WCAG AA contrast ratios (4.5:1 for text)
- Test against various background colors and images
- Use for floating UI: cards, modals, toolbars, navigation bars
- Limit to 2-3 layered glass elements maximum

**DON'T:**
- Use glass effects on entire backgrounds (readability issues)
- Stack more than 3 glass layers (performance impact)
- Apply heavy blur (>30px) on mobile (GPU stress)
- Ignore accessibility preferences (Reduce Transparency)
- Use on dense content areas or forms
- Rely solely on glass for interactive feedback

**Accessibility:**
```jsx
// React Native
import { AccessibilityInfo } from 'react-native';

const [reduceTransparency, setReduceTransparency] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
}, []);

// Fallback for reduced transparency
const glassStyle = reduceTransparency 
  ? styles.solidBackground 
  : styles.glassBackground;
```

**Performance Optimization:**
```jsx
// Use transform instead of animating blur directly
// Avoid animating backdrop-filter (expensive)
// Prefer static glass with animated position/opacity

<Animated.View
  style={[
    styles.glass,
    {
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }]
    }
  ]}
/>
```

## iOS Component Patterns

### 1. Navigation

**Bottom Tab Bar (iOS Standard):**
```jsx
// React Native
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

<Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: '#007AFF',
    tabBarInactiveTintColor: '#8E8E93',
    tabBarStyle: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
    },
  }}
>
  {/* Tabs */}
</Tab.Navigator>
```

**Modal Presentation:**
```jsx
// Slide up from bottom
<Modal
  animationType="slide"
  presentationStyle="pageSheet" // iOS-style sheet
  onRequestClose={onClose}
>
  <View style={styles.modalContent}>
    {/* Drag indicator */}
    <View style={styles.dragIndicator} />
    {children}
  </View>
</Modal>

const styles = StyleSheet.create({
  dragIndicator: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C6C6C8',
    alignSelf: 'center',
    marginTop: 8,
  },
});
```

### 2. Cards & Lists

**iOS-Style Cards:**
```jsx
const Card = ({ children }) => (
  <View style={styles.card}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3, // Android fallback
  },
});
```

**Grouped Lists (Settings-style):**
```jsx
<View style={styles.section}>
  <Text style={styles.sectionHeader}>SECTION TITLE</Text>
  <View style={styles.groupedList}>
    <ListItem title="First Item" />
    <Separator />
    <ListItem title="Second Item" />
    <Separator />
    <ListItem title="Third Item" />
  </View>
</View>

const Separator = () => (
  <View style={styles.separator} />
);

const styles = StyleSheet.create({
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginLeft: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  groupedList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 16,
  },
});
```

### 3. Buttons & Actions

**iOS Button Styles:**
```jsx
// Primary action
<TouchableOpacity style={styles.primaryButton} activeOpacity={0.7}>
  <Text style={styles.primaryButtonText}>Continue</Text>
</TouchableOpacity>

// Secondary action
<TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
  <Text style={styles.secondaryButtonText}>Cancel</Text>
</TouchableOpacity>

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '400',
  },
});
```

### 4. Form Inputs

**iOS Text Input:**
```jsx
<View style={styles.inputContainer}>
  <Text style={styles.inputLabel}>Email</Text>
  <TextInput
    style={styles.input}
    placeholder="Enter your email"
    placeholderTextColor="#C6C6C8"
    autoCapitalize="none"
    keyboardType="email-address"
  />
</View>

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    color: '#000000',
  },
});
```

## iOS Animations & Transitions

### Spring Animations (iOS Default)

**React Native Animated:**
```jsx
import { Animated, Easing } from 'react-native';

// iOS-style spring
Animated.spring(animatedValue, {
  toValue: 1,
  friction: 7, // iOS default ~7-8
  tension: 40, // iOS default ~40
  useNativeDriver: true,
}).start();

// Alternative using timing with easing
Animated.timing(animatedValue, {
  toValue: 1,
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1), // iOS ease-in-out
  useNativeDriver: true,
}).start();
```

**Framer Motion (Web):**
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 24,
  }}
>
  {content}
</motion.div>
```

### Common iOS Animation Patterns

**Fade In:**
```jsx
const FadeInView = ({ children, duration = 300 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {children}
    </Animated.View>
  );
};
```

**Slide In (Modal):**
```jsx
const SlideUpModal = ({ visible, children }) => {
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 600,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
};
```

**Pull-to-Refresh Indicator:**
```jsx
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#007AFF" // iOS spinner color
    />
  }
>
  {content}
</ScrollView>
```

### Micro-interactions

**Button Press Feedback:**
```jsx
const ScaleButton = ({ onPress, children }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
```

## iOS Color System

### System Colors

**iOS Light Mode:**
```javascript
const iOSColors = {
  // System colors
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D55',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',
  
  // Gray scale
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
  
  // Label colors
  label: '#000000',
  secondaryLabel: 'rgba(60, 60, 67, 0.6)',
  tertiaryLabel: 'rgba(60, 60, 67, 0.3)',
  quaternaryLabel: 'rgba(60, 60, 67, 0.18)',
  
  // Fill colors
  systemFill: 'rgba(120, 120, 128, 0.2)',
  secondarySystemFill: 'rgba(120, 120, 128, 0.16)',
  tertiarySystemFill: 'rgba(118, 118, 128, 0.12)',
  quaternarySystemFill: 'rgba(116, 116, 128, 0.08)',
  
  // Background colors
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  tertiarySystemBackground: '#FFFFFF',
  
  // Grouped background
  systemGroupedBackground: '#F2F2F7',
  secondarySystemGroupedBackground: '#FFFFFF',
  tertiarySystemGroupedBackground: '#F2F2F7',
  
  // Separator
  separator: 'rgba(60, 60, 67, 0.29)',
  opaqueSeparator: '#C6C6C8',
};
```

**iOS Dark Mode:**
```javascript
const iOSColorsDark = {
  // System colors (same)
  systemBlue: '#0A84FF',
  systemGreen: '#30D158',
  systemIndigo: '#5E5CE6',
  systemOrange: '#FF9F0A',
  systemPink: '#FF375F',
  systemPurple: '#BF5AF2',
  systemRed: '#FF453A',
  systemTeal: '#64D2FF',
  systemYellow: '#FFD60A',
  
  // Gray scale
  systemGray: '#8E8E93',
  systemGray2: '#636366',
  systemGray3: '#48484A',
  systemGray4: '#3A3A3C',
  systemGray5: '#2C2C2E',
  systemGray6: '#1C1C1E',
  
  // Label colors
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.6)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
  quaternaryLabel: 'rgba(235, 235, 245, 0.18)',
  
  // Fill colors
  systemFill: 'rgba(120, 120, 128, 0.36)',
  secondarySystemFill: 'rgba(120, 120, 128, 0.32)',
  tertiarySystemFill: 'rgba(118, 118, 128, 0.24)',
  quaternarySystemFill: 'rgba(118, 118, 128, 0.18)',
  
  // Background colors
  systemBackground: '#000000',
  secondarySystemBackground: '#1C1C1E',
  tertiarySystemBackground: '#2C2C2E',
  
  // Grouped background
  systemGroupedBackground: '#000000',
  secondarySystemGroupedBackground: '#1C1C1E',
  tertiarySystemGroupedBackground: '#2C2C2E',
  
  // Separator
  separator: 'rgba(84, 84, 88, 0.65)',
  opaqueSeparator: '#38383A',
};
```

**Dark Mode Implementation:**
```jsx
import { useColorScheme } from 'react-native';

const MyComponent = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? iOSColorsDark : iOSColors;
  
  return (
    <View style={{ backgroundColor: colors.systemBackground }}>
      <Text style={{ color: colors.label }}>Hello</Text>
    </View>
  );
};
```

## Responsive Design & Layout

### iOS Device Breakpoints

```javascript
const deviceSizes = {
  // iPhone SE (1st gen), iPhone 5/5S
  small: 320,
  
  // iPhone SE (2nd/3rd gen), iPhone 6/7/8
  medium: 375,
  
  // iPhone 6/7/8 Plus, iPhone X/XS/11 Pro
  large: 414,
  
  // iPhone 12/13/14 Pro Max, iPhone XS Max, iPhone 11 Pro Max
  xlarge: 428,
  
  // iPad Mini, iPad
  tablet: 768,
  
  // iPad Pro 11"
  tabletLarge: 834,
  
  // iPad Pro 12.9"
  tabletXL: 1024,
};
```

**Responsive Hook:**
```jsx
import { useWindowDimensions } from 'react-native';

const useResponsive = () => {
  const { width } = useWindowDimensions();
  
  return {
    isSmall: width < 375,
    isMedium: width >= 375 && width < 414,
    isLarge: width >= 414 && width < 768,
    isTablet: width >= 768,
    width,
  };
};

// Usage
const { isTablet } = useResponsive();
const fontSize = isTablet ? 20 : 17;
```

### Spacing System

**iOS Standard Spacing:**
```javascript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Edge margins typically 16px on iOS
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md, // 16
  },
  section: {
    marginTop: spacing.xl, // 32
  },
});
```

## Accessibility

### iOS Accessibility Features

**VoiceOver Support:**
```jsx
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Add to favorites"
  accessibilityHint="Double tap to add this item to your favorites"
  accessibilityRole="button"
  onPress={onPress}
>
  <Icon name="heart" />
</TouchableOpacity>
```

**Dynamic Type Support:**
```jsx
// Support user's font size preferences
<Text
  style={styles.body}
  allowFontScaling={true}
  maxFontSizeMultiplier={1.3}
>
  Body text that scales with user preferences
</Text>
```

**Reduce Motion:**
```jsx
import { AccessibilityInfo } from 'react-native';

const [reduceMotion, setReduceMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
}, []);

// Disable animations if reduce motion is enabled
const animationDuration = reduceMotion ? 0 : 300;
```

**Color Contrast:**
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text (18pt+)
- Minimum 3:1 for UI components

**Touch Targets:**
- Minimum 44x44 points for all interactive elements
- Provide adequate spacing between tappable items (8px minimum)

## Performance Optimization

### Best Practices

**1. Use Native Driver:**
```jsx
// DO: Animate with native driver
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // ✅ Runs on native thread
}).start();

// DON'T: Animate layout properties without native driver
Animated.timing(value, {
  toValue: 100,
  duration: 300,
  useNativeDriver: false, // ❌ Runs on JS thread
}).start();
```

**2. Optimize Blur Performance:**
```jsx
// DO: Use static blur, animate position/opacity
<Animated.View style={{ opacity: fadeAnim }}>
  <BlurView blurAmount={20} />
</Animated.View>

// DON'T: Animate blur amount (expensive)
<BlurView blurAmount={blurAnim} /> // ❌
```

**3. Memoize Expensive Components:**
```jsx
const GlassCard = React.memo(({ title, content }) => (
  <BlurView style={styles.glass}>
    <Text>{title}</Text>
    <Text>{content}</Text>
  </BlurView>
));
```

**4. Lazy Load Images:**
```jsx
import FastImage from 'react-native-fast-image';

<FastImage
  style={styles.image}
  source={{
    uri: imageUrl,
    priority: FastImage.priority.normal,
  }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

## UI Component Libraries

### Recommended Libraries

**For React Native:**
- **Tamagui** - Fast, iOS-style components with glassmorphism support
- **gluestack-ui** - Accessible, performant, iOS-adaptable
- **@callstack/liquid-glass** - Official iOS 26 Liquid Glass
- **@react-native-community/blur** - Glass effects
- **react-native-reanimated** - High-performance animations
- **react-native-gesture-handler** - Native gesture handling

**For React Web:**
- **Framer Motion** - Smooth iOS-style animations
- **Radix UI** - Headless components for custom styling
- **Tailwind CSS** - Utility-first for custom iOS designs
- **Class Variance Authority (CVA)** - Type-safe component variants

## Code Quality Checklist

Before finalizing iOS-style React UI, verify:

**Design:**
- [ ] Follows iOS Human Interface Guidelines
- [ ] Uses iOS system colors and typography
- [ ] Respects Safe Area on all devices
- [ ] Supports both light and dark modes
- [ ] Uses appropriate iOS navigation patterns

**Glassmorphism:**
- [ ] Blur values between 10-30px
- [ ] Background opacity 0.1-0.25
- [ ] Text contrast meets WCAG AA (4.5:1)
- [ ] Tested on various backgrounds
- [ ] Respects "Reduce Transparency" setting
- [ ] Limited to 2-3 layered elements

**Animations:**
- [ ] Uses spring animations (friction: 7-8, tension: 40)
- [ ] Respects "Reduce Motion" setting
- [ ] All animations use native driver
- [ ] Smooth 60fps performance
- [ ] Appropriate duration (200-400ms)

**Accessibility:**
- [ ] All interactive elements 44x44pt minimum
- [ ] Proper accessibility labels and hints
- [ ] Supports Dynamic Type
- [ ] VoiceOver tested
- [ ] Color contrast verified
- [ ] Focus indicators visible

**Performance:**
- [ ] Images lazy loaded
- [ ] Expensive components memoized
- [ ] No layout thrashing
- [ ] Smooth scrolling (no jank)
- [ ] GPU usage optimized

**Responsive:**
- [ ] Works on iPhone SE to iPad Pro
- [ ] Proper spacing on all sizes
- [ ] Typography scales appropriately
- [ ] Touch targets adequate on all devices

## Example: Complete iOS Glass Card Component

```jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';

const GlassCard = ({
  title,
  description,
  onPress,
  children,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={`Opens ${title}`}
    >
      <View style={styles.container}>
        {/* Glass effect background */}
        <BlurView
          style={styles.absolute}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={20}
          reducedTransparencyFallbackColor={
            isDark ? '#1C1C1E' : '#FFFFFF'
          }
        />
        
        {/* Content overlay for better text contrast */}
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: isDark
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.15)',
            },
          ]}
        />
        
        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            {title}
          </Text>
          
          {description && (
            <Text
              style={[
                styles.description,
                {
                  color: isDark
                    ? 'rgba(235, 235, 245, 0.6)'
                    : 'rgba(60, 60, 67, 0.6)',
                },
              ]}
            >
              {description}
            </Text>
          )}
          
          {children}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
    
    // iOS-style shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    
    // Subtle border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  content: {
    padding: 20,
    minHeight: 120,
  },
  title: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
});

export default GlassCard;
```

## Additional Resources

**Apple Documentation:**
- Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- SF Symbols: https://developer.apple.com/sf-symbols/
- iOS Design Resources: https://developer.apple.com/design/resources/

**React Native:**
- Official Docs: https://reactnative.dev/
- Reanimated: https://docs.swmansion.com/react-native-reanimated/
- Gesture Handler: https://docs.swmansion.com/react-native-gesture-handler/

**Web:**
- Framer Motion: https://www.framer.com/motion/
- Radix UI: https://www.radix-ui.com/
- Tailwind CSS: https://tailwindcss.com/

## Summary

This skill provides comprehensive guidance for creating iOS-style React applications with:
- Authentic iOS design patterns and behaviors
- Modern glassmorphism and liquid glass effects
- Premium animations and micro-interactions
- Full accessibility support
- Optimized performance
- Responsive layouts for all iOS devices

Use these patterns to build polished, premium interfaces that feel native to iOS while maintaining React's flexibility and cross-platform capabilities.
