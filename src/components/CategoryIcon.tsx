"use client"

import React from 'react'
import * as LucideIcons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface CategoryIconProps {
    iconName: string
    className?: string
    size?: number
    color?: string
}

const CategoryIcon = ({ iconName, className = '', size = 20, color }: CategoryIconProps) => {
    // Get the icon component from Lucide
    const Icon = (LucideIcons as any)[iconName] as LucideIcon

    if (!Icon) {
        // Fallback if icon not found
        return <LucideIcons.HelpCircle className={className} size={size} style={{ color }} />
    }

    return <Icon className={className} size={size} style={{ color }} />
}

export default CategoryIcon
