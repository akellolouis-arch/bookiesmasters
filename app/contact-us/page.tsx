export default function ContactPage() {
    return (
        <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto px-1 sm:px-4 md:px-4 pt-2 pb-4 font-sans text-gray-300">
            <div className="space-y-3">
                <h1 className="text-sm font-semibold text-emerald-100/90 mb-2">Contact Us</h1>

                <p className="text-xs leading-normal text-gray-400">
                    We value your feedback and are here to assist with any inquiries.
                </p>

                <div className="bg-[#1F1F1F] p-4 rounded-lg border border-white/5 mt-4">
                    <h2 className="text-xs font-semibold text-emerald-100/90 mb-2">Get in Touch</h2>
                    <p className="text-xs leading-normal text-gray-400 mb-2">
                        For support, partnerships, or general questions, please email us directly:
                    </p>
                    <a href="mailto:support@bookiesmasters.com" className="text-teal-400 font-semibold text-xs hover:underline">
                        support@bookiesmasters.com
                    </a>
                </div>
            </div>
        </div>
    );
}
