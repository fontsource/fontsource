import { defineWorkspace } from 'vitest/config';

// api is not included in workspace because Miniflare breaks
export default defineWorkspace(['packages/*', 'api/*']);
