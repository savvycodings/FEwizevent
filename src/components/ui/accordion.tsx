import { Text } from '@/components/ui/text';
import { ToolbarRow } from '@/components/layout/ToolbarRow';
import { rowGrow } from '@/components/layout/PressableRow';
import { cn } from '@/lib/utils';
import * as AccordionPrimitive from '@rn-primitives/accordion';
import { useContext } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeOutUp,
  LayoutAnimationConfig,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { ThemeContext } from '../../context';
import { AppIcon } from './app-icon';
import { Separator } from './separator';

function Accordion({
  children,
  ref,
  ...props
}: Omit<React.ComponentProps<typeof AccordionPrimitive.Root>, 'asChild'>) {
  return (
    <LayoutAnimationConfig skipEntering>
      <AccordionPrimitive.Root
        {...(props as AccordionPrimitive.RootProps)}
        asChild={Platform.OS !== 'web'}>
        <Animated.View layout={LinearTransition.duration(200)} className="w-full">
          {children}
        </Animated.View>
      </AccordionPrimitive.Root>
    </LayoutAnimationConfig>
  );
}

function AccordionItem({
  children,
  className,
  value,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn('w-full', className)}
      value={value}
      asChild={Platform.OS !== 'web'}
      {...props}>
      <Animated.View
        className="native:w-full native:overflow-hidden"
        layout={Platform.select({ native: LinearTransition.duration(200) })}>
        {children}
        <Separator className="bg-border" />
      </Animated.View>
    </AccordionPrimitive.Item>
  );
}

const TriggerShell = Platform.OS === 'web' ? View : Pressable;

type AccordionTriggerProps = React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  /** Section label (preferred). Plain text only — no leading icons. */
  title?: string;
  children?: React.ReactNode;
};

function AccordionTrigger({ className, title, children, ...props }: AccordionTriggerProps) {
  const { theme } = useContext(ThemeContext);
  const { isExpanded } = AccordionPrimitive.useItemContext();

  const progress = useDerivedValue(
    () => (isExpanded ? withTiming(1, { duration: 250 }) : withTiming(0, { duration: 200 })),
    [isExpanded]
  );
  const chevronStyle = useAnimatedStyle(
    () => ({
      transform: [{ rotate: `${progress.value * 180}deg` }],
    }),
    [progress]
  );

  const label = title ?? (typeof children === 'string' ? children : null);

  return (
    <AccordionPrimitive.Header className="w-full shrink-0">
      <AccordionPrimitive.Trigger {...props} asChild>
        <TriggerShell
          className={cn(
            'w-full disabled:opacity-50',
            Platform.select({
              web: 'focus-visible:ring-ring/50 outline-none transition-opacity focus-visible:ring-[3px] disabled:pointer-events-none',
            }),
            className
          )}
          style={styles.trigger}
          accessibilityRole="button">
          <ToolbarRow>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={rowGrow.text}
              className="text-left text-base font-semibold leading-tight text-foreground">
              {label ?? children}
            </Text>
            <Animated.View style={[rowGrow.end, chevronStyle]}>
              <AppIcon name="chevron-down" size={18} color={theme.mutedForegroundColor} />
            </Animated.View>
          </ToolbarRow>
        </TriggerShell>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: '100%',
    paddingVertical: 14,
  },
});

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  const { isExpanded } = AccordionPrimitive.useItemContext();
  return (
    <AccordionPrimitive.Content
      className={cn(
        'overflow-hidden',
        Platform.select({
          web: isExpanded ? 'animate-accordion-down' : 'animate-accordion-up',
        })
      )}
      {...props}>
      <Animated.View
        exiting={Platform.select({ native: FadeOutUp.duration(200) })}
        className={cn('pb-3 pt-1', className)}>
        {children}
      </Animated.View>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
