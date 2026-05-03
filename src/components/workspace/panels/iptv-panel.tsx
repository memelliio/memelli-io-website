'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { IDockviewPanelProps } from 'dockview';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Channel {
  id: string;
  name: string;
  category: string;
  color: string;
  accent?: string;
  stream?: string;
  logo?: string;
  description?: string;
}

interface Movie {
  id: string;
  title: string;
  year: number;
  genre: string;
  rating: string;
  runtime: string;
  description: string;
  color: string;
  accent: string;
  stream?: string;
  featured?: boolean;
}

interface Reel {
  id: string;
  title: string;
  creator: string;
  category: string;
  color: string;
  accent: string;
  views: string;
  duration: string;
  stream?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Channel data — 60+ channels                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

// Logo CDN — iptv-org community logos (free, public domain)
const L = 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries';

const ALL_CHANNELS: Channel[] = [
  // News
  { id: 'cnn',            name: 'CNN',                category: 'News',          color: '#cc0000', accent: '#ff4444',  logo: `${L}/united-states/cnn.png`,           stream: 'https://cnn-cnninternational-1-us.pluto.tv/live/cnninternational/master.m3u8', description: 'World news 24/7' },
  { id: 'al-jazeera',     name: 'Al Jazeera',         category: 'News',          color: '#005a8c', accent: '#38bdf8',  logo: `${L}/qatar/al-jazeera-english.png`,     stream: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8', description: 'Global news from Qatar' },
  { id: 'dw-news',        name: 'DW News',            category: 'News',          color: '#003e7e', accent: '#60a5fa',  logo: `${L}/germany/dw.png`,                  stream: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', description: 'Deutsche Welle international' },
  { id: 'france24',       name: 'France 24',          category: 'News',          color: '#002395', accent: '#818cf8',  logo: `${L}/france/france-24.png`,             stream: 'https://stream.france24.com/hls/live/2037165/f24_en_hi/master.m3u8', description: 'French international news' },
  { id: 'abc-news',       name: 'ABC News',           category: 'News',          color: '#003087', accent: '#4a90d9',  logo: `${L}/united-states/abc-news.png`,       stream: 'https://content.uplynk.com/channel/3324f2467c414329b3b0cc5cd987b6be.m3u8', description: 'American Broadcasting' },
  { id: 'nbc-news',       name: 'NBC News',           category: 'News',          color: '#f37021', accent: '#fb923c',  logo: `${L}/united-states/nbc-news.png`,       description: 'National news coverage' },
  { id: 'cbs-news',       name: 'CBS News',           category: 'News',          color: '#003366', accent: '#38bdf8',  logo: `${L}/united-states/cbs-news.png`,       stream: 'https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d562b8a7c/master.m3u8', description: 'CBS News 24/7 streaming' },
  { id: 'bbc-world',      name: 'BBC World',          category: 'News',          color: '#bb1919', accent: '#f87171',  logo: `${L}/united-kingdom/bbc-world-news.png`, description: 'British Broadcasting Corp' },
  { id: 'euronews',       name: 'Euronews',           category: 'News',          color: '#004494', accent: '#93c5fd',  logo: `${L}/international/euronews.png`,       stream: 'https://euronews-euronews-english-1-de.samsung.wurl.tv/manifest/playlist.m3u8', description: 'Pan-European news' },
  { id: 'sky-news',       name: 'Sky News',           category: 'News',          color: '#cc0000', accent: '#ef4444',  logo: `${L}/united-kingdom/sky-news.png`,      stream: 'https://skynews-skynewsintl-1-gb.samsung.wurl.tv/manifest/playlist.m3u8', description: 'UK breaking news' },
  { id: 'cgtn',           name: 'CGTN',               category: 'News',          color: '#c41230', accent: '#f87171',  logo: `${L}/china/cgtn.png`,                  stream: 'https://news.cgtn.com/resource/live/english/cgtn-news.m3u8', description: 'China Global TV Network' },
  { id: 'nhk-world',      name: 'NHK World',          category: 'News',          color: '#0033a0', accent: '#60a5fa',  logo: `${L}/japan/nhk-world-japan.png`,        stream: 'https://nhkwlive-ojp.akamaized.net/hls/live/2003458-b/nhkwlive-ojp-en/index.m3u8', description: 'Japan Broadcasting' },
  { id: 'pbs-newshour',   name: 'PBS NewsHour',       category: 'News',          color: '#1e3a5f', accent: '#3b82f6',  logo: `${L}/united-states/pbs.png`,           description: 'In-depth public news' },
  { id: 'oann',           name: 'OAN',                category: 'News',          color: '#1a1a2e', accent: '#818cf8',  logo: `${L}/united-states/one-america-news.png`, description: 'One America News' },
  { id: 'rt-news',        name: 'RT',                 category: 'News',          color: '#4b0000', accent: '#f87171',  logo: `${L}/russia/rt.png`,                   description: 'Russian international news' },
  // Sports
  { id: 'espn',           name: 'ESPN',               category: 'Sports',        color: '#cc0000', accent: '#ef4444',  logo: `${L}/united-states/espn.png`,          description: 'Sports center worldwide' },
  { id: 'espn2',          name: 'ESPN 2',             category: 'Sports',        color: '#990000', accent: '#ef4444',  logo: `${L}/united-states/espn-2.png`,         description: 'More sports action' },
  { id: 'fox-sports',     name: 'Fox Sports',         category: 'Sports',        color: '#002244', accent: '#3b82f6',  logo: `${L}/united-states/fox-sports-1.png`,  description: 'Fox sports network' },
  { id: 'nfl-network',    name: 'NFL Network',        category: 'Sports',        color: '#013369', accent: '#60a5fa',  logo: `${L}/united-states/nfl-network.png`,   description: 'All NFL, all the time' },
  { id: 'nba-tv',         name: 'NBA TV',             category: 'Sports',        color: '#c9082a', accent: '#f87171',  logo: `${L}/united-states/nba-tv.png`,         description: 'Basketball 24/7' },
  { id: 'mlb-network',    name: 'MLB Network',        category: 'Sports',        color: '#002d72', accent: '#3b82f6',  logo: `${L}/united-states/mlb-network.png`,   description: 'Major League Baseball' },
  { id: 'nhl-network',    name: 'NHL Network',        category: 'Sports',        color: '#000000', accent: '#a1a1aa',  logo: `${L}/united-states/nhl-network.png`,   description: 'Hockey coverage' },
  { id: 'bein-sports',    name: 'beIN Sports',        category: 'Sports',        color: '#750000', accent: '#f87171',  logo: `${L}/international/bein-sports.png`,   description: 'Global sports network' },
  { id: 'golf-channel',   name: 'Golf Channel',       category: 'Sports',        color: '#006838', accent: '#4ade80',  logo: `${L}/united-states/golf-channel.png`,  description: 'Golf all day' },
  { id: 'tennis-channel', name: 'Tennis Channel',     category: 'Sports',        color: '#155e75', accent: '#22d3ee',  logo: `${L}/united-states/tennis-channel.png`, description: 'Tennis worldwide' },
  { id: 'fight-network',  name: 'Fight Network',      category: 'Sports',        color: '#7f1d1d', accent: '#ef4444',  logo: `${L}/canada/fight-network.png`,        description: 'MMA & boxing coverage' },
  { id: 'olympics-ch',    name: 'Olympics Channel',   category: 'Sports',        color: '#0066b3', accent: '#60a5fa',  logo: `${L}/international/olympics-channel.png`, description: 'Olympic sports coverage' },
  // Entertainment
  { id: 'discovery',      name: 'Discovery',          category: 'Entertainment', color: '#0047AB', accent: '#818cf8',  logo: `${L}/united-states/discovery-channel.png`, description: 'Science & exploration' },
  { id: 'history',        name: 'History',            category: 'Entertainment', color: '#8B4513', accent: '#f59e0b',  logo: `${L}/united-states/history.png`,       description: 'History documentaries' },
  { id: 'natgeo',         name: 'Nat Geo',            category: 'Entertainment', color: '#FFD700', accent: '#fbbf24',  logo: `${L}/united-states/national-geographic.png`, description: 'National Geographic' },
  { id: 'animal-planet',  name: 'Animal Planet',      category: 'Entertainment', color: '#166534', accent: '#4ade80',  logo: `${L}/united-states/animal-planet.png`, description: 'Wildlife & nature' },
  { id: 'aetv',           name: 'A&E',                category: 'Entertainment', color: '#1e3a5f', accent: '#60a5fa',  logo: `${L}/united-states/ae.png`,            description: 'Arts & Entertainment' },
  { id: 'tlc',            name: 'TLC',                category: 'Entertainment', color: '#7c3aed', accent: '#a78bfa',  logo: `${L}/united-states/tlc.png`,           description: 'The Learning Channel' },
  { id: 'hgtv',           name: 'HGTV',               category: 'Entertainment', color: '#065f46', accent: '#34d399',  logo: `${L}/united-states/hgtv.png`,          description: 'Home & garden' },
  { id: 'food-network',   name: 'Food Network',       category: 'Entertainment', color: '#7c2d12', accent: '#fb923c',  logo: `${L}/united-states/food-network.png`,  description: 'Cooking shows & more' },
  { id: 'travel',         name: 'Travel Channel',     category: 'Entertainment', color: '#1d4ed8', accent: '#60a5fa',  logo: `${L}/united-states/travel-channel.png`, description: 'Travel & adventure' },
  { id: 'crime-inv',      name: 'Investigation Discovery', category: 'Entertainment', color: '#1a1a1a', accent: '#a1a1aa', logo: `${L}/united-states/investigation-discovery.png`, description: 'True crime stories' },
  { id: 'syfy',           name: 'Syfy',               category: 'Entertainment', color: '#1e1b4b', accent: '#818cf8',  logo: `${L}/united-states/syfy.png`,          description: 'Sci-fi & fantasy' },
  { id: 'paramount',      name: 'Paramount',          category: 'Entertainment', color: '#003087', accent: '#60a5fa',  logo: `${L}/united-states/paramount-network.png`, description: 'Paramount Network' },
  { id: 'bravo',          name: 'Bravo',              category: 'Entertainment', color: '#2d0f4e', accent: '#c4b5fd',  logo: `${L}/united-states/bravo.png`,         description: 'Reality & lifestyle' },
  { id: 'e-ent',          name: 'E! Entertainment',   category: 'Entertainment', color: '#4b0082', accent: '#a78bfa',  logo: `${L}/united-states/e.png`,             description: 'Celebrity & pop culture' },
  // Music
  { id: 'mtv',            name: 'MTV',                category: 'Music',         color: '#000000', accent: '#facc15',  logo: `${L}/united-states/mtv.png`,           description: 'Music television' },
  { id: 'vh1',            name: 'VH1',                category: 'Music',         color: '#7c3aed', accent: '#c4b5fd',  logo: `${L}/united-states/vh1.png`,           description: 'Music & pop culture' },
  { id: 'bet',            name: 'BET',                category: 'Music',         color: '#1a1a1a', accent: '#facc15',  logo: `${L}/united-states/bet.png`,           description: 'Black Entertainment TV' },
  { id: 'lofi',           name: 'Lofi Radio',         category: 'Music',         color: '#2d1b4e', accent: '#a78bfa',  stream: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', description: 'Chill beats 24/7' },
  { id: 'jazz-tv',        name: 'Jazz TV',            category: 'Music',         color: '#1c1917', accent: '#d97706',  description: 'Live jazz performance' },
  { id: 'cmt',            name: 'CMT',                category: 'Music',         color: '#14532d', accent: '#4ade80',  logo: `${L}/united-states/cmt.png`,           description: 'Country music television' },
  { id: 'fuse',           name: 'Fuse',               category: 'Music',         color: '#7f1d1d', accent: '#f87171',  logo: `${L}/united-states/fuse.png`,          description: 'Music & culture' },
  // Science / Education
  { id: 'nasa-tv',        name: 'NASA TV',            category: 'Science',       color: '#0b3d91', accent: '#60a5fa',  logo: `${L}/united-states/nasa-tv.png`,       stream: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8', description: 'Space agency live' },
  { id: 'science',        name: 'Science Channel',    category: 'Science',       color: '#1e3a5f', accent: '#38bdf8',  logo: `${L}/united-states/science-channel.png`, description: 'How things work' },
  { id: 'smithsonian',    name: 'Smithsonian',        category: 'Science',       color: '#312e81', accent: '#818cf8',  logo: `${L}/united-states/smithsonian-channel.png`, description: 'Smithsonian Channel' },
  { id: 'curiosity',      name: 'Curiosity Stream',   category: 'Science',       color: '#164e63', accent: '#22d3ee',  description: 'Factual documentaries' },
  { id: 'ted-talks',      name: 'TED Talks',          category: 'Education',     color: '#e62b1e', accent: '#f87171',  description: 'Ideas worth spreading' },
  { id: 'pbs',            name: 'PBS',                category: 'Education',     color: '#1e3a5f', accent: '#3b82f6',  logo: `${L}/united-states/pbs.png`,           description: 'Public Broadcasting' },
  // Business
  { id: 'bloomberg',      name: 'Bloomberg TV',       category: 'Business',      color: '#1a1a1a', accent: '#f97316',  logo: `${L}/international/bloomberg-television.png`, stream: 'https://bloombergtv-bloombergtvus-1-us.samsung.wurl.tv/manifest/playlist.m3u8', description: 'Global financial news' },
  { id: 'cnbc',           name: 'CNBC',               category: 'Business',      color: '#003087', accent: '#60a5fa',  logo: `${L}/united-states/cnbc.png`,          description: 'Business & markets' },
  { id: 'fox-business',   name: 'Fox Business',       category: 'Business',      color: '#002244', accent: '#3b82f6',  logo: `${L}/united-states/fox-business-network.png`, description: 'Business news network' },
  { id: 'cnn-business',   name: 'CNN Business',       category: 'Business',      color: '#cc0000', accent: '#ff4444',  logo: `${L}/united-states/cnn.png`,           description: 'Business from CNN' },
  // Kids
  { id: 'cartoon-net',    name: 'Cartoon Network',    category: 'Kids',          color: '#0055a5', accent: '#38bdf8',  logo: `${L}/united-states/cartoon-network.png`, description: 'Animation & cartoons' },
  { id: 'disney-ch',      name: 'Disney Channel',     category: 'Kids',          color: '#003087', accent: '#60a5fa',  logo: `${L}/united-states/disney-channel.png`, description: 'Family entertainment' },
  { id: 'nickelodeon',    name: 'Nickelodeon',        category: 'Kids',          color: '#ff6600', accent: '#fb923c',  logo: `${L}/united-states/nickelodeon.png`,   description: 'Kids programming' },
  { id: 'disney-jr',      name: 'Disney Junior',      category: 'Kids',          color: '#1d4ed8', accent: '#60a5fa',  logo: `${L}/united-states/disney-junior.png`, description: 'Preschool entertainment' },
  { id: 'boomerang',      name: 'Boomerang',          category: 'Kids',          color: '#7c2d12', accent: '#fb923c',  logo: `${L}/united-states/boomerang.png`,     description: 'Classic cartoons' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Movies catalog                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MOVIES: Movie[] = [
  { id: 'm1',  title: 'Metropolis',           year: 1927, genre: 'Sci-Fi',    rating: 'NR',   runtime: '153 min', description: 'Fritz Lang\'s landmark silent science-fiction film set in a dystopian future city.',         color: '#1a1a2e', accent: '#818cf8', stream: 'https://archive.org/download/Metropolis1927/Metropolis%281927%29.mp4', featured: true },
  { id: 'm2',  title: 'Nosferatu',            year: 1922, genre: 'Horror',    rating: 'NR',   runtime: '94 min',  description: 'The original vampire horror film — Count Orlok terrorizes a Transylvanian town.',            color: '#1c0a0a', accent: '#ef4444', stream: 'https://archive.org/download/Nosferatu_the_Vampyre/Nosferatu.mp4' },
  { id: 'm3',  title: 'Night of the Living Dead', year: 1968, genre: 'Horror', rating: 'NR', runtime: '96 min', description: 'George Romero\'s seminal zombie film that launched a genre.',                               color: '#1a1a1a', accent: '#6b7280', stream: 'https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4' },
  { id: 'm4',  title: 'The General',          year: 1926, genre: 'Comedy',    rating: 'NR',   runtime: '75 min',  description: 'Buster Keaton\'s masterpiece of silent comedy featuring incredible locomotive stunts.',       color: '#1c1917', accent: '#f59e0b' },
  { id: 'm5',  title: 'City Lights',          year: 1931, genre: 'Comedy',    rating: 'NR',   runtime: '87 min',  description: 'Charlie Chaplin as the Tramp falls in love with a blind flower girl.',                       color: '#1a1a1a', accent: '#fbbf24' },
  { id: 'm6',  title: 'Sherlock Jr.',         year: 1924, genre: 'Comedy',    rating: 'NR',   runtime: '45 min',  description: 'A projectionist dreams himself into the movie he\'s showing in this Keaton classic.',        color: '#0f172a', accent: '#60a5fa' },
  { id: 'm7',  title: 'His Girl Friday',      year: 1940, genre: 'Comedy',    rating: 'NR',   runtime: '92 min',  description: 'Fast-talking screwball comedy about a newspaper editor and his star reporter ex-wife.',       color: '#1c1917', accent: '#f97316' },
  { id: 'm8',  title: 'The Maltese Falcon',   year: 1941, genre: 'Noir',      rating: 'NR',   runtime: '100 min', description: 'Humphrey Bogart as private eye Sam Spade in the definitive hard-boiled detective story.',     color: '#1a1a2e', accent: '#a1a1aa' },
  { id: 'm9',  title: 'Double Indemnity',     year: 1944, genre: 'Noir',      rating: 'NR',   runtime: '107 min', description: 'Billy Wilder\'s noir masterpiece about insurance fraud and murder.',                        color: '#0f1a2e', accent: '#f59e0b' },
  { id: 'm10', title: 'Carnival of Souls',    year: 1962, genre: 'Horror',    rating: 'NR',   runtime: '78 min',  description: 'Eerie independent horror film about a woman haunted after surviving a car accident.',         color: '#0f0f0f', accent: '#9ca3af' },
  { id: 'm11', title: 'Pot o\' Gold',         year: 1941, genre: 'Musical',   rating: 'NR',   runtime: '86 min',  description: 'James Stewart stars in this bright Depression-era musical comedy.',                        color: '#1c0a00', accent: '#fbbf24' },
  { id: 'm12', title: 'Dr. Jekyll & Mr. Hyde',year: 1920, genre: 'Horror',    rating: 'NR',   runtime: '63 min',  description: 'John Barrymore in the iconic silent horror adaptation of Robert Louis Stevenson.',           color: '#1a0a1a', accent: '#3b82f6' },
  { id: 'm13', title: 'The Lost World',       year: 1925, genre: 'Adventure', rating: 'NR',   runtime: '93 min',  description: 'Pioneering special effects bring dinosaurs to life in Arthur Conan Doyle\'s adventure.',     color: '#0a2010', accent: '#4ade80' },
  { id: 'm14', title: 'Phantom of the Opera', year: 1925, genre: 'Horror',    rating: 'NR',   runtime: '107 min', description: 'Lon Chaney\'s unforgettable performance as the disfigured phantom beneath the Paris opera.', color: '#1a0a0a', accent: '#ef4444' },
  { id: 'm15', title: 'The Kid',              year: 1921, genre: 'Drama',     rating: 'NR',   runtime: '68 min',  description: 'Charlie Chaplin\'s first feature film — the Tramp raises an abandoned child.',              color: '#1c1917', accent: '#d97706' },
  { id: 'm16', title: 'Reefer Madness',       year: 1936, genre: 'Drama',     rating: 'NR',   runtime: '67 min',  description: 'The cult classic cautionary tale that became one of the most famous bad movies of all time.', color: '#1a2e1a', accent: '#22c55e' },
  { id: 'm17', title: 'Plan 9 from Outer Space', year: 1957, genre: 'Sci-Fi', rating: 'NR',  runtime: '79 min',  description: 'Ed Wood\'s infamously campy alien-invasion film considered the "so bad it\'s good" masterwork.', color: '#0a0a2e', accent: '#818cf8', stream: 'https://archive.org/download/plan_9_from_outer_space/plan_9_from_outer_space_512kb.mp4' },
  { id: 'm18', title: 'The Birth of a Nation', year: 1915, genre: 'Drama',    rating: 'NR',   runtime: '195 min', description: 'D.W. Griffith\'s landmark but deeply controversial epic — important for film technique.',       color: '#1c1917', accent: '#a1a1aa' },
  { id: 'm19', title: 'The Mark of Zorro',    year: 1920, genre: 'Adventure', rating: 'NR',   runtime: '93 min',  description: 'Douglas Fairbanks as the masked hero fighting injustice in Spanish California.',              color: '#1a0a00', accent: '#f59e0b' },
  { id: 'm20', title: 'The Cabinet of Dr. Caligari', year: 1920, genre: 'Horror', rating: 'NR', runtime: '77 min', description: 'German expressionist masterpiece — twisted sets and an unhinged doctor with a somnambulist.', color: '#1a1a1a', accent: '#a78bfa' },
  { id: 'm21', title: 'Speedy',               year: 1928, genre: 'Comedy',    rating: 'NR',   runtime: '86 min',  description: 'Harold Lloyd races to save NYC\'s last horse-drawn streetcar in this joyful comedy.',         color: '#0f1a2e', accent: '#38bdf8' },
  { id: 'm22', title: 'The Invisible Man',    year: 1933, genre: 'Sci-Fi',    rating: 'NR',   runtime: '71 min',  description: 'Claude Rains goes invisible and mad in James Whale\'s Universal monster classic.',            color: '#0f0f0f', accent: '#e2e8f0' },
  { id: 'm23', title: 'Sunrise',              year: 1927, genre: 'Romance',   rating: 'NR',   runtime: '94 min',  description: 'F.W. Murnau\'s poetic silent masterpiece about love, temptation, and redemption.',           color: '#1a1210', accent: '#f59e0b' },
  { id: 'm24', title: 'Steamboat Bill Jr.',   year: 1928, genre: 'Comedy',    rating: 'NR',   runtime: '71 min',  description: 'Buster Keaton\'s greatest stunts including the legendary falling house façade.',              color: '#0f1a0f', accent: '#4ade80' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Reels feed                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const REELS: Reel[] = [
  { id: 'r1',  title: "NASA's Webb Telescope: First Images Explained",        creator: 'NASA Official',     category: 'Science',    color: '#0b3d91', accent: '#60a5fa', views: '12.4M', duration: '8:32' },
  { id: 'r2',  title: 'How to Start a 6-Figure Business in 90 Days',          creator: 'Melli Insights',    category: 'Business',   color: '#7c2d12', accent: '#f97316', views: '4.1M',  duration: '14:22' },
  { id: 'r3',  title: '10 AI Tools That Replace Entire Teams',                 creator: 'Tech Decoded',      category: 'Tech',       color: '#1e1b4b', accent: '#818cf8', views: '8.7M',  duration: '11:05' },
  { id: 'r4',  title: 'SpaceX Starship Launch — Full Coverage',               creator: 'SpaceX Live',       category: 'Science',    color: '#0a0a1e', accent: '#f59e0b', views: '22.1M', duration: '3:14:00' },
  { id: 'r5',  title: 'The Credit Repair Blueprint — Step by Step',           creator: 'Credit Masters',    category: 'Finance',    color: '#0f2d1a', accent: '#4ade80', views: '3.2M',  duration: '28:44' },
  { id: 'r6',  title: 'Top 10 Market Movers This Week',                       creator: 'Bloomberg Clips',   category: 'Business',   color: '#1a1a1a', accent: '#f97316', views: '1.8M',  duration: '6:18' },
  { id: 'r7',  title: 'Build Your First AI Agent in 20 Minutes',              creator: 'Dev Universe',      category: 'Tech',       color: '#0f172a', accent: '#38bdf8', views: '5.4M',  duration: '19:56' },
  { id: 'r8',  title: 'Real Estate Wholesale: Finding Your First Deal',       creator: 'Investor Academy',  category: 'Finance',    color: '#2d1b4e', accent: '#a78bfa', views: '2.9M',  duration: '22:10' },
  { id: 'r9',  title: 'Lofi Study & Work — 4 Hours Deep Focus',              creator: 'Chill Frequencies',  category: 'Music',      color: '#1e0a2e', accent: '#a78bfa', views: '41.2M', duration: '4:00:00' },
  { id: 'r10', title: 'How Credit Scores Are Calculated — Full Breakdown',    creator: 'Melli Finance',     category: 'Finance',    color: '#0a2010', accent: '#22c55e', views: '6.1M',  duration: '17:33' },
  { id: 'r11', title: 'ChatGPT Business Prompts That Print Money',            creator: 'AI Growth Hacks',   category: 'Tech',       color: '#0f1a0f', accent: '#4ade80', views: '9.8M',  duration: '12:47' },
  { id: 'r12', title: 'Negotiation Tactics That Work Every Time',             creator: 'Sales Mastery',     category: 'Business',   color: '#3b0f0f', accent: '#f87171', views: '7.3M',  duration: '16:20' },
  { id: 'r13', title: 'Live DJ Set — Miami Summer Mix 2025',                  creator: 'Club Universe',     category: 'Music',      color: '#1a0a2e', accent: '#c4b5fd', views: '892K',  duration: '1:24:16' },
  { id: 'r14', title: 'Build a Full SaaS App in One Weekend',                 creator: 'Code with Me',      category: 'Tech',       color: '#0f2d2d', accent: '#2dd4bf', views: '4.5M',  duration: '4:12:30' },
  { id: 'r15', title: 'The Science of Getting Rich — Napoleon Hill Deep Dive', creator: 'Mindset Lab',      category: 'Finance',    color: '#2d2200', accent: '#fcd34d', views: '11.2M', duration: '34:55' },
  { id: 'r16', title: 'Martial Arts Compilation — UFC Best Knockouts 2025',   creator: 'Fight Hub',         category: 'Sports',     color: '#7f1d1d', accent: '#ef4444', views: '18.7M', duration: '45:12' },
  { id: 'r17', title: 'How to Build a 7-Figure Coaching Business',            creator: 'Melli Insights',    category: 'Business',   color: '#1a3a5c', accent: '#3b82f6', views: '3.4M',  duration: '21:08' },
  { id: 'r18', title: 'Behind the Scenes: How Netflix Makes Content',         creator: 'Industry Insider',  category: 'Entertainment', color: '#7c2d12', accent: '#f97316', views: '6.2M', duration: '18:44' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  M3U8 playlist parser                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function parseM3U(text: string): Channel[] {
  const lines = text.split('\n').map((l) => l.trim());
  const channels: Channel[] = [];
  let meta: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXTINF')) {
      // Parse: #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",Name
      const nameMatch = line.match(/,(.+)$/);
      const nameAttr  = line.match(/tvg-name="([^"]*)"/);
      const logoAttr  = line.match(/tvg-logo="([^"]*)"/);
      const groupAttr = line.match(/group-title="([^"]*)"/);
      const name = nameAttr?.[1] || nameMatch?.[1] || 'Channel';
      meta = {
        id: `m3u_${i}`,
        name,
        logo: logoAttr?.[1] || undefined,
        category: groupAttr?.[1] || 'Imported',
        color: '#1a1a2e',
        accent: '#818cf8',
        description: groupAttr?.[1] || '',
      };
    } else if (line && !line.startsWith('#') && meta) {
      channels.push({ ...meta, stream: line } as Channel);
      meta = null;
    }
  }
  return channels;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tabs                                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const TABS = ['Live TV', 'My Playlists', 'Movies', 'Reels', 'Sports', 'News', 'Music', 'Business', 'Kids'] as const;
type Tab = typeof TABS[number];

const CHANNEL_CATEGORIES: Record<string, Tab> = {
  News: 'News', Sports: 'Sports', Business: 'Business',
  Music: 'Music', Kids: 'Kids',
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HLS helpers                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

async function attachHls(video: HTMLVideoElement, url: string): Promise<void> {
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.play().catch(() => {});
    return;
  }
  const { default: Hls } = await import('hls.js');
  if (Hls.isSupported()) {
    const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
    (video as any).__hls = hls;
  }
}

function destroyHls(video: HTMLVideoElement | null): void {
  if (!video) return;
  const hls = (video as any).__hls;
  if (hls) { hls.destroy(); delete (video as any).__hls; }
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  LiveBadge                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest bg-red-600 text-white">
      <span className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: 'tvpulse 1.4s cubic-bezier(0.4,0,0.6,1) infinite' }} />
      LIVE
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ChannelCard                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ChannelCard({ channel, onClick, size = 'sm' }: { channel: Channel; onClick: (ch: Channel) => void; size?: 'sm' | 'md' | 'lg' }) {
  const [hovered, setHovered] = useState(false);
  const accent = channel.accent ?? channel.color;
  const w = size === 'lg' ? 'w-56' : size === 'md' ? 'w-48' : 'w-40';
  const h = size === 'lg' ? 'h-32' : size === 'md' ? 'h-28' : 'h-24';

  return (
    <button
      onClick={() => onClick(channel)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`${w} ${h} rounded-xl overflow-hidden relative cursor-pointer text-left focus:outline-none flex-shrink-0`}
      style={{
        background: `linear-gradient(135deg, ${channel.color} 0%, ${accent}99 100%)`,
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: hovered ? `0 0 0 2px ${accent}, 0 8px 24px ${accent}44` : '0 2px 12px rgba(0,0,0,0.4)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
    >
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, rgba(255,255,255,0.08) 0%, transparent 55%), linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
      <div className="absolute top-2 right-2">
        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>{channel.category}</span>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {channel.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-12 h-12 object-contain drop-shadow-lg"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('hidden'); }}
          />
        ) : null}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-xs ${channel.logo ? 'hidden' : ''}`} style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}>{initials(channel.name)}</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5">
        <p className="text-white text-[11px] font-semibold leading-tight truncate drop-shadow">{channel.name}</p>
        <div className="mt-0.5"><LiveBadge /></div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MovieCard                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MovieCard({ movie, onClick }: { movie: Movie; onClick: (m: Movie) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onClick(movie)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-40 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer text-left focus:outline-none"
      style={{
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.18s ease',
        boxShadow: hovered ? `0 8px 24px ${movie.accent}44` : '0 2px 12px rgba(0,0,0,0.4)',
      }}
    >
      {/* Poster area */}
      <div
        className="w-full rounded-xl overflow-hidden relative"
        style={{ aspectRatio: '2/3', background: `linear-gradient(160deg, ${movie.color} 0%, #000 100%)` }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.8) 100%)' }} />
        <div className="absolute top-2 right-2">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: movie.accent, color: '#000' }}>{movie.genre}</span>
        </div>
        <div className="absolute bottom-3 left-2 right-2">
          <p className="text-white font-bold text-xs leading-tight">{movie.title}</p>
          <p className="text-[hsl(var(--muted-foreground))] text-[10px] mt-0.5">{movie.year} · {movie.rating} · {movie.runtime}</p>
        </div>
        {/* Fake "film grain" decoration */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ReelCard                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ReelCard({ reel, onClick }: { reel: Reel; onClick: (r: Reel) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onClick(reel)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-64 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer text-left focus:outline-none"
      style={{
        transform: hovered ? 'scale(1.03)' : 'scale(1)',
        transition: 'transform 0.18s ease',
        boxShadow: hovered ? `0 8px 24px ${reel.accent}44` : '0 2px 12px rgba(0,0,0,0.4)',
      }}
    >
      {/* Thumbnail */}
      <div className="w-full rounded-t-xl overflow-hidden relative" style={{ aspectRatio: '16/9', background: `linear-gradient(135deg, ${reel.color} 0%, ${reel.accent}33 100%)` }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
        <div className="absolute bottom-2 right-2">
          <span className="text-[9px] font-mono bg-[hsl(var(--foreground))]/30 text-white px-1.5 py-0.5 rounded">{reel.duration}</span>
        </div>
        <div className="absolute top-2 left-2">
          <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: reel.accent, color: '#000' }}>{reel.category}</span>
        </div>
      </div>
      {/* Info */}
      <div className="bg-[hsl(var(--card))] rounded-b-xl px-3 py-2">
        <p className="text-white text-xs font-medium leading-tight line-clamp-2">{reel.title}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[hsl(var(--muted-foreground))] text-[10px]">{reel.creator}</span>
          <span className="text-[hsl(var(--muted-foreground))] text-[10px]">{reel.views} views</span>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HorizontalRow — Netflix-style scrolling row                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function HorizontalRow<T>({ label, items, renderItem, accent }: {
  label: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  accent?: string;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'l' | 'r') => {
    if (rowRef.current) rowRef.current.scrollBy({ left: dir === 'r' ? 320 : -320, behavior: 'smooth' });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 mb-2">
        <div className="flex items-center gap-2">
          {accent && <div className="w-1 h-4 rounded-full" style={{ background: accent }} />}
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">{label}</h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => scroll('l')} className="w-6 h-6 rounded flex items-center justify-center bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]">
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M7 2L3 5L7 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
          </button>
          <button onClick={() => scroll('r')} className="w-6 h-6 rounded flex items-center justify-center bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]">
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>
      <div ref={rowRef} className="flex gap-3 px-4 overflow-x-auto scrollbar-none pb-1" style={{ scrollbarWidth: 'none' }}>
        {items.map((item, i) => <div key={i} className="flex-shrink-0">{renderItem(item)}</div>)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  VideoOverlay                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface PlayItem {
  name: string;
  category: string;
  color: string;
  accent: string;
  stream?: string;
  description?: string;
  meta?: string;
}

function VideoOverlay({ item, onClose }: { item: PlayItem; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isHls = item.stream?.includes('.m3u8') ?? false;
  const isYoutube = item.stream?.includes('youtube.com') ?? false;
  const isMp4 = item.stream?.endsWith('.mp4') ?? false;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !item.stream) return;
    setLoading(true);
    setError(null);
    if (isYoutube) { setLoading(false); return; }
    const onCanPlay = () => setLoading(false);
    const onError = () => { setLoading(false); setError('Stream unavailable — may be geo-restricted or offline.'); };
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);
    if (isHls) {
      attachHls(video, item.stream!).then(() => {}).catch(onError);
    } else {
      video.src = item.stream!;
      video.play().catch(() => {});
    }
    return () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      destroyHls(video);
      video.pause();
      video.src = '';
    };
  }, [item.stream, isHls, isYoutube, isMp4]);

  const { accent } = item;
  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{ background: '#000' }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: '#ef4444', animation: 'tvpulse 1.4s cubic-bezier(0.4,0,0.6,1) infinite' }} />
          <span className="text-white font-semibold text-sm">{item.name}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ background: `${accent}99` }}>{item.category}</span>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {isYoutube ? (
          <div className="flex flex-col items-center gap-3 text-center px-8">
            <span style={{ fontSize: 48 }}>📻</span>
            <p className="text-white font-semibold text-base">{item.name}</p>
            <p className="text-[hsl(var(--muted-foreground))] text-sm max-w-xs">This stream plays on YouTube.</p>
            <a href={item.stream} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: accent }}>Open on YouTube</a>
          </div>
        ) : !item.stream ? (
          <div className="flex flex-col items-center gap-4 text-center px-10">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white" style={{ background: `linear-gradient(135deg, ${item.color}, ${accent})` }}>{initials(item.name)}</div>
            <div>
              <p className="text-white font-bold text-lg">{item.name}</p>
              {item.meta && <p className="text-[hsl(var(--muted-foreground))] text-xs mt-0.5">{item.meta}</p>}
              {item.description && <p className="text-[hsl(var(--muted-foreground))] text-sm mt-2 max-w-sm">{item.description}</p>}
            </div>
            <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-xs border border-[hsl(var(--border))] rounded-lg px-4 py-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              Stream coming soon — provider integration in progress
            </div>
          </div>
        ) : (
          <>
            {loading && <div className="absolute inset-0 flex items-center justify-center z-10"><div className="w-10 h-10 rounded-full border-2 border-t-transparent" style={{ borderColor: `${accent} transparent transparent transparent`, animation: 'tvspin 0.8s linear infinite' }} /></div>}
            {error && <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-2"><p className="text-red-400 text-sm font-medium">Stream Unavailable</p><p className="text-[hsl(var(--muted-foreground))] text-xs max-w-xs text-center">{error}</p></div>}
            <video ref={videoRef} className="w-full h-full object-contain" playsInline autoPlay muted={muted} controls={false} style={{ opacity: loading || error ? 0 : 1, transition: 'opacity 0.3s' }} />
          </>
        )}
      </div>

      {/* Bottom bar */}
      {!isYoutube && item.stream && (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-xs" style={{ background: `${item.color}cc` }}>{initials(item.name)}</div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{item.name}</p>
              <p className="text-[hsl(var(--muted-foreground))] text-xs">{item.category}</p>
            </div>
          </div>
          <button onClick={() => { if (videoRef.current) { videoRef.current.muted = !muted; setMuted(m => !m); } }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
            {muted
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
            }
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Featured Hero Banner                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FeaturedHero({ channels, onSelect }: { channels: Channel[]; onSelect: (ch: Channel) => void }) {
  const [idx, setIdx] = useState(0);
  const channel = channels[idx % channels.length];
  const accent = channel?.accent ?? channel?.color ?? '#ef4444';

  useEffect(() => {
    const t = setInterval(() => setIdx(i => i + 1), 8000);
    return () => clearInterval(t);
  }, []);

  if (!channel) return null;
  return (
    <div className="relative mx-4 mb-6 rounded-2xl overflow-hidden cursor-pointer h-44" style={{ background: `linear-gradient(135deg, ${channel.color} 0%, ${accent}88 100%)`, boxShadow: `0 0 40px ${accent}33` }} onClick={() => onSelect(channel)}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, rgba(255,255,255,0.06) 0%, transparent 60%), linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
      {/* Category */}
      <div className="absolute top-4 right-4">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>{channel.category}</span>
      </div>
      {/* Dots */}
      <div className="absolute top-4 left-4 flex gap-1.5">
        {channels.slice(0, 5).map((_, i) => (
          <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }} className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: i === idx % channels.length ? '#fff' : 'rgba(255,255,255,0.3)', transform: i === idx % channels.length ? 'scale(1.4)' : 'scale(1)' }} />
        ))}
      </div>
      {/* Content */}
      <div className="absolute bottom-4 left-5 flex flex-col gap-2">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>{initials(channel.name)}</div>
        <div>
          <p className="text-white font-bold text-xl leading-tight drop-shadow">{channel.name}</p>
          {channel.description && <p className="text-[hsl(var(--foreground))] text-xs mt-0.5">{channel.description}</p>}
          <div className="mt-1.5 flex items-center gap-2">
            <LiveBadge />
            <span className="text-[hsl(var(--muted-foreground))] text-[10px]">Click to watch</span>
          </div>
        </div>
      </div>
      {/* Play button */}
      <div className="absolute right-6 bottom-6 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
        <span style={{ display: 'inline-block', width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '12px solid white', marginLeft: '3px' }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab content views                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function LiveTVView({ onSelectChannel }: { onSelectChannel: (ch: Channel) => void }) {
  const featured = useMemo(() => ALL_CHANNELS.filter(c => c.stream), []);
  const byCategory = useMemo(() => {
    const cats: Record<string, Channel[]> = {};
    ALL_CHANNELS.forEach(ch => {
      if (!cats[ch.category]) cats[ch.category] = [];
      cats[ch.category].push(ch);
    });
    return cats;
  }, []);

  return (
    <div className="flex-1 overflow-y-auto py-4">
      <FeaturedHero channels={featured.slice(0, 5)} onSelect={onSelectChannel} />
      {Object.entries(byCategory).map(([cat, chs]) => (
        <HorizontalRow
          key={cat}
          label={cat}
          items={chs}
          accent={chs[0]?.accent}
          renderItem={(ch) => <ChannelCard channel={ch} onClick={onSelectChannel} size="md" />}
        />
      ))}
    </div>
  );
}

function MoviesView({ onSelectMovie }: { onSelectMovie: (m: Movie) => void }) {
  const featured = MOVIES.find(m => m.featured)!;
  const byGenre = useMemo(() => {
    const cats: Record<string, Movie[]> = {};
    MOVIES.forEach(m => {
      if (!cats[m.genre]) cats[m.genre] = [];
      cats[m.genre].push(m);
    });
    return cats;
  }, []);

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {/* Featured movie hero */}
      {featured && (
        <div className="mx-4 mb-6 rounded-2xl overflow-hidden cursor-pointer relative h-48" style={{ background: `linear-gradient(135deg, ${featured.color} 0%, ${featured.accent}55 100%)` }} onClick={() => onSelectMovie(featured)}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, transparent 60%), linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
          <div className="absolute top-4 right-4"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white" style={{ background: featured.accent, color: '#000' }}>{featured.genre}</span></div>
          <div className="absolute bottom-5 left-5 max-w-xs">
            <p className="text-white font-black text-2xl leading-tight">{featured.title}</p>
            <p className="text-[hsl(var(--foreground))] text-xs mt-0.5">{featured.year} · {featured.rating} · {featured.runtime}</p>
            <p className="text-[hsl(var(--muted-foreground))] text-xs mt-2 line-clamp-2">{featured.description}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-black flex items-center gap-1" style={{ background: featured.accent }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                Watch Free
              </span>
            </div>
          </div>
        </div>
      )}
      {Object.entries(byGenre).map(([genre, movies]) => (
        <HorizontalRow
          key={genre}
          label={genre}
          items={movies}
          accent={movies[0]?.accent}
          renderItem={(m) => <MovieCard movie={m} onClick={onSelectMovie} />}
        />
      ))}
    </div>
  );
}

function ReelsView({ onSelectReel }: { onSelectReel: (r: Reel) => void }) {
  const byCategory = useMemo(() => {
    const cats: Record<string, Reel[]> = {};
    REELS.forEach(r => {
      if (!cats[r.category]) cats[r.category] = [];
      cats[r.category].push(r);
    });
    return cats;
  }, []);

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {/* All reels row */}
      <HorizontalRow
        label="Trending Now"
        items={[...REELS].sort(() => Math.random() - 0.5).slice(0, 10)}
        accent="#ef4444"
        renderItem={(r) => <ReelCard reel={r} onClick={onSelectReel} />}
      />
      {Object.entries(byCategory).map(([cat, reels]) => (
        <HorizontalRow
          key={cat}
          label={cat}
          items={reels}
          accent={reels[0]?.accent}
          renderItem={(r) => <ReelCard reel={r} onClick={onSelectReel} />}
        />
      ))}
    </div>
  );
}

function FilteredChannelView({ category, onSelectChannel }: { category: string; onSelectChannel: (ch: Channel) => void }) {
  const filtered = ALL_CHANNELS.filter(c => c.category === category);
  const featured = filtered.slice(0, 3).filter(c => !!c.stream);
  const rest = filtered;

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {featured.length > 0 && (
        <FeaturedHero channels={featured} onSelect={onSelectChannel} />
      )}
      <HorizontalRow
        label={`All ${category}`}
        items={rest}
        renderItem={(ch) => <ChannelCard channel={ch} onClick={onSelectChannel} size="lg" />}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main IPTV Panel                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Third-party disclaimer — shown once, stored in localStorage               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StreamingDisclaimer({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[hsl(var(--foreground))]/30 backdrop-blur-sm p-4">
      <div className="relative max-w-md w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-2xl">
        {/* Red accent top bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #dc2626, #f97316)' }} />

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Third-Party Streaming Notice</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Please read before continuing</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-[hsl(var(--foreground))] mb-5">
            <p>
              Memelli Live TV is a <strong className="text-white">playlist reader and media player</strong>. It does not host, store, or distribute any video content.
            </p>
            <p>
              Streams featured here are sourced from <strong className="text-white">publicly available third-party services</strong> including BeTV, TeaTV, and community IPTV providers. Content is attributed to its original source.
            </p>
            <p>
              By continuing, you acknowledge that:
            </p>
            <ul className="list-none space-y-1.5 pl-2">
              {[
                'You are responsible for ensuring you have the right to access any stream in your region',
                'Memelli is the player only — the content provider is solely responsible for their streams',
                'Some streams may be geo-restricted or require a valid subscription to the source service',
                'You accept full responsibility for your use of third-party streams',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onAccept}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
            >
              I Understand — Continue
            </button>
          </div>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center mt-3">
            This notice is shown once. You can review our Terms of Service at any time.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Suggested playlist sources — pre-loaded for one-click import              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const SUGGESTED_SOURCES = [
  {
    id: 'iptv-org-all',
    name: 'IPTV-Org Global',
    description: '8,000+ free public broadcast channels worldwide',
    count: '8,000+',
    tags: ['Free', 'Public'],
    color: '#1a3a5c',
    accent: '#3b82f6',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    attribution: 'iptv-org',
  },
  {
    id: 'iptv-org-sports',
    name: 'Sports Channels',
    description: 'Live sports from around the world — free public feeds',
    count: '200+',
    tags: ['Sports', 'Live'],
    color: '#1a0f00',
    accent: '#f97316',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    attribution: 'iptv-org',
  },
  {
    id: 'iptv-org-news',
    name: 'News Networks',
    description: 'International news channels — CNN, BBC, Al Jazeera and more',
    count: '300+',
    tags: ['News', '24/7'],
    color: '#0a2010',
    accent: '#22c55e',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    attribution: 'iptv-org',
  },
  {
    id: 'iptv-org-movies',
    name: 'Movies & Entertainment',
    description: 'Free movie channels and entertainment streams',
    count: '500+',
    tags: ['Movies', 'Entertainment'],
    color: '#2d1b4e',
    accent: '#a78bfa',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    attribution: 'iptv-org',
  },
  {
    id: 'iptv-org-music',
    name: 'Music TV',
    description: 'Music video channels, radio TV, and live concerts',
    count: '150+',
    tags: ['Music', 'Radio'],
    color: '#1a0a2e',
    accent: '#c4b5fd',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    attribution: 'iptv-org',
  },
  {
    id: 'iptv-org-kids',
    name: 'Kids & Family',
    description: 'Children\'s programming and family entertainment',
    count: '120+',
    tags: ['Kids', 'Family'],
    color: '#0a1a3a',
    accent: '#60a5fa',
    url: 'https://iptv-org.github.io/iptv/categories/kids.m3u',
    attribution: 'iptv-org',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MyPlaylistsView — featured sources + M3U8 import                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SavedPlaylist {
  id: string;
  name: string;
  url: string;
  channels: Channel[];
  addedAt: number;
  attribution?: string;
}

function MyPlaylistsView({ onSelectChannel }: { onSelectChannel: (ch: Channel) => void }) {
  const [playlists, setPlaylists] = useState<SavedPlaylist[]>(() => {
    try { return JSON.parse(localStorage.getItem('memelli_iptv_playlists') || '[]'); } catch { return []; }
  });
  const [urlInput, setUrlInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState<string | null>(null); // id of source being loaded
  const [error, setError] = useState('');
  const [activePlaylist, setActivePlaylist] = useState<SavedPlaylist | null>(null);
  const [search, setSearch] = useState('');

  function save(updated: SavedPlaylist[]) {
    setPlaylists(updated);
    localStorage.setItem('memelli_iptv_playlists', JSON.stringify(updated));
  }

  async function importUrl(url: string, name: string, attribution?: string) {
    const loadId = url;
    setLoading(loadId);
    setError('');
    try {
      const proxyUrl = `/api/iptv/proxy?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text.includes('#EXTM3U')) throw new Error('Not a valid M3U playlist');
      const channels = parseM3U(text);
      if (!channels.length) throw new Error('No channels found');
      const existing = playlists.find((p) => p.url === url);
      if (existing) { setActivePlaylist(existing); return; }
      const pl: SavedPlaylist = {
        id: `pl_${Date.now()}`,
        name,
        url,
        channels,
        addedAt: Date.now(),
        attribution,
      };
      const updated = [...playlists, pl];
      save(updated);
      setActivePlaylist(pl);
      setUrlInput('');
      setNameInput('');
    } catch (e: any) {
      setError(e.message || 'Failed to load playlist');
    } finally {
      setLoading(null);
    }
  }

  const displayChannels = useMemo(() => {
    const src = activePlaylist?.channels ?? playlists.flatMap((p) => p.channels);
    if (!search.trim()) return src;
    const q = search.toLowerCase();
    return src.filter((c) => c.name.toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q));
  }, [activePlaylist, playlists, search]);

  const importedIds = new Set(playlists.map((p) => p.url));

  return (
    <div className="flex-1 overflow-y-auto py-4">

      {/* ── Featured sources ─────────────────────────────────────── */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Featured Sources</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">One-click import</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {SUGGESTED_SOURCES.map((src) => {
            const imported = importedIds.has(src.url);
            const isLoading = loading === src.url;
            return (
              <div
                key={src.id}
                className="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group"
                style={{
                  background: `linear-gradient(135deg, ${src.color} 0%, rgba(10,10,10,0.8) 100%)`,
                  borderColor: imported ? `${src.accent}50` : 'rgba(39,39,42,0.6)',
                  boxShadow: imported ? `0 0 20px ${src.accent}15` : 'none',
                }}
                onClick={() => importUrl(src.url, src.name, src.attribution)}
              >
                {/* Color dot */}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/10"
                  style={{ background: `${src.accent}20` }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: src.accent }}>
                    <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-white truncate">{src.name}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: src.accent, color: '#000' }}>
                      {src.count}
                    </span>
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-tight">{src.description}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                    via <span className="text-[hsl(var(--muted-foreground))]">{src.attribution}</span>
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {isLoading ? (
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: src.accent, borderTopColor: 'transparent' }} />
                  ) : imported ? (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium" style={{ background: `${src.accent}20`, color: src.accent }}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      View
                    </div>
                  ) : (
                    <div className="px-2 py-1 rounded-lg text-[10px] font-medium border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] group-hover:border-[hsl(var(--border))] group-hover:text-[hsl(var(--foreground))] transition-all">
                      Import
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      {/* ── Custom URL import ─────────────────────────────────────── */}
      <div className="px-4 mb-5">
        <p className="text-xs uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">Custom Playlist URL</p>
        <div className="flex flex-col gap-2 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Playlist name (optional)"
            className="w-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:border-red-500/50"
          />
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && importUrl(urlInput, nameInput || 'My Playlist')}
              placeholder="https://example.com/playlist.m3u8"
              className="flex-1 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:border-red-500/50"
            />
            <button
              onClick={() => importUrl(urlInput, nameInput || 'My Playlist')}
              disabled={!!loading || !urlInput.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff' }}
            >
              {loading === urlInput ? '…' : 'Import'}
            </button>
          </div>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Paste any M3U/M3U8 playlist URL — BeTV, TeaTV, your own IPTV service, etc.</p>
        </div>
      </div>

      {/* ── Saved playlists + channel grid ───────────────────────── */}
      {playlists.length > 0 && (
        <>
          <div className="px-4 mb-3">
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setActivePlaylist(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${!activePlaylist ? 'bg-red-600/20 border-red-500/40 text-red-300' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border))]'}`}
              >
                All ({playlists.reduce((n, p) => n + p.channels.length, 0)})
              </button>
              {playlists.map((pl) => (
                <div key={pl.id} className="flex items-center gap-1">
                  <button
                    onClick={() => setActivePlaylist(activePlaylist?.id === pl.id ? null : pl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${activePlaylist?.id === pl.id ? 'bg-red-600/20 border-red-500/40 text-red-300' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border))]'}`}
                  >
                    {pl.name} ({pl.channels.length})
                    {pl.attribution && <span className="ml-1 text-[hsl(var(--muted-foreground))] text-[9px]">via {pl.attribution}</span>}
                  </button>
                  <button
                    onClick={() => { const u = playlists.filter((p) => p.id !== pl.id); save(u); if (activePlaylist?.id === pl.id) setActivePlaylist(null); }}
                    className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] transition-colors text-xs"
                    title="Remove"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>

          {displayChannels.length > 0 && (
            <div className="px-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{displayChannels.length.toLocaleString()} channels</p>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg px-3 py-1 text-xs text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:border-red-500/50 w-40"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {displayChannels.slice(0, 200).map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => onSelectChannel(ch)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(var(--border))] hover:border-red-500/30 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] transition-all text-left"
                  >
                    {ch.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ch.logo} alt={ch.name} className="w-7 h-7 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-7 h-7 rounded flex items-center justify-center text-[9px] font-black text-white flex-shrink-0" style={{ background: ch.color || '#1a1a2e' }}>{initials(ch.name)}</div>
                    )}
                    <div>
                      <p className="text-xs text-[hsl(var(--foreground))] font-medium leading-tight max-w-[120px] truncate">{ch.name}</p>
                      {ch.category && <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{ch.category}</p>}
                    </div>
                  </button>
                ))}
                {displayChannels.length > 200 && (
                  <p className="w-full text-center text-xs text-[hsl(var(--muted-foreground))] py-2">+{displayChannels.length - 200} more — search to filter</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export function IptvPanel(_props: IDockviewPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Live TV');
  const [playItem, setPlayItem] = useState<PlayItem | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => {
    try { return localStorage.getItem('memelli_stream_disclaimer') === 'accepted'; } catch { return false; }
  });

  function acceptDisclaimer() {
    try { localStorage.setItem('memelli_stream_disclaimer', 'accepted'); } catch {}
    setDisclaimerAccepted(true);
  }

  const handleSelectChannel = useCallback((ch: Channel) => {
    setPlayItem({ name: ch.name, category: ch.category, color: ch.color, accent: ch.accent ?? ch.color, stream: ch.stream, description: ch.description });
  }, []);

  const handleSelectMovie = useCallback((m: Movie) => {
    setPlayItem({ name: m.title, category: `${m.year} · ${m.genre}`, color: m.color, accent: m.accent, stream: m.stream, description: m.description, meta: `${m.rating} · ${m.runtime}` });
  }, []);

  const handleSelectReel = useCallback((r: Reel) => {
    setPlayItem({ name: r.title, category: r.category, color: r.color, accent: r.accent, stream: r.stream, description: `By ${r.creator} · ${r.views} views` });
  }, []);

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--card))] text-[hsl(var(--foreground))] relative overflow-hidden">
      {/* One-time disclaimer */}
      {!disclaimerAccepted && <StreamingDisclaimer onAccept={acceptDisclaimer} />}
      {/* Tab bar */}
      <div className="flex gap-0.5 px-3 py-2.5 flex-shrink-0 overflow-x-auto scrollbar-none" style={{ borderBottom: '1px solid rgba(39,39,42,0.6)', scrollbarWidth: 'none' }}>
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus:outline-none whitespace-nowrap flex-shrink-0"
              style={{
                color: active ? '#fff' : '#71717a',
                background: active ? 'rgba(239,68,68,0.18)' : 'transparent',
                boxShadow: active ? 'inset 0 0 0 1px rgba(239,68,68,0.35)' : 'none',
              }}
            >
              {tab}
              {active && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: '#ef4444' }} />}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'Live TV'      && <LiveTVView onSelectChannel={handleSelectChannel} />}
        {activeTab === 'My Playlists' && <MyPlaylistsView onSelectChannel={handleSelectChannel} />}
        {activeTab === 'Movies'       && <MoviesView onSelectMovie={handleSelectMovie} />}
        {activeTab === 'Reels'        && <ReelsView onSelectReel={handleSelectReel} />}
        {activeTab === 'Sports'       && <FilteredChannelView category="Sports"   onSelectChannel={handleSelectChannel} />}
        {activeTab === 'News'         && <FilteredChannelView category="News"     onSelectChannel={handleSelectChannel} />}
        {activeTab === 'Music'        && <FilteredChannelView category="Music"    onSelectChannel={handleSelectChannel} />}
        {activeTab === 'Business'     && <FilteredChannelView category="Business" onSelectChannel={handleSelectChannel} />}
        {activeTab === 'Kids'         && <FilteredChannelView category="Kids"     onSelectChannel={handleSelectChannel} />}
      </div>

      {/* Video overlay */}
      {playItem && <VideoOverlay item={playItem} onClose={() => setPlayItem(null)} />}

      <style>{`
        @keyframes tvspin { to { transform: rotate(360deg); } }
        @keyframes tvpulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
