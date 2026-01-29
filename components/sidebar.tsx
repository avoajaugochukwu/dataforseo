'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/settings', label: 'Settings' },
  { href: '/keywords', label: 'Keywords' },
  { href: '/topics', label: 'Topics' },
  { href: '/content', label: 'Content' },
  { href: '/publish', label: 'Publish' },
  { href: '/help', label: 'Help' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 min-h-screen p-4">
      <h1 className="text-lg font-bold mb-6 text-zinc-900 dark:text-zinc-100">PCE</h1>
      <nav className="flex flex-col gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname.startsWith(l.href)
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
