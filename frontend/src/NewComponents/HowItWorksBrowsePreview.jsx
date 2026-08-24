import MatchCard, { convertChatMatchToMatchCardProps } from "../NannyShare/Onboarding/MatchCard";

const FAMILY_BROWSE = [
  {
    type: "Family",
    props: {
      id: "hiw_fam_1",
      name: "Priya N.",
      hasNanny: false,
      childrenCount: 1,
      ages: [2],
      careType: "part-time care",
      schedule: { monday: true, tuesday: true, wednesday: true, thursday: false, friday: false, saturday: false, sunday: false },
      location: { city: "Piedmont" },
      sharedRate: "~$18/hr per family",
      soloRate: "$36/hr",
      hosting: "rotating between homes",
      start: "Flexible",
    },
  },
  {
    type: "Family",
    props: {
      id: "hiw_fam_2",
      name: "Elena R.",
      hasNanny: true,
      childrenCount: 2,
      ages: [1, 4],
      careType: "full-time care",
      schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
      location: { city: "Rockridge" },
      sharedRate: "~$20/hr per family",
      soloRate: "$40/hr",
      hosting: "my home",
      start: "April 2027",
    },
  },
];

const NANNY_BROWSE = [
  {
    type: "Family",
    props: {
      id: "hiw_nanny_fam_1",
      name: "Jordan K.",
      hasNanny: false,
      childrenCount: 1,
      ages: [0.5],
      careType: "full-time care",
      schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
      location: { city: "Oakland" },
      sharedRate: "~$19/hr per family",
      soloRate: "$38/hr",
      hosting: "other family's home",
      start: "Flexible",
    },
  },
  {
    type: "Family",
    props: {
      id: "hiw_nanny_fam_2",
      name: "Camille B.",
      hasNanny: true,
      childrenCount: 2,
      ages: [3, 5],
      careType: "part-time care",
      schedule: { monday: false, tuesday: true, wednesday: true, thursday: true, friday: false, saturday: false, sunday: false },
      location: { city: "Berkeley" },
      sharedRate: "~$17/hr per family",
      soloRate: "$34/hr",
      hosting: "rotating between homes",
      start: "May 2027",
    },
  },
];

export default function HowItWorksBrowsePreview({ audience = "family" }) {
  const list = audience === "caregiver" ? NANNY_BROWSE : FAMILY_BROWSE;
  return (
    <div className="p-3 sm:p-4 bg-white flex flex-col gap-3">
      {list.map((m, i) => (
        <MatchCard
          key={m.props.id}
          match={convertChatMatchToMatchCardProps(m, i)}
          isInteractive={false}
        />
      ))}
    </div>
  );
}
