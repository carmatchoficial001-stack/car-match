export const AD_PLATFORMS = [
    { id: 'instagram_feed', label: 'Instagram Feed', icon: '📸', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500', w: 1080, h: 1080 },
    { id: 'instagram_stories', label: 'Instagram Stories', icon: '📱', color: 'bg-gradient-to-tr from-orange-400 to-pink-600', w: 1080, h: 1920 },
    { id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'bg-black border border-white/20', w: 1080, h: 1920 },
    { id: 'facebook', label: 'Facebook', icon: '👤', color: 'bg-[#1877F2]', w: 1200, h: 628 },
    { id: 'x_twitter', label: 'X (Twitter)', icon: '𝕏', color: 'bg-black', w: 1600, h: 900 },
    { id: 'google_ads', label: 'Google Ads', icon: '🔍', color: 'bg-white text-blue-600', w: 1200, h: 628 },
    { id: 'snapchat', label: 'Snapchat', icon: '👻', color: 'bg-[#FFFC00] text-black', w: 1080, h: 1920 },
    { id: 'kwai', label: 'Kwai', icon: '🎬', color: 'bg-orange-500', w: 1080, h: 1920 },
    { id: 'threads', label: 'Threads', icon: '@', color: 'bg-black', w: 1080, h: 1080 },
] as const;

export type AdPlatformId = typeof AD_PLATFORMS[number]['id'];
