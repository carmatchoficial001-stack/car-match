'use client'

import { create } from 'zustand'

interface RestoreSessionModalStore {
    isOpen: boolean
    message: string
    onConfirm: (() => void) | null
    openModal: (message: string, onConfirm: () => void) => void
    closeModal: () => void
    confirm: () => void
}

export const useRestoreSessionModal = create<RestoreSessionModalStore>((set, get) => ({
    isOpen: false,
    message: '',
    onConfirm: null,
    openModal: (message: string, onConfirm: () => void) => {
        set({ isOpen: true, message, onConfirm })
    },
    closeModal: () => {
        set({ isOpen: false, message: '', onConfirm: null })
    },
    confirm: () => {
        const { onConfirm, closeModal } = get()
        if (onConfirm) onConfirm()
        closeModal()
    }
}))
