export default function TermsPage() {
    return (
        <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto px-1 sm:px-4 md:px-4 pt-2 pb-4 font-sans text-gray-300">
            <div className="space-y-3">
                <h1 className="text-sm font-semibold text-emerald-100/90 mb-2">Terms of Service</h1>

                <p className="text-[10px] text-gray-400 mb-2"><em>Last updated: {new Date().getFullYear()}</em></p>

                <h2 className="text-xs font-semibold text-emerald-100/90 mt-3">1. Acceptance of Terms</h2>
                <p className="text-xs leading-normal text-gray-400">
                    By accessing and using Bookiesmasters, you accept and agree to be bound by the terms and provision of this agreement.
                </p>

                <h2 className="text-xs font-semibold text-emerald-100/90 mt-3">2. Use of Data</h2>
                <p className="text-xs leading-normal text-gray-400">
                    The data provided on this website is for informational purposes only. We make no guarantees regarding the accuracy or completeness of the information.
                    Betting involves risk, and you should only bet with money you can afford to lose.
                </p>

                <h2 className="text-xs font-semibold text-emerald-100/90 mt-3">3. Intellectual Property</h2>
                <p className="text-xs leading-normal text-gray-400">
                    All content, design, and statistics on this site are the property of Bookiesmasters or its data providers.
                </p>
            </div>
        </div>
    );
}
