import Footer from "@/components/Footer";

export default function AboutPage() {
    return (
        <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto px-1 sm:px-4 md:px-4 pt-2 pb-4 font-sans text-gray-300">
            <div className="space-y-3">
                <h1 className="text-xs font-semibold text-emerald-100/90 mb-2">About Us</h1>

                <p className="text-[11px] sm:text-xs leading-normal text-gray-400">Welcome to <strong className="text-white">Bookiesmasters</strong>, your ultimate destination for data-driven football insights.</p>

                <p className="text-[11px] sm:text-xs leading-normal text-gray-400">
                    We are dedicated to providing football enthusiasts, bettors, and analysts with the most accurate and timely information available.
                    From live scores and fixture details to deep statistical analysis and historical trends, our platform is built to give you the edge.
                </p>

                <h2 className="text-xs font-semibold text-emerald-100/90 mt-3">Our Mission</h2>
                <p className="text-[11px] sm:text-xs leading-normal text-gray-400">
                    To demystify football data and make professional-grade statistics accessible to everyone.
                    We believe that better data leads to better decisions, whether you are predicting match outcomes or simply following your favorite league.
                </p>
            </div>
            <div className="mt-8">
                <Footer />
            </div>
        </div>
    );
}
