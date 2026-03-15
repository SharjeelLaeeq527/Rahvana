// Scoring System Configuration
export const SCORING_CONFIG = {
  // Maximum and minimum scores
  MAX_TOTAL_SCORE: 100,
  MIN_TOTAL_SCORE: 0,
  
  // Component weights (each component max score)
  COMPONENT_WEIGHTS: {
    INCOME_AND_FINANCIAL: 25,
    RELATIONSHIP_STRENGTH: 25,
    DOCUMENT_COMPLETENESS: 25,
    IMMIGRATION_HISTORY: 25
  },
  
  // Risk deduction points
  RISK_POINTS_DEDUCTION: {
    HIGH: 20,
    MEDIUM: 10,
    LOW: 5
  },
  
  // Income scoring thresholds
  INCOME_THRESHOLDS: {
    POVERTY_GUIDELINE_BASE: 15960, // 2026 US federal poverty guideline (48 states)
    ADDITIONAL_PER_PERSON: 5680,   // Additional amount per household member
    CRITICAL_RATIO: 1.25,          // Below 125% triggers HIGH risk
    WARNING_RATIO: 1.50            // Below 150% triggers MEDIUM risk
  },
  
  // Relationship scoring thresholds
  RELATIONSHIP_THRESHOLDS: {
    SHORT_DURATION_MONTHS: 6,      // Less than 6 months triggers HIGH risk
    MIN_IN_PERSON_VISITS: 3,       // Less than 3 visits triggers MEDIUM risk
    CRITICAL_IN_PERSON_VISITS: 0   // Zero visits triggers HIGH risk
  }
};

// Export individual constants for easy access
export const {
  MAX_TOTAL_SCORE,
  MIN_TOTAL_SCORE,
  COMPONENT_WEIGHTS,
  RISK_POINTS_DEDUCTION,
  INCOME_THRESHOLDS,
  RELATIONSHIP_THRESHOLDS
} = SCORING_CONFIG;