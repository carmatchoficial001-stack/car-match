'use client';

import { useEffect, useState } from 'react';

interface MarketingStats {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalViews: number;
    totalLikes: number;
    avgViralScore: number;
}

interface RecentPost {
    id: string;
    title: string;
    platform: string;
    views: number;
    likes: number;
    viralScore: number;
    publishedAt: string;
}

export default function MarketingStudioStats() {
    const [stats, setStats] = useState<MarketingStats | null>(null);
    const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
        // Actualizar cada 30 segundos
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/marketing/stats');

            if (!response.ok) {
                throw new Error('Error obteniendo estadísticas');
            }

            const data = await response.json();

            if (data.success) {
                setStats(data.stats);
                setRecentPosts(data.recentPosts || []);
                setError('');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 bg-white rounded-lg border">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-24 bg-gray-200 rounded"></div>
                        <div className="h-24 bg-gray-200 rounded"></div>
                        <div className="h-24 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-bold text-red-700 mb-2">⚠️ Error Marketing Studio</h3>
                <p className="text-red-600 text-sm">{error}</p>
                <p className="text-xs text-gray-500 mt-2">
                    Asegúrate que el Marketing Studio esté corriendo en localhost:3001
                </p>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">📊 Marketing Studio</h2>
                <a
                    href="http://localhost:3001"
                    target="_blank"
                    className="text-sm text-blue-600 hover:underline"
                >
                    Abrir Marketing Studio →
                </a>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">
                        {stats.totalPosts}
                    </div>
                    <div className="text-xs text-gray-600">Posts Totales</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">
                        {stats.publishedPosts}
                    </div>
                    <div className="text-xs text-gray-600">Publicados</div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-700">
                        {stats.draftPosts}
                    </div>
                    <div className="text-xs text-gray-600">Borradores</div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">
                        {stats.totalViews.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Views Totales</div>
                </div>

                <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                    <div className="text-2xl font-bold text-pink-700">
                        {stats.avgViralScore.toFixed(1)}/10
                    </div>
                    <div className="text-xs text-gray-600">Viral Score</div>
                </div>
            </div>

            {/* Recent Posts */}
            {recentPosts.length > 0 && (
                <div className="bg-white p-6 rounded-lg border">
                    <h3 className="font-bold mb-4 text-lg">🔥 Posts Recientes</h3>
                    <div className="space-y-3">
                        {recentPosts.slice(0, 5).map((post) => (
                            <div
                                key={post.id}
                                className="flex justify-between items-center py-3 border-b last:border-0 hover:bg-gray-50 px-2 rounded"
                            >
                                <div className="flex-1">
                                    <div className="font-medium text-sm">{post.title}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                                            {post.platform}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(post.publishedAt).toLocaleDateString('es-MX')}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <div className="text-sm font-semibold">
                                        {post.views.toLocaleString()} views
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {post.likes.toLocaleString()} likes · Score: {post.viralScore?.toFixed(1) || 'N/A'}/10
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
