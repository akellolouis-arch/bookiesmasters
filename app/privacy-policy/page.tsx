export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#111111] text-gray-300 py-12 px-4 md:px-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>

                <p>
                    At Bookiesmasters, we take your privacy seriously. This policy outlines how we handle your data.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">Data Collection</h2>
                <p>
                    We do not collect personal identifiable information unless you voluntarily provide it (e.g., contacting us via email).
                    We may use cookies to improve your browsing experience and analyze site traffic.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">Third-Party Services</h2>
                <p>
                    We use third-party APIs to provide football data. These services may have their own privacy policies.
                </p>
            </div>
        </div>
    );
}
