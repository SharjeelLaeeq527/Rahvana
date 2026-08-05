import { NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";
import ivData from "@/backend/data/iv_data.json";

// === Types ===

interface IVData {
  Country: string;
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

// === Helper Functions ===

function detectPostType(post: string): "Embassy" | "Consulate" {
  return post.toLowerCase().includes("consulate")
    ? "Consulate"
    : "Embassy";
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

    if (i > 0) {
      costs[shorter.length] = lastValue;
    }
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

  const distance = getEditDistance(longer, shorter);

  return (longer.length - distance) / longer.length;
}

function groupByCountry(data: IVData[]): Map<string, IVData[]> {
  const map = new Map<string, IVData[]>();

  data.forEach((item) => {
    if (!map.has(item.Country)) {
      map.set(item.Country, []);
    }

    map.get(item.Country)!.push(item);
  });

  return map;
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
    .filter((item) => item.similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3)
    .map((item) => ({
      country: item.country,
      posts: item.posts,
    }));
}

// === API ===

export async function POST(req: Request) {
  try {
    const { city, visaCategory } = await req.json();

    if (!city?.trim() || !visaCategory) {
      return NextResponse.json(
        {
          error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, {
            fields: "[city, visaCategory]",
          }),
        },
        { status: 400 }
      );
    }

    const allData = ivData as IVData[];

    const categoryMap: Record<string, string> = {
      "immediate-relative": "Immediate Relative",
      "family-sponsored": "Family-Sponsored Preference",
      "employment-based": "Employment-Based Preference",
    };

    const categoryName = categoryMap[visaCategory] || visaCategory;

    // Exact city + category match
    const filtered = allData.filter((item) => {
      const postMatch = item.Post
        .toLowerCase()
        .includes(city.toLowerCase());

      const categoryMatch = item["Visa Category"]
        .toLowerCase()
        .includes(categoryName.toLowerCase());

      return postMatch && categoryMatch;
    });

    if (filtered.length > 0) {
      return NextResponse.json({
        success: true,
        count: filtered.length,
        data: filtered,
      });
    }

    // Suggest countries
    const countryMap = groupByCountry(allData);

    const similarCountries = findSimilarCountries(city, countryMap);

    if (similarCountries.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No results found for "${city}".`,
        data: [],
      });
    }

    const countryOptions: CountryOption[] = similarCountries.map(
      ({ country, posts }) => ({
        country,
        embassies: posts.filter(
          (item) =>
            detectPostType(item.Post) === "Embassy" &&
            item["Visa Category"] === categoryName
        ),
        consulates: posts.filter(
          (item) =>
            detectPostType(item.Post) === "Consulate" &&
            item["Visa Category"] === categoryName
        ),
      })
    );

    return NextResponse.json({
      success: false,
      message: `We couldn't find "${city}". Did you mean one of these countries?`,
      needsCountrySelection: true,
      countryOptions,
      searchTerm: city,
      data: [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: msg(E.AUTH_UNEXPECTED_ERROR),
      },
      {
        status: 500,
      }
    );
  }
}