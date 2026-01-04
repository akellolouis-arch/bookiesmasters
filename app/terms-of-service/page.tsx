export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#111111] text-gray-300 py-12 px-4 md:px-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>

                <p><em>Last updated: {new Date().getFullYear()}</em></p>

                <h2 className="text-xl font-semibold text-white mt-8">1. Acceptance of Terms</h2>
                <p>
                    By accessing and using Bookiesmasters, you accept and agree to be bound by the terms and provision of this agreement.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">2. Use of Data</h2>
                <p>
                    The data provided on this website is for informational purposes only. We make no guarantees regarding the accuracy or completeness of the information.
                    Betting involves risk, and you should only bet with money you can afford to lose.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">3. Intellectual Property</h2>
                <p>
                    All content, design, and statistics on this site are the property of Bookiesmasters or its data providers.
                </p>
            </div>
        </div>
    );
}
