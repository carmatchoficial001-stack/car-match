// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Trash2, Edit2, Clock, Sparkles, Image as ImageIcon, Film, FileText, Share2, Download, Copy } from 'lucide-react'
import { getSocialQueue, deleteSocialPost, updateSocialPostContent, markAsPublished } from '@/app/admin/actions/social-queue-actions'

export default function SocialQueue() {
    const [queue, setQueue] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState('')

    useEffect(() => {
        loadQueue()
    }, [])

    const loadQueue = async () => {
        setLoading(true)
        const res = await getSocialQueue()
        if (res.success) {
            setQueue(res.queue || [])
        }
        setLoading(false)
    }

    const handleManualPublish = async (id: string) => {
        if (!confirm('¿Ya lo publicaste en tus redes? Se marcará como COMPLETADO y desaparecerá de aquí.')) return
        const res = await markAsPublished(id)
        if (res.success) {
            setQueue(queue.filter(q => q.id !== id))
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este borrador?')) return
        const res = await deleteSocialPost(id)
        if (res.success) {
            setQueue(queue.filter(q => q.id !== id))
        }
    }

    const startEdit = (post: any) => {
        setEditingId(post.id)
        setEditContent(post.content)
    }

    const saveEdit = async () => {
        if (!editingId) return
        const res = await updateSocialPostContent(editingId, editContent)
        if (res.success) {
            setQueue(queue.map(q => q.id === editingId ? { ...q, content: editContent } : q))
            setEditingId(null)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert('Texto copiado al portapapeles')
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 pb-0 flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" /> Cola de Contenido
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">Modo Manual</span>
                </h3>
                <button onClick={loadQueue} className="text-xs text-text-secondary hover:text-white">Refrescar</button>
            </div>

            {loading ? (
                <div className="p-10 text-center text-text-secondary">Cargando Ideas Virales...</div>
            ) : queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-text-secondary opacity-50">
                    <Sparkles className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-bold">Todo Publicado</h3>
                    <p className="text-sm">El piloto automático generará más borradores pronto.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 overflow-y-auto">
                    <AnimatePresence>
                        {queue.map((post) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col hover:border-blue-500/30 transition-colors group"
                            >
                                {/* Strategy Tag */}
                                <div className="bg-black/40 p-3 text-xs flex items-center justify-between border-b border-white/5">
                                    <div className="flex items-center gap-2 text-white/60">
                                        <Sparkles className="w-3 h-3 text-yellow-400" />
                                        <span>{post.targetPersona || 'Viral'}</span>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-white/30">{post.platform}</span>
                                </div>

                                {/* Media Preview */}
                                <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                                    {post.imageUrl ? (
                                        <>
                                            <img src={post.imageUrl} alt="Contenido" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            <a
                                                href={post.imageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute bottom-2 right-2 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition backdrop-blur-sm"
                                                title="Ver / Descargar Imagen"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                        </>
                                    ) : post.videoScript ? (
                                        <div className="p-4 text-[10px] font-mono text-green-400/80 w-full h-full bg-zinc-950 overflow-hidden relative">
                                            <div className="absolute top-2 right-2 text-white/20"><Film className="w-4 h-4" /></div>
                                            {post.videoScript}
                                        </div>
                                    ) : (
                                        <FileText className="w-12 h-12 text-white/20" />
                                    )}
                                </div>

                                {/* Caption Content */}
                                <div className="p-4 flex-1 flex flex-col gap-3">
                                    {editingId === post.id ? (
                                        <textarea
                                            className="w-full h-32 bg-black/50 border border-white/20 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none resize-none"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                        />
                                    ) : (
                                        <div className="relative group/text">
                                            <p className="text-sm text-white/80 whitespace-pre-wrap line-clamp-4 hover:line-clamp-none transition-all cursor-pointer" onClick={() => copyToClipboard(post.content)}>
                                                {post.content}
                                            </p>
                                            <button
                                                onClick={() => copyToClipboard(post.content)}
                                                className="absolute -top-2 -right-2 p-1 bg-zinc-800 text-white/50 hover:text-white rounded shadow-sm opacity-0 group-hover/text:opacity-100 transition"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Video Prompt Extra */}
                                {post.videoPrompt && (
                                    <div className="bg-zinc-800/50 p-2 rounded border border-white/5 mt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] uppercase font-bold text-purple-400 flex gap-1 items-center">
                                                <Film className="w-3 h-3" /> Prompt Veo 3
                                            </span>
                                            <button onClick={() => copyToClipboard(post.videoPrompt)} className="text-[10px] text-white/50 hover:text-white flex gap-1 items-center bg-white/5 px-2 py-0.5 rounded transition">
                                                <Copy className="w-3 h-3" /> Copiar
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-white/40 font-mono line-clamp-2 hover:line-clamp-none cursor-pointer border-t border-white/5 pt-1" onClick={() => copyToClipboard(post.videoPrompt)}>
                                            {post.videoPrompt}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="p-3 bg-black/20 border-t border-white/5 flex gap-2">
                                    {editingId === post.id ? (
                                        <button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-500 transition w-full">Guardar</button>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(post)} className="p-2 hover:bg-white/10 rounded-lg text-text-secondary transition"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(post.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                                            <div className="flex-1"></div>
                                            <button
                                                onClick={() => handleManualPublish(post.id)}
                                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-blue-900/20 flex items-center gap-2"
                                            >
                                                <Share2 className="w-3 h-3" />
                                                Ya lo publiqué
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
