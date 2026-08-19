/**
 * data.js — Editable content for Luca Finnis-Bernard's portfolio.
 * All figures below are drawn from the site's own published race log.
 * Update this file to add races, timeline entries, or to wire up a
 * contact-form endpoint. Gallery photos are auto-discovered from the
 * photos/ folder — no entries needed here. No other file needs to change.
 */

const SITE_CONFIG = {
  formEndpoint: "https://formspree.io/f/xjybjbrb",
  socials: [
    { label: "Instagram", handle: "@luca.fb_ski", href: "https://instagram.com/luca.fb_ski" },
    { label: "TikTok", handle: "@luca.fb_ski", href: "https://tiktok.com/@luca.fb_ski" },
    { label: "YouTube", handle: "@luca.fb_ski", href: "https://youtube.com/@luca.fb_ski" },
    { label: "Facebook", handle: "@luca.fb_ski", href: "https://facebook.com/luca.fb_ski" },
    { label: "Strava", handle: "@luca.fb_ski", href: "https://strava.com/athletes/luca.fb_ski" }
  ],
  gbSkiProfile: "https://gbski.com/biography.php?id=42382"
};

const RACE_RESULTS = [
  { place: "4th", event: "ERSA Summer League", discipline: "GS", tier: "Regional", venue: "Milton Keynes", date: "2026-06-07", display: "7 Jun 2026" },
  { place: "4th", event: "ERSA Summer League", discipline: "SL", tier: "Regional", venue: "Milton Keynes", date: "2026-06-07", display: "7 Jun 2026" },
  { place: "2nd", event: "ERSA Summer League", discipline: "GS", tier: "Regional", venue: "Hemel Hempstead", date: "2026-06-06", display: "6 Jun 2026" },
  { place: "4th", event: "ERSA Summer League", discipline: "SL", tier: "Regional", venue: "Hemel Hempstead", date: "2026-06-06", display: "6 Jun 2026" },
  { place: "4th", event: "ERSA Championship", discipline: "SL", tier: "Regional", venue: "Milton Keynes", date: "2025-09-14", display: "14 Sep 2025" },
  { place: "3rd", event: "Hemel Championships", discipline: "SL", tier: "Club", venue: "Hemel Hempstead", date: "2025-09-06", display: "6 Sep 2025" },
  { place: "2nd", event: "ERSA CN", discipline: "SL", tier: "Regional", venue: "Milton Keynes", date: "2025-07-13", display: "13 Jul 2025" },
  { place: "3rd", event: "Hemel CN", discipline: "SL", tier: "Club", venue: "Hemel Hempstead", date: "2025-07-12", display: "12 Jul 2025" },
  { place: "1st", event: "ERSA Summer League", discipline: "GS", tier: "Regional", venue: "Milton Keynes", date: "2025-06-08", display: "8 Jun 2025" },
  { place: "2nd", event: "ERSA Summer League", discipline: "SL", tier: "Regional", venue: "Milton Keynes", date: "2025-06-08", display: "8 Jun 2025" },
  { place: "3rd", event: "ERSA Summer League", discipline: "SL", tier: "Regional", venue: "Hemel Hempstead", date: "2025-06-07", display: "7 Jun 2025" }
];

const SEASON_STATS = [
  { value: "21", label: "Days on snow" },
  { value: "13", label: "Training sessions" },
  { value: "1", label: "Training camp" },
  { value: "1", label: "Dry-slope session" },
  { value: "2", label: "Countries" },
  { value: "13", label: "Competitions" }
];

const EQUIPMENT = [
  { part: "Skis", brand: "Atomic" },
  { part: "Ski boots", brand: "Atomic" },
  { part: "Goggles", brand: "Atomic" },
  { part: "Helmet", brand: "POC" },
  { part: "Gloves", brand: "SnowShepard" },
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
    title: "Slalom podiums at club and regional level",
    category: "Racing",
    description: "Third at the Hemel CN and second at the ERSA CN, consolidating slalom form heading into the autumn championships."
  },
  {
    date: "Sep 2025",
    title: "Championship season",
    category: "Racing",
    description: "Third place at the Hemel Championships and a strong finish at the ERSA Championship in Milton Keynes."
  },
  {
    date: "2025/26",
    title: "Mountain training camp, Tignes",
    category: "Training",
    description: "A dedicated snow-training camp in Tignes, adding mountain-racing mileage to a season built mostly on UK dry slope and indoor snow."
  },
  {
    date: "Jun 2026",
    title: "Latest results",
    category: "Racing",
    description: "Two podiums and consistent top-four finishes across GS and SL at the ERSA Summer League, taking the season record to 11 races, 1 win and 7 podiums."
  },
  {
    date: "Ongoing",
    title: "SnowShepard Pro Team athlete",
    category: "Team",
    description: "Representing SnowShepard as part of its Pro Team, alongside HSRC club racing and instruction work."
  }
];
