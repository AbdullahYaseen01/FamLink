import React from "react";
import MetricCard from "../MetricCard";

const metrics = [
  {
    title: "Verified Providers",
    metric: "89+",
    subText: "Across all caregiving categories",
  },
  {
    title: "Families Served",
    metric: "158+",
    subText: "With personalized matches",
  },
  {
    title: "Provider Rating",
    metric: "4.8★",
    subText: "Average caregiver rating across the platform",
  },
];

function Metrics() {
  return (
    <div className="container py-12 sm:py-24 px-4 sm:px-0">
      <h2 className="Livvic-Bold text-4xl sm:text-5xl mt-6 sm:mt-12 text-center sm:text-left">
        Care Options That Fit Your Life
      </h2>
      <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 py-6">
        {metrics.map((metric) => (
          <MetricCard 
            key={metric.title} 
            title={metric.title} 
            metric={metric.metric} 
            subText={metric.subText}
          />
        ))}
      </div>
    </div>
  );
}

export default Metrics;