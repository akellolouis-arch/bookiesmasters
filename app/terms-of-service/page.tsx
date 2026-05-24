export default function TermsPage() {
    return (
        <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto sm:px-1 md:px-4 py-8 font-sans text-gray-300">
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white mb-6">Terms of Service</h1>

                <p className="text-sm text-gray-400"><em>Last updated: {new Date().getFullYear()}</em></p>

                <h2 className="text-lg font-semibold text-white mt-8">1. Acceptance of Terms</h2>
                <p className="text-sm leading-relaxed">
                    By accessing and using Bookiesmasters, you accept and agree to be bound by the terms and provision of this agreement.
                </p>

                <h2 className="text-lg font-semibold text-white mt-8">2. Use of Data</h2>
                <p className="text-sm leading-relaxed">
                    The data provided on this website is for informational purposes only. We make no guarantees regarding the accuracy or completeness of the information.
                    Betting involves risk, and you should only bet with money you can afford to lose.
                </p>

                <h2 className="text-lg font-semibold text-white mt-8">3. Intellectual Property</h2>
                <p className="text-sm leading-relaxed">
                    All content, design, and statistics on this site are the property of Bookiesmasters or its data providers.
                </p>
            </div>
        </div>
    );
}
