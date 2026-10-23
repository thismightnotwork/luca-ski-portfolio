/**
 * data.js — Editable content for Luca Finnis-Bernard's portfolio.
 * Race results and race statistics are loaded exclusively from data/gbski.json
 * (or SITE_CONFIG.gbskiApi when a deployed GBSki Worker URL is provided).
 */

const SITE_CONFIG = {
  formEndpoint: "https://formspree.io/f/xjybjbrb",
  gbskiApi: "",
  socials: [
    { label: "Instagram", handle: "@luca.fb_ski", href: "https://instagram.com/luca.fb_ski" },
    { label: "TikTok", handle: "@luca.fb_ski", href: "https://tiktok.com/@luca.fb_ski" },
    { label: "YouTube", handle: "@luca.fb_ski", href: "https://youtube.com/@luca.fb_ski" },
    { label: "Facebook", handle: "@luca.fb_ski", href: "https://facebook.com/luca.fb_ski" },
    { label: "Strava", handle: "@luca.fb_ski", href: "https://strava.com/athletes/luca.fb_ski" }
  ],
  gbSkiProfile: "https://gbski.com/biography.php?id=42382"
};

const SEASON_STATS = [
  { value: "21", label: "Days on snow" },
  { value: "13", label: "Training sessions" },
  { value: "1", label: "Training camp" },
  { value: "1", label: "Dry-slope session" },
  { value: "2", label: "Countries" },
  { value: "15", label: "Competitions" }
];

const EQUIPMENT = [
  { part: "Skis", brand: "Atomic" },
  { part: "Ski boots", brand: "Atomic" },
  { part: "Goggles", brand: "Atomic" },
  { part: "Helmet", brand: "POC" },
  { part: "Gloves", brand: "SnowShepherd" },
  { part: "Protection", brand: "Leki" },
  { part: "Poles", brand: "Leki" },
  { part: "Base layer", brand: "Bolger" },
  { part: "Bags", brand: "Head" }
];

const JOURNEY = [
  {
    date: "Ongoing",
    title: "BASI Ski UK Level 2 instructor",
    category: "Instruction",
    description: "Teaching skiing at The Snow Centre, Hemel Hempstead, and Knockhatch Adventure Park, applying race-technique fundamentals to every lesson."
  },
  {
    date: "Ongoing",
    title: "Hemel Ski Race Club racer",
    category: "Racing",
    description: "Racing slalom and giant slalom for HSRC, training on dry slope and snow with a focus on gate technique and line precision."
  },
  {
    date: "Jun 2025",
    title: "Season opener — first win",
    category: "Racing",
    description: "Opened the 2025/26 record with a 1st place giant slalom finish and back-to-back podiums at the ERSA Summer League in Milton Keynes and Hemel Hempstead."
  },
  {
    date: "Jul 2025",
    title: "Club National racing",
    category: "Racing",
    description: "Raced the ERSA and Hemel Club Nationals, with a 2nd-place category result at Snozone MK and further top-five category finishes at Hemel."
  },
  {
    date: "Sep 2025",
    title: "Championship season",
    category: "Racing",
    description: "Third place at the Hemel Championships and fourth in U18 at the ERSA Championship in Milton Keynes."
  },
  {
    date: "2025/26",
    title: "Mountain training camp, Tignes",
    category: "Training",
    description: "A dedicated snow-training camp in Tignes, adding mountain-racing mileage to a season built mostly on UK dry slope and indoor snow."
  },
  {
    date: "Jun–Jul 2026",
    title: "Strong summer racing block",
    category: "Racing",
    description: "Multiple U18 podiums and top-four finishes at the ERSA Summer League, followed by the ERSA and Hemel Club Nationals."
  },
  {
    date: "Ongoing",
    title: "Snow Shepherd Pro Deal",
    category: "Support",
    description: "On a Snow Shepherd Pro Deal, receiving 50% off Snow Shepherd products for training, racing and instructing."
  }
];
