import { useNavigate } from "react-router-dom";
import Button from "../../Button";

export default function LaunchingCitySection({ city }) {
  const navigate = useNavigate();

  return (
    <section
      id="launching-city"
      className="bg-[#F6F3EE] scroll-mt-20"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
        <h2 className="Livvic-Bold text-3xl sm:text-4xl text-[#001243]">
          FamLink in {city}
        </h2>
        <p className="text-gray-500 mt-3 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
          Matching is currently launching across {city}.
        </p>
        <div className="mt-8">
          <Button
            btnText={`+ Help launch ${city}`}
            className="bg-[#AEC4FF] text-[#001243] px-7 py-3.5"
            action={() => navigate("/joinNow")}
          />
        </div>
      </div>
    </section>
  );
}
