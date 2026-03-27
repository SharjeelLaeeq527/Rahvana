// Category Loader Service
import fs from "fs/promises";
import path from "path";

import type {
  InterviewCategoryConfig,
  DynamicQuestionnaire,
  QuestionBank,
} from "@/data/interview-categories/schema";

interface CategoryData {
  config: InterviewCategoryConfig;
  questionnaire: DynamicQuestionnaire;
  questionBank: QuestionBank;
}

class CategoryLoaderService {
  private cache: Map<string, CategoryData> = new Map();
  private readonly CACHE_TTL_MS = 3600000; // 1 hour
  private cacheTimestamps: Map<string, number> = new Map();

  // Base path resolver
  private getCategoryPath(slug: string) {
    return path.join(
      process.cwd(),
      "data",
      "interview-categories",
      slug
    );
  }

  // Generic JSON reader
  private async readJsonFile<T>(filePath: string): Promise<T> {
    const file = await fs.readFile(filePath, "utf-8");
    return JSON.parse(file) as T;
  }

  // Load all data files for a specific category
  async loadCategory(categorySlug: string): Promise<CategoryData> {
    // Cache check
    if (this.cache.has(categorySlug)) {
      const timestamp = this.cacheTimestamps.get(categorySlug) || 0;
      const isExpired = Date.now() - timestamp > this.CACHE_TTL_MS;

      if (!isExpired) {
        return this.cache.get(categorySlug)!;
      }

      this.cache.delete(categorySlug);
      this.cacheTimestamps.delete(categorySlug);
    }

    try {
      const basePath = this.getCategoryPath(categorySlug);

      // Parallel load via FS
      const [config, questionnaire, questionBank] = await Promise.all([
        this.readJsonFile<InterviewCategoryConfig>(
          path.join(basePath, "config.json")
        ),
        this.readJsonFile<DynamicQuestionnaire>(
          path.join(basePath, "questionnaire.json")
        ),
        this.readJsonFile<QuestionBank>(
          path.join(basePath, "question-bank.json")
        ),
      ]);

      const categoryData = { config, questionnaire, questionBank };

      // Cache update
      this.cache.set(categorySlug, categoryData);
      this.cacheTimestamps.set(categorySlug, Date.now());

      return categoryData;
    } catch (error) {
      console.error(`Failed to load category ${categorySlug}:`, error);
      throw new Error(
        `Failed to load category data for ${categorySlug}. Check file paths & JSON validity.`
      );
    }
  }

  // Get all active categories
  async getActiveCategories(country?: string): Promise<InterviewCategoryConfig[]> {
    const slugs = [
      "ir-1-spouse",
      "ir-2-child",
      "ir-5-parent",
      "f1-student",
      "uk-student",
      "ca-student",
      "au-student",
      "it-student",
    ];

    const results = await Promise.allSettled(
      slugs.map((slug) => this.loadCategory(slug))
    );

    let categories = results
      .filter((r): r is PromiseFulfilledResult<CategoryData> => r.status === "fulfilled")
      .map((r) => r.value.config)
      .filter((c) => c.isActive);

    if (country) {
      categories = categories.filter((c) => c.visaCountry === country);
    }

    return categories;
  }

  // Clear cache
  clearCache(categorySlug?: string) {
    if (categorySlug) {
      this.cache.delete(categorySlug);
      this.cacheTimestamps.delete(categorySlug);
    } else {
      this.cache.clear();
      this.cacheTimestamps.clear();
    }
  }

  // Validate category
  async validateCategory(categorySlug: string): Promise<boolean> {
    try {
      const data = await this.loadCategory(categorySlug);
      return data.config.isActive;
    } catch {
      return false;
    }
  }
}

// Singleton
export const categoryLoader = new CategoryLoaderService();