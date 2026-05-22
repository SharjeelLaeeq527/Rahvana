import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// === Types ===
interface IVData {
  Post: string;
  "Visa Category": string;
  "Case Documentarily Complete": string;
}

interface CountryOption {
  country: string;
  embassies: IVData[];
  consulates: IVData[];
}

interface SimilarCountry {
  country: string;
  posts: IVData[];
}

// === Cache ===
let cachedData: IVData[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour (was 24h — was causing stale data)

// === Helper Functions ===

function extractCountry(post: string): string | null {
  const parts = post.split(/[,\/]/);
  if (parts.length >= 2) {
    return parts[parts.length - 1].trim();
  }
  return null;
}

function detectPostType(post: string): "Embassy" | "Consulate" {
  return post.toLowerCase().includes("consulate") ? "Consulate" : "Embassy";
}

function getEditDistance(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  const costs: number[] = Array(shorter.length + 1).fill(0);

  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(newValue, lastValue, costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  return costs[shorter.length];
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const distance = getEditDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function groupByCountry(data: IVData[]): Map<string, IVData[]> {
  const countryMap = new Map<string, IVData[]>();

  data.forEach((item) => {
    const country = extractCountry(item.Post);
    if (country) {
      if (!countryMap.has(country)) {
        countryMap.set(country, []);
      }
      countryMap.get(country)!.push(item);
    }
  });

  return countryMap;
}

function findSimilarCountries(
  searchTerm: string,
  countryMap: Map<string, IVData[]>
): SimilarCountry[] {
  return Array.from(countryMap.entries())
    .map(([country, posts]) => ({
      country,
      similarity: calculateSimilarity(searchTerm, country),
      posts,
    }))
    .filter((s) => s.similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3)
    .map((s) => ({ country: s.country, posts: s.posts }));
}

// === Scraper Function ===
async function scrapeIVData(): Promise<IVData[]> {
  try {
    console.log("Fetching fresh data from State Department...");

    const response = await fetch(
      "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/iv-wait-times.html",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const data: IVData[] = [];

    // Find the table with IV data
    $("table").each((_, table) => {
      const rows = $(table).find("tr");
      if (rows.length < 2) return;

      const headers = $(rows[0])
        .find("th, td")
        .map((_, el) => $(el).text().trim().toLowerCase())
        .get();

      if (!headers.some((h) => h.includes("post"))) return;

      rows.slice(1).each((_, row) => {
        const cells = $(row)
          .find("td")
          .map((_, el) => $(el).text().trim())
          .get();

        if (cells.length < 4) return;

        const post = cells[0];
        const eb = cells[1]; // Employment Visa
        const fs = cells[2]; // Preference (Family-Sponsored) Visa
        const ir = cells[3]; // Relative (Immediate Relative) Visa

        if (ir && ir !== "-" && !ir.toLowerCase().includes("n/a")) {
          data.push({
            Post: post,
            "Visa Category": "Immediate Relative",
            "Case Documentarily Complete": ir,
          });
        }
        if (fs && fs !== "-" && !fs.toLowerCase().includes("n/a")) {
          data.push({
            Post: post,
            "Visa Category": "Family-Sponsored Preference",
            "Case Documentarily Complete": fs,
          });
        }
        if (eb && eb !== "-" && !eb.toLowerCase().includes("n/a")) {
          data.push({
            Post: post,
            "Visa Category": "Employment-Based Preference",
            "Case Documentarily Complete": eb,
          });
        }
      });

      if (data.length > 0) return false; // Break after first valid table
    });

    console.log(`Scraped ${data.length} records`);
    return data;
  } catch (error) {
    console.error("Scraping failed:", error);
    throw error;
  }
}

function getSampleData(): IVData[] {
  return [
    {
      Post: "Islamabad, Pakistan",
      "Visa Category": "Immediate Relative",
      "Case Documentarily Complete": "February 2025",
    },
    {
      Post: "Karachi, Pakistan",
      "Visa Category": "Immediate Relative",
      "Case Documentarily Complete": "December 2024",
    },
    {
      Post: "Mumbai, India",
      "Visa Category": "Immediate Relative",
      "Case Documentarily Complete": "January 2025",
    },
    {
      Post: "New Delhi, India",
      "Visa Category": "Family-Sponsored Preference",
      "Case Documentarily Complete": "November 2024",
    },
    {
      Post: "Dubai, United Arab Emirates",
      "Visa Category": "Employment-Based Preference",
      "Case Documentarily Complete": "March 2025",
    },
  ];
}

async function getIVData(): Promise<IVData[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedData && now - cacheTime < CACHE_DURATION) {
    console.log("Returning cached data");
    return cachedData;
  }

  // Fetch fresh data
  cachedData = await scrapeIVData();
  cacheTime = now;
  return cachedData;
}

// === API Route ===
export async function POST(req: Request) {
  try {
    const { city, visaCategory } = await req.json();

    console.log("API Request received:", { city, visaCategory });

    if (!city?.trim() || !visaCategory) {
      return NextResponse.json({ error: "City and visa category are required" }, { status: 400 });
    }

    // Get data
    const allData = await getIVData();

    console.log(`Loaded ${allData.length} total records`);

    // Map visa categories
    const categoryMap: Record<string, string> = {
      "immediate-relative": "Immediate Relative",
      "family-sponsored": "Family-Sponsored Preference",
      "employment-based": "Employment-Based Preference",
    };

    const categoryName = categoryMap[visaCategory] || visaCategory;
    console.log(`Searching for: city="${city}", category="${categoryName}"`);

    // Exact match filter
    const filtered = allData.filter((item) => {
      const postMatch = item.Post.toLowerCase().includes(city.toLowerCase());
      const categoryMatch = item["Visa Category"]
        .toLowerCase()
        .includes(categoryName.toLowerCase());

      return postMatch && categoryMatch;
    });

    console.log(`Found ${filtered.length} matching records`);

    // Return exact matches
    if (filtered.length > 0) {
      return NextResponse.json({
        success: true,
        count: filtered.length,
        data: filtered,
      });
    }

    // No exact match → suggest similar countries
    console.log("No exact match. Searching similar countries...");
    const countryMap = groupByCountry(allData);
    const similarCountries = findSimilarCountries(city, countryMap);

    if (similarCountries.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No results found for "${city}". Try a different search term.`,
        data: [],
      });
    }

    console.log(
      "Similar countries:",
      similarCountries.map((c) => c.country)
    );

    // Group by Embassy/Consulate per country
    const countryOptions: CountryOption[] = similarCountries.map((item) => {
      const embassies = item.posts.filter(
        (p) =>
          detectPostType(p.Post) === "Embassy" &&
          p["Visa Category"].toLowerCase().includes(categoryName.toLowerCase())
      );

      const consulates = item.posts.filter(
        (p) =>
          detectPostType(p.Post) === "Consulate" &&
          p["Visa Category"].toLowerCase().includes(categoryName.toLowerCase())
      );

      return {
        country: item.country,
        embassies,
        consulates,
      };
    });

    return NextResponse.json({
      success: false,
      message: `We couldn't find "${city}". Did you mean one of these countries?`,
      needsCountrySelection: true,
      countryOptions,
      searchTerm: city,
      data: [],
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
