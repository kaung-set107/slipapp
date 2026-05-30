const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "react-hook-form": path.resolve(__dirname, "vendor/react-hook-form"),
  zod: path.resolve(__dirname, "vendor/zod"),
  "@hookform/resolvers": path.resolve(__dirname, "vendor/@hookform/resolvers"),
};

module.exports = config;
