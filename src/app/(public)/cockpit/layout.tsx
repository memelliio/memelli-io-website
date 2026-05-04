export default function CockpitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] overflow-auto">
      {children}
    </div>
  );
}
