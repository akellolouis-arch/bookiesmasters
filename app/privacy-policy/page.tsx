export default function PrivacyPage() {
    return (
        <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto px-1 sm:px-4 md:px-4 pt-2 pb-4 font-sans text-gray-300">
            <div className="space-y-3">
                <h1 className="text-xs font-semibold text-emerald-100/90 mb-2">Privacy Policy</h1>

                <p className="text-[11px] sm:text-xs leading-normal text-gray-400">
                    At Bookiesmasters, we take your privacy seriously. This policy outlines how we handle your data.
                </p>

                <h2 className="text-xs font-semibold text-emerald-100/90 mt-3">Data Collection</h2>
                <p className="text-[11px] sm:text-xs leading-normal text-gray-400">
                    We do not collect personal identifiable information unless you voluntarily provide it (e.g., contacting us via email).
                    We may use cookies to improve your browsing experience and analyze site traffic.
                </p>

                <h2 className="text-xs font-semibold text-emerald-100/90 mt-3">Third-Party Services</h2>
                <p className="text-[11px] sm:text-xs leading-normal text-gray-400">
                    We use third-party APIs to provide football data. These services may have their own privacy policies.
                </p>
            </div>
        </div>
    );
}
