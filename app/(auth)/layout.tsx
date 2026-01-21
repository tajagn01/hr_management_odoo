"use client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Triangular Spotlight - Cone shape from top */}
      <div className="absolute inset-0">
        {/* Main triangular spotlight expanding from top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[800px] bg-gradient-to-b from-violet-500/30 via-blue-500/15 to-transparent blur-3xl"
          style={{
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
          }}
        ></div>

        {/* Wider outer cone for soft edges */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-gradient-to-b from-purple-600/20 via-blue-600/10 to-transparent blur-3xl"
          style={{
            clipPath: 'polygon(50% 0%, 10% 100%, 90% 100%)'
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
