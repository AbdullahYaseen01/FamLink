import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { postPostJob } from "../Components/Redux/postJobSlice";
import { fireToastMessage } from "../toastContainer";
import { format, isToday, isYesterday } from "date-fns";

export const formatTimeRange = (startISO, endISO) => {
  const start = new Date(startISO);
  const end = new Date(endISO);

  const formattedStart = format(start, "hh:mm a");
  const formattedEnd = format(end, "hh:mm a");

  return `${formattedStart} - ${formattedEnd}`;
};


export function formatCreatedAt(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);

  if (isToday(date)) {
    return `Today, ${format(date, "hh:mm a")}`;
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, "hh:mm a")}`;
  } else {
    return `${format(date, "MMMM d")}, ${format(date, "hh:mm a")}`;
  }
}

export function parseHourlyRate(str) {
  const result = {};

  // Check for "$40+ per hour"
  const ratePlusMatch = str.match(/\$(\d+(?:\.\d+)?)\+/);
  if (ratePlusMatch) {
    result.min = parseFloat(ratePlusMatch[1]);
  } else {
    const rateRangeMatch = str.match(
      /\$(\d+(?:\.\d+)?)\s*-\s*\$(\d+(?:\.\d+)?)/
    );
    if (rateRangeMatch) {
      result.min = parseFloat(rateRangeMatch[1]);
      result.max = parseFloat(rateRangeMatch[2]);
    }
  }

  // Check for share range or share plus
  const shareRangeMatch = str.match(
    /\(each family pays \$([\d.]+)\s*-\s*\$([\d.]+)\)/
  );
  if (shareRangeMatch) {
    result.minShare = parseFloat(shareRangeMatch[1]);
    result.maxShare = parseFloat(shareRangeMatch[2]);
  } else {
    const sharePlusMatch = str.match(
      /\(each family pays \$(\d+(?:\.\d+)?)\+\)/
    );
    if (sharePlusMatch) {
      result.minShare = parseFloat(sharePlusMatch[1]);
    }
  }

  return result;
}

export function deparseHourlyRate(rateObj) {
  const { min, max, minShare, maxShare } = rateObj;

  const format = (num) =>
    Number.isInteger(num) ? `${num}` : num.toFixed(2);

  let result = "";

  if (min !== undefined && max !== undefined) {
    result = `$${format(min)} - $${format(max)} per hour`;
  } else if (min !== undefined) {
    result = `$${format(min)}+ per hour`;
  }

  if (minShare !== undefined && maxShare !== undefined) {
    result += ` (Each family pays $${format(minShare)} - $${format(
      maxShare
    )})`;
  } else if (minShare !== undefined) {
    result += ` (Each family pays $${format(minShare)}+)`;
  }

  return result;
}

export function convertAgeRanges(ageRanges) {
  const label = {
    "Infant": { min: 0, max: 1 },
    "Toddler": { min: 1, max: 3 },
    "Preschool": { min: 3, max: 5 },
    "School-age": { min: 3, max: null }
  };

  let min = Infinity;
  let max = null;

  ageRanges.forEach((age) => {
    const { min: minAge, max: maxAge } = label[age];

    min = Math.min(minAge, min);          // fix 1 & 2

    if (maxAge !== null) {
      max = max === null ? maxAge : Math.max(maxAge, max);  // fix 3
    }
  });

  return {
    min: min === Infinity ? null : min,
    max,
  };
}

export function resolveChildrenAges(formValues) {
  const ages = [];

  let i = 1;
  while (formValues[`Child${i}_age`] !== undefined) {
    const age = formValues[`Child${i}_age`];
    const unit = formValues[`Child${i}_unit`] || "years";

    const num = parseFloat(age);

    if (isNaN(num) || num <= 0) {
      fireToastMessage({
        type: "error",
        message: "Each child's age must be greater than 0",
      });
      return [];  // return empty to trigger the length === 0 guard below
    }

    const value = unit === "months" ? num / 12 : num;
    const label = `${age} ${unit === "months" ? "months" : "yrs"}`;

    ages.push({ label, value, unit });
    i++;
  }

  return ages;
}

export function findMatchingRate(hourlyRate) {
  const rangeData = [
    {
      name: "$10 - $15 per hour (Each family pays $5 - $7.50)",
      val: "$10 - $15 per hour (Each family pays $5 - $7.50)",
    },
    {
      name: "$15 - $20 per hour (Each family pays $7.50 - $10)",
      val: "$15 - $20 per hour (Each family pays $7.50 - $10)",
    },
    {
      name: "$20 - $25 per hour (Each family pays $10 - $12.50)",
      val: "$20 - $25 per hour (Each family pays $10 - $12.50)",
    },
    {
      name: "$25 - $30 per hour (Each family pays $12.50 - $15)",
      val: "$25 - $30 per hour (Each family pays $12.50 - $15)",
    },
    {
      name: "$30 - $35 per hour (Each family pays $15 - $17.50)",
      val: "$30 - $35 per hour (Each family pays $15 - $17.50)",
    },
    {
      name: "$35 - $40 per hour (Each family pays $17.50 - $20)",
      val: "$35 - $40 per hour (Each family pays $17.50 - $20)",
    },
    {
      name: "$40+ per hour (Each family pays $20+)",
      val: "$40+ per hour (Each family pays $20+)",
    },
  ];

  const format = (num) => Number(num).toFixed(2).replace(/\.00$/, "");

  if (!hourlyRate) return "N/A"; // 🔒 Guard against undefined/null

  if (!hourlyRate.max && !hourlyRate.maxShare) {
    const target = `$${format(
      hourlyRate.min
    )}+ per hour (Each family pays $${format(hourlyRate.minShare)}+)`;
    return rangeData.find((option) => option.val === target)?.name || "N/A";
  } else {
    const target = `$${format(hourlyRate.min)} - $${format(
      hourlyRate.max
    )} per hour (Each family pays $${format(hourlyRate.minShare)} - $${format(
      hourlyRate.maxShare
    )})`;
    return rangeData.find((option) => option.val === target)?.name || "N/A";
  }
}

export function findMatchingRate1(hourlyRate) {
  if (!hourlyRate || !hourlyRate.min) return "N/A";
  const step2Data = [
    { name: "$10 - $15 per hour" },
    { name: "$15 - $20 per hour" },
    { name: "$20 - $25 per hour" },
    { name: "$25 - $30 per hour" },
    { name: "$30 - $35 per hour" },
    { name: "$35+ per hour" },
  ];
  const min = hourlyRate.min;
  const max = hourlyRate.max;

  if (!max) {
    if (min >= 35) return "$35+ per hour";
    return "N/A";
  }

  const format = (num) => `$${Number(num).toFixed(0)}`;
  const label = `${format(min)} - ${format(max)} per hour`;

  // Check if label exists in step2Data
  const match = step2Data.find((item) => item.name === label);
  return match?.name || "N/A";
}

export const checkEmptyFields = (data, fields) => {
  const emptyFields = [];

  fields.forEach((field) => {
    const value = data[field];
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      emptyFields.push(field);
    }
  });

  return emptyFields;
};

export const useJobSubmitter = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submitJob = async ({ jobType, formValues, textAreaValue }) => {
    try {
      const { data } = await dispatch(
        postPostJob({
          jobType,
          [jobType]: {
            ...formValues,
            jobDescription: textAreaValue,
          },
        })
      ).unwrap();

      fireToastMessage({
        success: true,
        message: data.message,
      });

      navigate(-1);
    } catch (err) {
      fireToastMessage({
        type: "error",
        message: err.message || "Something went wrong",
      });
    }
  };

  return { submitJob };
};

export const formatKey = (key) => {
  return key
    .replace(/([A-Z])/g, " $1") // add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()); // capitalize first letter
};

export const step2Data = [
  { name: "Your home", val: "Your home" },
  { name: "Other family’s home", val: "Other family’s home" },
  { name: "Rotating between homes", val: "Rotating between homes" },
  { name: "Neutral location", val: "Neutral location" },
];

export const step3Data = [
  {
    name: "Montessori Attachment parenting RIE",
    val: "Montessori Attachment parenting RIE",
  },
  { name: "Authoritative Permissive", val: "Authoritative Permissive" },
  { name: "Strict", val: "Strict" },
  { name: "Flexible", val: "Flexible" },
];

export const step4Data = [
  { name: "Childcare Light housekeeping", val: "Childcare Light housekeeping" },
  { name: "Meal preparation", val: "Meal preparation" },
  { name: "Transportation", val: "Transportation" },
  { name: "Educational activities", val: "Educational activities" },
  { name: "Outdoor play Errands", val: "Outdoor play Errands" },
  { name: "Grocery shopping", val: "Grocery shopping" },
];

export const step5Data = [
  {
    name: "$10 - $15 per hour (Each family pays $5 - $7.50)",
    val: "$10 - $15 per hour (Each family pays $5 - $7.50)",
  },
  {
    name: "$15 - $20 per hour (Each family pays $7.50 - $10)",
    val: "$15 - $20 per hour (Each family pays $7.50 - $10)",
  },
  {
    name: "$20 - $25 per hour (Each family pays $10 - $12.50)",
    val: "$20 - $25 per hour (Each family pays $10 - $12.50)",
  },
  {
    name: "$25 - $30 per hour (Each family pays $12.50 - $15)",
    val: "$25 - $30 per hour (Each family pays $12.50 - $15)",
  },
  {
    name: "$30 - $35 per hour (Each family pays $15 - $17.50)",
    val: "$30 - $35 per hour (Each family pays $15 - $17.50)",
  },
  {
    name: "$35 - $40 per hour (Each family pays $17.50 - $20)",
    val: "$35 - $40 per hour (Each family pays $17.50 - $20)",
  },
  {
    name: "$40+ per hour (Each family pays $20+)",
    val: "$40+ per hour (Each family pays $20+)",
  },
];

export const step6Data = [
  { name: "No pets", val: "No pets" },
  { name: "Dog(s)", val: "Dog(s)" },
  { name: "Cat(s)", val: "Cat(s)" },
  { name: "Small animals", val: "Small animals" },
  { name: "Birds", val: "Birds" },
];

export const step7Data = [
  { name: "Regular meetings", val: "Regular meetings" },
  { name: "Group chat", val: "Group chat" },
  { name: "Shared calendar", val: "Shared calendar" },
  { name: "Email updates", val: "Email updates" },
  { name: "Phone calls", val: "Phone calls" },
];

export const step8Data = [
  { name: "Family members", val: "Family members" },
  { name: "Backup nanny service", val: "Backup nanny service" },
  { name: "Friends or neighbors", val: "Friends or neighbors" },
  { name: "Local daycare", val: "Local daycare" },
  { name: "No backup options", val: "No backup options" },
];

export const step9Data = [
  { name: "Very involved", val: "Very involved" },
  { name: "Moderately involved", val: "Moderately involved" },
  { name: "Minimal involvement", val: "Minimal involvement" },
];

export const step10Data = [
  { name: "Nap times", val: "Nap times" },
  { name: "Outdoor play", val: "Outdoor play" },
  { name: "Educational activities", val: "Educational activities" },
  { name: "Structured meal times", val: "Structured meal times" },
  { name: "Storytime", val: "Storytime" },
  { name: "Arts and crafts", val: "Arts and crafts" },
];

export const step11Data = [
  { name: "Screen time limits", val: "Screen time limits" },
  { name: "Dietary restrictions", val: "Dietary restrictions" },
  { name: "Behavior expectations", val: "Behavior expectations" },
  { name: "Hygiene practices", val: "Hygiene practices" },
  { name: "Chore responsibilities", val: "Chore responsibilities" },
];

export const step12Data = [
  { name: "Food allergies", val: "Food allergies" },
  { name: "Environmental allergies", val: "Environmental allergies" },
  { name: "Asthma Medication needs", val: "Asthma Medication needs" },
  { name: "None", val: "None" },
];

export const step13Data = [
  { name: "Very flexible", val: "Very flexible" },
  { name: "Somewhat flexible", val: "Somewhat flexible" },
  { name: "Not flexible", val: "Not flexible" },
];

export const prefer = [
  { name: "Full-time" },
  { name: "Part-time" },
  { name: "Occasional" },
  { name: "Flexible" },
];

export const hourlyData = [
  { name: "$10 - $15 per hour" },
  { name: "$15 - $20 per hour" },
  { name: "$20 - $25 per hour" },
  { name: "$25 - $30 per hour" },
  { name: "$30 - $35 per hour" },
  { name: "$35+ per hour" },
];

export const navItemsArticles = [
  "Community Resources",
  "Tips for Parents",
  "Tips For Nannies",
  "Platform Tips",
  "Special Needs Care",
  "Do It Yourself",
  "Nanny Activities",
  "News",
];
