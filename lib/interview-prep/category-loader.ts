// Category Loader Service - Dynamically loads category-specific configuration files.
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

  // Load all data files for a specific category
  async loadCategory(categorySlug: string): Promise<CategoryData> {
    // Check cache first
    if (this.cache.has(categorySlug)) {
      const timestamp = this.cacheTimestamps.get(categorySlug) || 0;
      const isExpired = Date.now() - timestamp > this.CACHE_TTL_MS;

      if (!isExpired) {
        return this.cache.get(categorySlug)!;
      }

      // Cache expired, remove it
      this.cache.delete(categorySlug);
      this.cacheTimestamps.delete(categorySlug);
    }

    try {
      // Load all files in parallel
      const [config, questionnaire, questionBank] = await Promise.all([
        this.importConfig(categorySlug),
        this.importQuestionnaire(categorySlug),
        this.importQuestionBank(categorySlug),
      ]);

      const categoryData = { config, questionnaire, questionBank };

      // Update cache
      this.cache.set(categorySlug, categoryData);
      this.cacheTimestamps.set(categorySlug, Date.now());

      return categoryData;
    } catch (error) {
      console.error(`Failed to load category ${categorySlug}:`, error);
      throw new Error(
        `Failed to load category data for ${categorySlug}. Ensure all JSON files exist.`,
      );
    }
  }

  // Import category configuration
  private async importConfig(slug: string): Promise<InterviewCategoryConfig> {
    const configModule = await import(
      `@/data/interview-categories/${slug}/config.json`
    );
    return configModule.default as InterviewCategoryConfig;
  }

  // Import questionnaire schema
  private async importQuestionnaire(
    slug: string,
  ): Promise<DynamicQuestionnaire> {
    const questionnaireModule = await import(
      `@/data/interview-categories/${slug}/questionnaire.json`
    );
    return questionnaireModule.default as DynamicQuestionnaire;
  }

  // Import question bank
  private async importQuestionBank(slug: string): Promise<QuestionBank> {
    const questionBankModule = await import(
      `@/data/interview-categories/${slug}/question-bank.json`
    );
    return questionBankModule.default as QuestionBank;
  }

  // Get all active categories
  async getActiveCategories(): Promise<InterviewCategoryConfig[]> {
    const categories = [
      await this.loadCategory("ir-1-spouse"),
      // Add more categories here as we'll added to the system
      // await this.loadCategory("ir-2-fiance"),
      // await this.loadCategory("f-1-student"),
    ];

    return categories.map((c) => c.config).filter((c) => c.isActive);
  }

  // Clear cache for a specific category or all categories
  clearCache(categorySlug?: string) {
    if (categorySlug) {
      this.cache.delete(categorySlug);
      this.cacheTimestamps.delete(categorySlug);
    } else {
      this.cache.clear();
      this.cacheTimestamps.clear();
    }
  }

  // Validate that a category exists and is active
  async validateCategory(categorySlug: string): Promise<boolean> {
    try {
      const config = await this.loadCategory(categorySlug);
      return config.config.isActive;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const categoryLoader = new CategoryLoaderService();
