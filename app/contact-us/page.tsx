export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[#111111] text-gray-300 py-12 px-4 md:px-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-white mb-8">Contact Us</h1>

                <p>
                    We value your feedback and are here to assist with any inquiries.
                </p>

                <div className="bg-[#1F1F1F] p-6 rounded-lg border border-white/5 mt-8">
                    <h2 className="text-xl font-semibold text-white mb-4">Get in Touch</h2>
                    <p className="mb-4">
                        For support, partnerships, or general questions, please email us directly:
                    </p>
                    <a href="mailto:support@bookiesmasters.com" className="text-teal-400 font-bold text-lg hover:underline">
                        support@bookiesmasters.com
                    </a>
                </div>
            </div>
        </div>
    );
}
