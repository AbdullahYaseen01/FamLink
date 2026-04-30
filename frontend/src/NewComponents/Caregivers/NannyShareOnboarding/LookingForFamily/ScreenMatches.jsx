import React from "react";
import { Users, MapPin, Calendar, Star } from "lucide-react";

const mockMatches = [
    {
        id: 1,
        name: "The Miller Family",
        neighborhood: "Brooklyn Heights",
        kids: "2 Children (Toddler & Infant)",
        schedule: "Full-time",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Miller"
    },
    {
        id: 2,
        name: "Sarah & Tom",
        neighborhood: "Park Slope",
        kids: "1 Child (Preschool)",
        schedule: "Part-time",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    },
    {
        id: 3,
        name: "The Garcia Family",
        neighborhood: "Williamsburg",
        kids: "1 Child (Infant)",
        schedule: "Flexible",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Garcia"
    }
];

function ScreenMatches({ onContinue }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-12">
                <div className="inline-block bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4 animate-bounce">
                    12+ Families found near you!
                </div>
                <h1 className="text-primary Livvic-Bold text-4xl lg:text-5xl mb-4">
                    Matches Near You
                </h1>
                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                    Based on your setup, these families are looking for a nanny share exactly like yours.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
                {mockMatches.map((match) => (
                    <div key={match.id} className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center transform transition-all hover:scale-[1.03]">
                        <div className="relative mb-6">
                            <div className="w-24 h-24 rounded-full border-4 border-primary/10 overflow-hidden">
                                <img src={match.image} alt={match.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute bottom-1 right-0 bg-primary text-white p-1.5 rounded-full shadow-lg">
                                <Star size={14} fill="white" />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-primary mb-1">{match.name}</h3>
                        <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-4">
                            <MapPin size={14} />
                            <span>{match.neighborhood}</span>
                        </div>

                        <div className="w-full space-y-3 mb-6">
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl">
                                <Users size={16} className="text-primary" />
                                <span className="text-xs font-semibold text-gray-600 text-left leading-tight">{match.kids}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl">
                                <Calendar size={16} className="text-primary" />
                                <span className="text-xs font-semibold text-gray-600">{match.schedule}</span>
                            </div>
                        </div>

                        <div className="mt-auto w-full pt-4 border-t border-gray-50">
                            <span className="text-primary/40 font-bold text-xs uppercase tracking-widest">Connect to view full profile</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10 max-w-2xl mx-auto text-center">
                <p className="text-primary font-bold text-lg mb-2">Want to see all 12 matches?</p>
                <p className="text-gray-500 text-sm mb-0">Create a quick account to message families and view their complete requirements.</p>
            </div>
        </div>
    );
}

export default ScreenMatches;
