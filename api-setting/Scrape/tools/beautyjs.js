const { format } = require('prettier');

function beautyjs(code) {
  if (typeof code !== 'string' || code.trim() === '') {
    return ''; // Return empty string for invalid input
  }

  try {
    // Basic normalization
    let normalized = code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Collapse multiple whitespaces
      .trim();

    // Skip formatting if the code is too short after normalization
    if (normalized.length < 10) {
      return normalized;
    }

    // Try formatting with Prettier
    const formatted = format(normalized, {
      parser: 'babel',
      semi: true,
      singleQuote: true,
      trailingComma: 'none',
      printWidth: 80,
      tabWidth: 2,
      bracketSpacing: true,
      arrowParens: 'avoid'
    });

    return formatted || normalized; // Fallback to normalized if formatting fails
  } catch (error) {
    console.error('Formatting error:', error.message);
    // Return the original code if formatting fails completely
    return code;
  }
}

module.exports = beautyjs;
