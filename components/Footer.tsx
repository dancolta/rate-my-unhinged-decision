export default function Footer() {
  return (
    <footer className="mt-auto pt-8 pb-6">
      <div
        className="mb-4 h-px w-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 4px, transparent 4px, transparent 8px)",
        }}
      />
      <p className="text-center font-body text-xs text-text-muted">
        a NodeSparks experiment
      </p>
    </footer>
  );
}
