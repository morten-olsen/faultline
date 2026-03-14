import { motion } from 'motion/react';

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
};

const stagger = (
  i: number,
  base = 0,
): {
  initial: typeof fadeUp.initial;
  animate: typeof fadeUp.animate;
  transition: { duration: number; ease: typeof fadeUp.transition.ease; delay: number };
} => ({
  ...fadeUp,
  transition: { ...fadeUp.transition, delay: base + i * 0.05 },
});

type AnimatedFieldProps = {
  children: React.ReactNode;
  index: number;
  base?: number;
};

const AnimatedField = ({ children, index, base = 0.08 }: AnimatedFieldProps): React.ReactElement => (
  <motion.div {...stagger(index, base)}>{children}</motion.div>
);

export type { AnimatedFieldProps };
export { AnimatedField };
