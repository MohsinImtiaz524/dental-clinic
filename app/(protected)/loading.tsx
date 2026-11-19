export default function Loading() {
  return <div role="status" aria-label="Loading workspace" className="animate-pulse space-y-6"><div className="h-8 w-56 rounded-lg bg-[#e5ebe4]" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1, 2, 3, 4].map(item => <div key={item} className="h-36 rounded-2xl bg-[#e9eee7]" />)}</div><div className="h-80 rounded-2xl bg-[#e9eee7]" /><span className="sr-only">Loading workspace…</span></div>;
}
