import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(4);

// Output settings optimized for Meta ads
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setProResProfile("4444");
