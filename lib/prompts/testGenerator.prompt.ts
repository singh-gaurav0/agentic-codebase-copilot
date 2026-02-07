/**
 * Test Generator Prompt Builder
 * Constructs prompts for test generation
 */

export function buildTestGenerationPrompt(
  code: string,
  language: string
): string {
  // TODO: Implement test generation prompt
  // 1. Include code to test
  // 2. Specify target language and framework
  // 3. Request comprehensive test coverage
  // 4. Return prompt for LLM

  return ""
}

export const TEST_GENERATOR_SYSTEM_PROMPT = `You are an expert QA engineer. Generate comprehensive unit tests for the provided code. Include edge cases, error handling, and follow best practices for the specified language and framework.`

// TODO: Add language-specific prompt variations
// TODO: Add framework-specific examples (Jest, Vitest, pytest, etc.)

export function getTestFramework(language: string): string {
  // TODO: Map language to appropriate test framework
  const frameworks: Record<string, string> = {
    typescript: "Jest",
    javascript: "Jest",
    python: "pytest",
    java: "JUnit",
    // TODO: Add more languages
  }

  return frameworks[language] || "Jest"
}
