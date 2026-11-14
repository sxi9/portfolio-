// Fallback for the GitHub pulse panel: used until (or unless) the live request
// to api.github.com answers. Public repositories only. Taken on 14 Nov 2026.
export const pulseSnapshot = {
  asOf: '2026-11-14',
  metric: 'commits',
  repos: [
    { name: "claude-session-transfer", pushedAt: "2026-11-14T15:04:01Z", language: "Python", url: "https://github.com/sxi9/claude-session-transfer" },
    { name: "trust-gain", pushedAt: "2026-11-14T10:15:16Z", language: "TypeScript", url: "https://github.com/sxi9/trust-gain" },
    { name: "msp", pushedAt: "2026-11-14T08:55:40Z", language: "Go", url: "https://github.com/sxi9/msp" },
    { name: "dumpper", pushedAt: "2026-11-13T07:21:35Z", language: "Python", url: "https://github.com/sxi9/dumpper" },
    { name: "GetMe", pushedAt: "2026-11-13T03:02:40Z", language: "TypeScript", url: "https://github.com/sxi9/GetMe" },
    { name: "andro", pushedAt: "2026-11-13T02:44:47Z", language: "Python", url: "https://github.com/sxi9/andro" },
  ],
  // commits per day on default branches
  days: {
    '2026-07-20': 1, '2026-07-22': 1, '2026-07-23': 1, '2026-07-24': 1,
    '2026-07-26': 1, '2026-07-27': 1, '2026-07-28': 1, '2026-07-30': 1,
    '2026-07-31': 1, '2026-08-01': 2, '2026-08-02': 4, '2026-10-03': 4,
    '2026-10-04': 2, '2026-10-06': 14, '2026-10-08': 6, '2026-10-12': 12,
    '2026-10-13': 4, '2026-10-14': 2, '2026-10-15': 5, '2026-10-16': 57,
    '2026-10-17': 41, '2026-10-18': 17, '2026-10-19': 17, '2026-10-20': 9,
    '2026-10-21': 2, '2026-10-25': 18, '2026-10-26': 40, '2026-10-27': 49,
    '2026-10-28': 35, '2026-10-29': 27, '2026-10-30': 9, '2026-11-01': 3,
    '2026-11-02': 2, '2026-11-03': 2, '2026-11-04': 12, '2026-11-05': 7,
    '2026-11-09': 25, '2026-11-11': 2, '2026-11-12': 26, '2026-11-13': 35,
    '2026-11-14': 32,
  },
};
