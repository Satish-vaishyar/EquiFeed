import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex-1 overflow-y-auto pb-20 ${className}`}
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)', minHeight: '100dvh' }}
    >
      {children}
    </motion.div>
  );
}
