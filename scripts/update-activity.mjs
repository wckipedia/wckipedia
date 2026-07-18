import { readFile, writeFile } from "node:fs/promises";

const owner = "wckipedia";
const projects = [
  ["current", "A focused technology briefing and archive"],
  ["CVify", "A private, no-sign-up resume builder"],
  ["step-pdf", "A straightforward file-conversion toolkit"],
  ["leejiajing.com", "My evolving portfolio and design playground"],
];

const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Singapore",
});

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": `${owner}-profile-activity`,
  "X-GitHub-Api-Version": "2022-11-28",
};

if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

const rows = await Promise.all(
  projects.map(async ([repo, focus]) => {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status} for ${repo}`);
    }

    const data = await response.json();
    const date = formatter.format(new Date(data.pushed_at));
    return `| [${repo}](https://github.com/${owner}/${repo}) | ${focus} | ${date} |`;
  }),
);

const start = "<!-- activity:start -->";
const end = "<!-- activity:end -->";
const readmePath = new URL("../README.md", import.meta.url);
const readme = await readFile(readmePath, "utf8");
const replacement = [
  start,
  "| Project | Current focus | Last activity |",
  "| :-- | :-- | --: |",
  ...rows,
  end,
].join("\n");

const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
if (!pattern.test(readme)) {
  throw new Error("Activity markers are missing from README.md");
}

await writeFile(readmePath, readme.replace(pattern, replacement));
