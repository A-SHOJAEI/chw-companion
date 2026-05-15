const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle WAV/MP3/MD as static assets (default Metro only handles images & fonts).
config.resolver.assetExts = Array.from(
  new Set([...config.resolver.assetExts, 'wav', 'mp3', 'md'])
);

module.exports = config;
