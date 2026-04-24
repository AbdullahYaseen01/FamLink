import React from 'react'

function MetricCard({title, subText, metric}) {
  return (
     <div className="rounded-2xl pl-4 sm:pl-6 pr-2 py-6 sm:py-8 bg-white w-full sm:w-[25rem] flex flex-col gap-2">
        <p className='text-[#787C85] Livvic-SemiBold text-base sm:text-lg'>{title}</p>
        <h1 className='Livvic-Bold text-4xl sm:text-6xl'>{metric}</h1>
         <p className='text-[#4A4F57] Livvic text-xl'>{subText}</p>
    </div>
  )
}

export default MetricCard