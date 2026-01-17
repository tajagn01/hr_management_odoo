export default function SocialProof() {
    return (
        <section className="py-10">
            <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                        Trusted by 5,000+ companies
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-8 gap-y-4 grayscale opacity-70 hover:opacity-100 transition-opacity duration-300">
                        {/* Placeholder Logos */}
                        <span className="text-xl font-bold text-slate-400">Acme Corp</span>
                        <span className="text-xl font-bold text-slate-400">GlobalTech</span>
                        <span className="text-xl font-bold text-slate-400">Nebula</span>
                        <span className="text-xl font-bold text-slate-400">Trio</span>
                        <span className="text-xl font-bold text-slate-400">FoxRun</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
