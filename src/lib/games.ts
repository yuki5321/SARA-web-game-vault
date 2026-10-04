import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export type Game = {
  id: string;
  title: string;
  description: string;
  howToPlay: string;
  tips?: string;
  tags: string[];
  author: string;
  orientation: "portrait" | "landscape";
  aspectRatio: string;
  thumbnail?: string;
  publishedAt: string;
};

const gamesDirectory = join(process.cwd(), "public", "games");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const ratioPattern = /^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(data: Record<string, unknown>, key: string, gamePath: string): string {
  const value = data[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${gamePath}/game.json: "${key}" must be a non-empty string.`);
  }
  return value.trim();
}

function validateGame(data: unknown, directoryName: string): Game {
  const gamePath = `public/games/${directoryName}`;
  if (!isRecord(data)) {
    throw new Error(`${gamePath}/game.json: expected a JSON object.`);
  }

  const id = requiredString(data, "id", gamePath);
  if (!slugPattern.test(id) || id !== directoryName) {
    throw new Error(`${gamePath}/game.json: "id" must be a URL-safe slug matching its directory.`);
  }

  const title = requiredString(data, "title", gamePath);
  const description = requiredString(data, "description", gamePath);
  const howToPlay = requiredString(data, "howToPlay", gamePath);
  const author = requiredString(data, "author", gamePath);
  const orientation = requiredString(data, "orientation", gamePath);
  const aspectRatio = requiredString(data, "aspectRatio", gamePath);
  const publishedAt = requiredString(data, "publishedAt", gamePath);
  const tags = data.tags;

  if (orientation !== "portrait" && orientation !== "landscape") {
    throw new Error(`${gamePath}/game.json: "orientation" must be "portrait" or "landscape".`);
  }
  if (!ratioPattern.test(aspectRatio)) {
    throw new Error(`${gamePath}/game.json: "aspectRatio" must be a ratio such as "3/4".`);
  }
  const parsedDate = new Date(`${publishedAt}T00:00:00Z`);
  if (!datePattern.test(publishedAt) || Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== publishedAt) {
    throw new Error(`${gamePath}/game.json: "publishedAt" must use YYYY-MM-DD.`);
  }
  if (!Array.isArray(tags) || tags.length === 0 || tags.some((tag) => typeof tag !== "string" || !tag.trim())) {
    throw new Error(`${gamePath}/game.json: "tags" must be a non-empty array of strings.`);
  }
  if (data.tips !== undefined && (typeof data.tips !== "string" || !data.tips.trim())) {
    throw new Error(`${gamePath}/game.json: "tips" must be a non-empty string when provided.`);
  }
  if (data.thumbnail !== undefined && (typeof data.thumbnail !== "string" || !data.thumbnail.startsWith(`/games/${id}/`))) {
    throw new Error(`${gamePath}/game.json: "thumbnail" must be a local path inside the game's directory.`);
  }

  return {
    id,
    title,
    description,
    howToPlay,
    author,
    orientation,
    aspectRatio,
    publishedAt,
    tags: tags.map((tag) => (tag as string).trim()),
    ...(typeof data.tips === "string" ? { tips: data.tips.trim() } : {}),
    ...(typeof data.thumbnail === "string" ? { thumbnail: data.thumbnail } : {}),
  };
}

export function getGames(): Game[] {
  if (!statSync(gamesDirectory, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`Game directory not found: ${gamesDirectory}`);
  }

  return readdirSync(gamesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const directory = join(gamesDirectory, entry.name);
      const metadataPath = join(directory, "game.json");
      const gameFilePath = join(directory, "game.html");
      if (!statSync(metadataPath, { throwIfNoEntry: false })?.isFile()) {
        throw new Error(`Missing metadata file: public/games/${entry.name}/game.json`);
      }
      if (!statSync(gameFilePath, { throwIfNoEntry: false })?.isFile()) {
        throw new Error(`Missing game file: public/games/${entry.name}/game.html`);
      }

      let data: unknown;
      try {
        data = JSON.parse(readFileSync(metadataPath, "utf8"));
      } catch (error) {
        throw new Error(`Could not parse public/games/${entry.name}/game.json: ${String(error)}`);
      }
      return validateGame(data, entry.name);
    })
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || left.title.localeCompare(right.title));
}
