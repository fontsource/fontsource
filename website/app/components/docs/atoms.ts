import { atom } from 'jotai';

import type { FetchMdxListResult } from '@/utils/mdx/mdx.server';

export const sidebarAtom = atom<FetchMdxListResult>({});
