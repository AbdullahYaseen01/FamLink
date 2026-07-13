import React from 'react'
import { useNavigate } from 'react-router-dom'
import CustomButton from '../../Button'
import { Mail } from 'lucide-react'

const WaitlistUI = ({ city }) => {
    const navigate = useNavigate()
    return (
        <div className="relative h-[700px] overflow-hidden">

            {/* Layer 1 (bottom): Main background */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: "url('/waitlist_bg.png')", maskImage: "linear-gradient(to right, transparent 10px, black 10px)",
                    WebkitMaskImage: "linear-gradient(to right, transparent 10px, black 10px)", zIndex: 1
                }}
            />

            {/* Layer 2: Map image — right half only */}
            <img
                src="/waitlist_map.png"
                alt="map"
                className="absolute top-1/4 right-0 h-1/2 w-1/2 object-cover"
                style={{ zIndex: 0 }}
            />

            {/* Layer 3: Content */}
            <div className="relative flex justify-between items-center h-full px-8" style={{ zIndex: 2 }}>
                <div className="space-y-4 lg:space-y-6 max-w-lg w-full lg:w-1/2">
                    <h3 className="Livvic-SemiBold text-2xl sm:text-4xl text-[#1a2e1a] mb-1">
                        We're not in <span className='Livvic-SemiBold text-[#7499ff]'>{city}</span> yet
                    </h3>
                    <p className="text-base sm:text-lg lg:text-xl text-[#00000099] Livvic-Medium leading-relaxed">
                        We're growing fast! Join the waitlist and we'll let you know the moment nanny shares open up near you.
                    </p>
                    <CustomButton btnText={<>
                        <p className='flex gap-2 items-center'>
                            <Mail strokeWidth={2}/>
                            <span className='Livvic-SemiBold text-primary text-xl'>Join Waitlist</span>
                        </p>
                    </>} className='bg-[#AEC4FF] !px-6 !py-3 !rounded-xl' action={() => navigate(`/waitlist?city=${city}`)} />
                </div>
            </div>
        </div>
    )
}

export default WaitlistUI