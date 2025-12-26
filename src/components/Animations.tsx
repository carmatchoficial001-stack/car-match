'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps {
    children: ReactNode
    className?: string
    delay?: number
}

export function AnimatedCard({ children, className = '', delay = 0 }: AnimatedCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                duration: 0.3,
                delay: delay,
                ease: "easeOut"
            }}
            whileHover={{ 
                scale: 1.02,
                y: -5,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

interface StaggerContainerProps {
    children: ReactNode
    className?: string
}

export function StaggerContainer({ children, className = '' }: StaggerContainerProps) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0 },
                show: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1
                    }
                }
            }}
            initial="hidden"
            animate="show"
            className={className}
        >
            {children}
        </motion.div>
    )
}

interface FadeInProps {
    children: ReactNode
    className?: string
    delay?: number
}

export function FadeIn({ children, className = '', delay = 0 }: FadeInProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

interface ScaleButtonProps {
    children: ReactNode
    onClick?: () => void
    className?: string
}

export function ScaleButton({ children, onClick, className = '' }: ScaleButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            className={className}
        >
            {children}
        </motion.button>
    )
}

interface AnimatedIconProps {
    children: ReactNode
    active?: boolean
}

export function AnimatedIcon({ children, active = false }: AnimatedIconProps) {
    return (
        <motion.div
            animate={active ? { 
                scale: [1, 1.3, 1],
                rotate: [0, 10, -10, 0]
            } : {}}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
        >
            {children}
        </motion.div>
    )
}

export function PageTransition({ children }: { children: ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
        >
            {children}
        </motion.div>
    )
}
