import { NavLink } from "react-router-dom";
import Button from "../../Button";

const ServiceAreaOakland = () => {
    // Entries with a slug link to their landing page (real internal links so
    // the neighborhood pages aren't orphans); the rest render as plain text.
    const cities = [
        {
            name: "Oakland",
            color: { bg: "#E6F1FB", icon: "#185FA5" },
            neighborhoods: [
                { name: "Rockridge", slug: "rockridge" },
                { name: "Temescal", slug: "temescal" },
                { name: "Piedmont Avenue", slug: "piedmont-avenue" },
                { name: "Grand Lake", slug: "grand-lake" },
                { name: "Adams Point", slug: "adams-point" },
                { name: "Montclair", slug: "montclair" },
                { name: "Lakeshore", slug: "lakeshore" },
            ],
        },
        {
            name: "Berkeley",
            color: { bg: "#E1F5EE", icon: "#0F6E56" },
            neighborhoods: [
                { name: "North Berkeley", slug: "north-berkeley" },
                { name: "Elmwood", slug: "elmwood" },
                { name: "Downtown Berkeley", slug: "downtown-berkeley" },
                { name: "West Berkeley", slug: "west-berkeley" },
            ],
        },
        {
            name: "Alameda",
            color: { bg: "#EEEDFE", icon: "#534AB7" },
            neighborhoods: [
                { name: "Central Alameda" },
                { name: "Bay Farm Island" },
            ],
        },
    ];

    const nearby = [
        { name: "Emeryville", slug: "emeryville-ca" },
        { name: "Albany", slug: "albany-ca" },
        { name: "San Leandro", slug: "san-leandro-ca" },
        { name: "Castro Valley", slug: "castro-valley-ca" },
    ];

    return (
        <div className="container px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
            <div className="flex flex-col sm:flex-row sm:justify-between mt-6 sm:mt-12 gap-4 sm:gap-0">
                <div>
                    <h2 className="Livvic-Bold text-4xl sm:text-5xl">
                        Service Areas
                    </h2>
                </div>
            </div>
            <p className="text-lg sm:text-[20px] text-[#00000099] Livvic-Medium mt-2">
                Connect with nanny share families across the East Bay.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
                {cities.map((city) => (
                    <div key={city.name} className="bg-white rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            {/* <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: city.color.bg }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={city.color.icon} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" /></svg>
                            </div> */}
                            <span className="text-2xl Livvic-SemiBold text-gray-800">{city.name}</span>
                        </div>
                        <ul className="space-y-1.5">
                            {city.neighborhoods.map((n) => (
                                <li key={n.name} className="text-lg Livvic-Medium text-secondary flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                                    {n.slug ? (
                                        <NavLink
                                            to={`/nanny-share/${n.slug}`}
                                            onClick={() => window.scrollTo({ top: 0 })}
                                            className="hover:text-primary hover:underline transition-colors"
                                        >
                                            {n.name}
                                        </NavLink>
                                    ) : (
                                        n.name
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className=" rounded-xl p-4 mb-6">
                <p className="text-2xl Livvic-SemiBold text-gray-800 mb-2.5">Nearby areas</p>
                <div className="flex flex-wrap gap-2">
                    {nearby.map((area) => (
                        <NavLink
                            key={area.name}
                            to={`/nanny-share/${area.slug}`}
                            onClick={() => window.scrollTo({ top: 0 })}
                            className="text-base Livvic-Medium text-gray-500 bg-white border-2 border-gray-100 rounded-full px-3 py-1 hover:text-primary hover:border-[#AEC4FF] transition-colors"
                        >
                            {area.name}
                        </NavLink>
                    ))}
                </div>
            </div>

            <div className="bg-[#EBF5FF] rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-xl Livvic-SemiBold text-primary mb-0.5">Ready to find your nanny share match?</p>
                    <p className="text-base Livvic-Medium text-secondary">Connect with nanny share families across the East Bay.</p>
                </div>

                <NavLink to="/find-nanny-share" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                    <Button
                        btnText={"Create Your Profile"}
                        className="text-primary bg-[#AEC4FF] w-full sm:w-auto"
                    />
                </NavLink>
            </div>
        </div>
    );
};

export default ServiceAreaOakland;