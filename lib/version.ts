// Import the package.json as a whole
import packageJson from '../package.json';

// Extract version from the imported object
export const version = packageJson.version;