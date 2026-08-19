import { useCallback, useEffect, useState, useMemo } from "react";
import cameraIcons from "../../assets/images/cameraIcon.png";
import { Form, Input, Checkbox, Select, Button, TimePicker, Spin, DatePicker } from "antd";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import { fireToastMessage } from "../../toastContainer";
import { editUserThunk, updateNannyProfileThunk } from "../Redux/authSlice";
import { fetchNannyByIdThunk } from "../Redux/nannyData";
import Autocomplete from "react-google-autocomplete";
import OptionSelector from "../subComponents/LanguageSelector";
import dayjs from "dayjs";
const getValidDate = (dateString) => {
  if (!dateString) return null;
  const cleanDate = typeof dateString === 'string' ? dateString.replace(/^"|"$/g, "") : dateString;
  const d = dayjs(cleanDate);
  return d.isValid() ? d : null;
};
import { NannyProfile } from "../subComponents/profileCard";
import SelectChildrenAge from "../../NewComponents/NannyShare/PostANannyShare/SelectChildrenAge";
import { resolveChildrenAges, normalizeHourlyBudget } from "../../Config/helpFunction";
import {
  RATE_OPTIONS,
  parseRange,
  toBudget,
} from "../../NewComponents/NannyShare/OnboardingKit/fields/rateOptions";
import { zipFromPlace } from "../../Config/serviceArea";
import {
  ChevronLeft,
  User,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Languages,
  Briefcase,
  Baby,
  FileText,
  Camera,
  Save,
  X,
  Users,
  Sparkles,
  Eye,
  EyeOff,
  Info,
  Circle,
  CheckCircle2
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { OPTIONS } from "../../NewComponents/NannyShare/NannyShareWizard/onboardingConfig";
import {
  NANNY_FAMILY_FIELDS,
  NANNY_FAMILY_LEGACY_FIELDS,
  NANNY_JOB_FIELDS,
  NANNY_JOB_LEGACY_FIELDS,
  byDbKey,
  dbKeysOf,
} from "../../Config/profileFields";

/*
 * Every nannyProfile key each path writes, including the extra keys one question
 * fans out to. Computed from the manifest rather than hand-listed, so a question
 * added to a flow lands on the right side of the split without anyone
 * remembering to update a second list.
 */
const JOB_KEYS = dbKeysOf([...NANNY_JOB_FIELDS, ...NANNY_JOB_LEGACY_FIELDS]);
const FAMILY_KEYS = dbKeysOf([...NANNY_FAMILY_FIELDS, ...NANNY_FAMILY_LEGACY_FIELDS]);
import { OPTIONS as FAMILY_FLOW_OPTIONS } from "../../NewComponents/NannyShare/NannyFamilyWizard/onboardingConfig";
import { OTHER_LABEL } from "../../NewComponents/NannyShare/OnboardingKit/fields/questionState";

/*
 * The rate the wizard offers, and whatever this profile already holds.
 *
 * The local RANGES table these replace carried an hourly half whose tokens
 * happened to match RATE_OPTIONS, and a weekly half that neither questionnaire
 * has ever offered. A weekly token stored in sharedRate becomes a budget of
 * 800-900 per HOUR once it reaches toBudget, which is why the weekly option is
 * gone rather than carried forward.
 *
 * A stored token that is no longer offered is appended rather than dropped, so a
 * profile written by the retired flow still shows its own answer instead of an
 * empty select.
 */
const rateOptionsWith = (list, stored) =>
  stored && !list.some((o) => o.value === stored)
    ? [...list, { value: stored, label: stored }]
    : list;

const nearestRateToken = (list, min) => {
  if (!Number.isFinite(min)) return undefined;
  let best;
  let bestGap = Infinity;
  for (const o of list) {
    const gap = Math.abs(parseRange(o.value).low - min);
    if (gap < bestGap) {
      bestGap = gap;
      best = o.value;
    }
  }
  return best;
};

/*
 * The stored token for one half of the rate, across every shape it has been
 * written in. Tokens win over budget, and budget wins over the family-shaped
 * hourlyBudget this form's own Family path used to store on nannies.
 *
 * Module scope rather than inside the component, so the hydration effect does
 * not depend on a function identity that changes on every render.
 */
const storedRateToken = (profile, which, list) => {
  const token = profile?.[which];
  if (token) return token;

  const fromBudget = profile?.budget?.[which]?.min;
  if (Number.isFinite(fromBudget)) return nearestRateToken(list, fromBudget);

  /* Legacy only, and only for the shared half: the retired control stored a
     family-shaped hourlyBudget whose total is what both families pay together —
     which is the shared-care rate. Solo has no equivalent. */
  if (which === "sharedRate") {
    const legacy = normalizeHourlyBudget(profile?.hourlyBudget);
    if (Number.isFinite(legacy?.min)) return nearestRateToken(list, legacy.min);
  }
  return undefined;
};

const parseTime = (time) => {
  return time ? dayjs(time) : null;
};

/* ── Option lists come from the questionnaire, not from a copy of it ─────────
 *
 * The nanny share questions below used to be hand-written <Select.Option>
 * blocks built against the retired six-step CompleteProfile flow. The wizard
 * that replaced it stores different strings for four of them — an en dash in
 * the capacity ranges, "Rotating between homes" where this form said "Rotating
 * homes", "Meal / snack preparation" where it said "Meal/snack prep", and
 * "Infants — 0–1" where it said "Infants (0–1)". A nanny who finished the
 * questionnaire and opened this form would find those questions blank, and
 * saving would then overwrite the answers with nothing.
 *
 * Reading OPTIONS makes that unrepeatable: one authoritative list, and this
 * form follows it. onboardingConfig.js is a plain data module with no React or
 * wizard imports, so pulling it in here costs nothing. Same fix, same reason,
 * as LoginAsFamily/editProfile.jsx.
 */
const renderOptions = (options) =>
  options.map((option) => (
    <Select.Option key={option} value={option}>
      {option}
    </Select.Option>
  ));

const toSelectOptions = (options) =>
  options.map((option) => ({ value: option, label: option }));

/* Q14 minus "Other", plus the two this form used to offer that the
 * questionnaire does not.
 *
 * "Other" is dropped because there is nowhere here to say what it was: the
 * questionnaire pairs that pill with a free-text certificationsSpecify, and
 * this form has no input for it. Offering a pill that can only ever store the
 * word "other" would be worse than not offering it — and a nanny who chose it
 * in the questionnaire keeps the answer, because this control writes back the
 * values it holds rather than only the ones it renders. The other two are kept
 * so certifications recorded by the older controls stay editable instead of
 * rendering unselected. */
const CERTIFICATION_OPTIONS = [
  ...OPTIONS.q14.filter((option) => option !== OTHER_LABEL),
  "Water Safety",
  "Special Needs",
];

/*
 * Answers the retired flow wrote that today's options phrase differently.
 *
 * Case alone is not enough for these: OnboardingOptionSelector lowercased
 * whatever it stored, so a case-insensitive match rescues "childcare" and
 * "flexible" on its own — but "rotating homes", "meal/snack prep" and the
 * parenthetical age labels are different strings, not different capitalisation.
 * Without the map they render as unmatched and the next save drops them.
 *
 * Keys are the stored value, lowercased and trimmed.
 */
const LEGACY_ANSWER_ALIASES = {
  "1-2": "1–2",
  "2-3": "2–3",
  "3-4": "3–4",
  "rotating homes": "Rotating between homes",
  "meal/snack prep": "Meal / snack preparation",
  "nap/bedtime routines": "Nap / bedtime routines",
  "infants (0–1)": "Infants — 0–1",
  "toddlers (1–3)": "Toddlers — 1–3",
  "preschool (3–5)": "Preschool — 3–5",
  "school-age (5+)": "School-age — 5+",
  /* This form used to phrase Q1 of the "already with a family" questionnaire
     with a parenthetical; that questionnaire's mockup uses an em dash and a
     contraction. The wizard's string wins — it is the one being written from
     now on — and this rescues everything already stored the old way. */
  "myself (bringing my own child)": "Myself — I'm bringing my own child",
};

/* Every option string either questionnaire can store, flattened once.
 *
 * Both are here because this one form edits both halves: `userType` switches
 * between the "looking for a job" questions and the "already with a family"
 * ones, and a nanny can have answers from either. Values are unique per question
 * and the handful that repeat ("Yes", "No", "Flexible", "Other") are the same
 * string either way, so one flat list is unambiguous. */
const ALL_WIZARD_OPTIONS = [
  ...new Set([
    ...Object.values(OPTIONS).flat(),
    ...Object.values(FAMILY_FLOW_OPTIONS).flat(),
    ...CERTIFICATION_OPTIONS,
  ]),
];

/*
 * Match a stored answer to its canonical option: legacy alias first, then an
 * exact-ignoring-case lookup, then the value untouched.
 *
 * Returning the value unchanged when nothing matches is deliberate — free text
 * (skills, custom certifications) goes through the same helper.
 */
const canonicalise = (value, options = ALL_WIZARD_OPTIONS) => {
  if (Array.isArray(value)) return value.map((item) => canonicalise(item, options));
  if (typeof value !== "string") return value;

  const key = value.trim().toLowerCase();
  const aliased = LEGACY_ANSWER_ALIASES[key];
  if (aliased) return aliased;

  return options.find((option) => option.toLowerCase().trim() === key) ?? value;
};

export default function EditProfileNanny() {
  const { TextArea } = Input;
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [form] = Form.useForm();
  /* Both questionnaires write this as a constant — neither the specs nor the
     mockups have an hourly/weekly toggle — so this form stops offering one. */
  const rateType = "hourly";
  const [nannyProfile, setNannyProfile] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [userType, setUserType] = useState(
    (user?.goal === "Nanny adding a share" || user?.goal === "I already work with a family and want to add a share") ? "Family" : "Job"
  );
  const formValues = Form.useWatch([], form);

  /*
   * Which questions the ACTIVE path asks, and how it words them.
   *
   * The form used to know about the two paths in exactly one place — a ternary
   * swapping one section heading — and rendered Flow 1's questions to both kinds
   * of nanny. So a nanny who already works with a family was asked for a weekly
   * availability grid she is never asked for at onboarding, and offered a
   * certification list containing two entries her questionnaire deliberately
   * omits.
   *
   * Reading the manifest instead means the path selector re-derives the labels,
   * the option sets and which sections exist at all. Answers to questions both
   * flows ask stay mounted, so toggling does not discard them.
   */
  const isJob = userType === "Job";
  const activeFields = isJob ? NANNY_JOB_FIELDS : NANNY_FAMILY_FIELDS;
  const activeLegacy = isJob ? NANNY_JOB_LEGACY_FIELDS : NANNY_FAMILY_LEGACY_FIELDS;
  const activeByKey = useMemo(
    () => byDbKey([...activeFields, ...activeLegacy]),
    [activeFields, activeLegacy],
  );

  /* Does the active path ask this at all? The gate for every section and field
     below, so a nanny is never shown the other path's question. */
  const asks = (dbKey) => activeByKey.has(dbKey);

  /* The rate question's two sub-labels. Both flows word them identically, but
     they are read from the active one rather than retyped here. */
  const rateEntry = activeByKey.get("sharedRate");
  const RATE_LABELS = {
    shared: rateEntry?.sharedLabel || "Shared-care rate",
    solo: rateEntry?.soloLabel || "Solo-care rate",
  };
  const labelFor = (dbKey) => activeByKey.get(dbKey)?.label || "";
  const optionsFor = (dbKey) => activeByKey.get(dbKey)?.options || [];

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchNannyByIdThunk(user._id))
        .unwrap()
        .then((res) => {
          setNannyProfile(res?.nannyProfile || {});
          if (res?.nannyProfile?.imageFile) {
            setImage(prev => prev || res?.nannyProfile?.imageFile);
          }
        })
        // The form falls back to the auth user's own fields, so a failed fetch
        // leaves it usable rather than empty — nothing to report to the user.
        .catch(() => {});
    }
  }, [user?._id, dispatch]);


  const languageSkills = user?.additionalInfo?.find((info) => info.key === "language")?.value;
  const defaultCheckedValues = languageSkills?.option;
  // let parsedLanguages = nannyProfile?.languages;
  // if (typeof parsedLanguages === 'string') { try { parsedLanguages = JSON.parse(parsedLanguages); } catch (e) { } }
  // const defaultCheckedValues = parsedLanguages || languageSkills?.option;

  const daysOfWeek = useMemo(() => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], []);
  const specificDaysAndTime = user?.additionalInfo?.find((info) => info.key === "specificDaysAndTime")?.value;
  const salaryExp = user?.additionalInfo?.find((info) => info.key === "salaryExp")?.value;
  const jobDescription = user?.additionalInfo.find((i) => i.key === "jobDescription")?.value;

  const [daysState, setDaysState] = useState(() => {
    return daysOfWeek.reduce((acc, day) => {
      const specificDay = specificDaysAndTime?.[day];
      acc[day] = {
        checked: !!specificDay,
        start: specificDay?.start || null,
        end: specificDay?.end || null,
      };
      return acc;
    }, {});
  });

  useEffect(() => {
    if (user) {
      const getInfo = (key, profileKey) => {
        const fallback = user?.additionalInfo?.find((info) => info.key === key)?.value;
        let val;
        if (nannyProfile && Object.keys(nannyProfile).length > 0) {
          val = nannyProfile[profileKey];
        } else {
          val = fallback?.option !== undefined ? fallback.option : fallback;
        }
        
        // If it's an array with one string, extract the string
        if (Array.isArray(val) && val.length === 1 && typeof val[0] === 'string') {
          val = val[0];
        }

        /* Rehydrate a stored answer into the option this form renders.
           Documents written by the retired flows hold lowercase strings, so
           without this every one of them would render unmatched — and the
           questionnaires' own Title Case answers pass through untouched.
           ALL_WIZARD_OPTIONS now covers both halves of this form, so the
           "already with a family" strings no longer need spelling out here. */
        return canonicalise(val);
      };


      form.setFieldsValue({
        fullName: user.name,
        gender: user.gender,
        age: user.age,
        location: user.location?.format_location,
        zipCode: user.zipCode,
        language: defaultCheckedValues,
        firstChild: salaryExp?.firstChild,
        secChild: salaryExp?.secChild,
        thirdChild: salaryExp?.thirdChild,
        fourthChild: salaryExp?.fourthChild,
        fiveOrMoreChild: salaryExp?.fiveOrMoreChild,

        avaiForWorking: getInfo("avaiForWorking", "careType"),
        availability: getValidDate(getInfo("availability", "startAvailability")),
        experience: getInfo("experience", "careExperience"),
        ageGroupsExp: getInfo("ageGroupsExp", "ageGroupsExp") || (nannyProfile?.preferredAges ? nannyProfile.preferredAges.map(a => a.label) : undefined),
        additionalDetails: getInfo("additionalDetails", "additionalDetails"),
        jobDescription: nannyProfile?.bio || jobDescription,
        certifications: getInfo("certifications", "certifications"),
        customCertifications: getInfo("customCertifications", "customCertifications"),
        skills: getInfo("skills", "skills"),

        // Onboarding / Nanny Share Fields
        shareExperience: getInfo("shareExperience", "shareExperience"),
        multiFamilyComfort: getInfo("multiFamilyComfort", "multiFamilyComfort"),
        childrenCapacity: getInfo("childrenCapacity", "childrenCapacity"),
        /* Stored as [{label, min, max}]; the Select works in labels. Canonicalised
           because the retired flow wrote the parenthetical form. */
        preferredAges: canonicalise(
          getInfo("preferredAges", "preferredAges")?.map(a => typeof a === 'object' ? a.label : a)
        ) || undefined,
        workSetup: getInfo("workSetup", "workSetup"),
        responsibilities: getInfo("responsibilities", "responsibilities"),
        householdHelp: getInfo("householdHelp", "householdHelp"),
        hasTransport: getInfo("hasTransport", "hasTransport"),
        backgroundCheck: getInfo("backgroundCheck", "backgroundCheck"),
        sharedRate: storedRateToken(nannyProfile, "sharedRate", RATE_OPTIONS.shared),
        soloRate: storedRateToken(nannyProfile, "soloRate", RATE_OPTIONS.solo),
        forWho: getInfo("forWho", "forWho"),
        numberOfChildren: getInfo("numberOfChildren", "numberOfChildren"),
        childrenAges: getInfo("childrenAges", "childrenAges"),
        currentSchedule: getInfo("currentSchedule", "currentSchedule"),
        joinTiming: getInfo("joinTiming", "joinTiming"),
        together: getInfo("together", "together"),
        whereCare: getInfo("whereCare", "whereCare"),
      });

      let parsedSpecificDays = nannyProfile?.specificDays;
      if (typeof parsedSpecificDays === 'string') {
        try {
          parsedSpecificDays = JSON.parse(parsedSpecificDays);
        } catch (e) { }
      }

      const sourceDays = parsedSpecificDays || specificDaysAndTime;

      setDaysState(daysOfWeek.reduce((acc, day) => {
        const specificDay = sourceDays?.[day];
        acc[day] = {
          checked: !!specificDay?.checked || !!specificDay,
          start: specificDay?.start || null,
          end: specificDay?.end || null,
        };
        return acc;
      }, {}));
    }
  }, [user, form, daysOfWeek, specificDaysAndTime, salaryExp, defaultCheckedValues, jobDescription, nannyProfile]);

  useEffect(() => {
    if (user) {
      const addr = user?.location?.format_location || "";
      setLocation(addr);
      if (user?.location) {
        setCoordinates(
          user?.location
        );
      }
    }
  }, [user, form]);


  const handleCheckboxChange = useCallback((day) => {
    setDaysState((prevState) => ({
      ...prevState,
      [day]: {
        ...prevState[day],
        checked: !prevState[day].checked,
      },
    }));
  }, []);

  const handleTimeChange = (day, field, time) => {
    setDaysState((prevState) => ({
      ...prevState,
      [day]: {
        ...prevState[day],
        [field]: time ? time.toISOString() : null,
      },
    }));
  };

  const [image, setImage] = useState(user.imageUrl);
  const [file, setFile] = useState(null);

  const handleImageChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const imageUrl = URL.createObjectURL(selectedFile);
      setImage(imageUrl);
      setFile(selectedFile);
    }
  };

  const options2 = [
    { value: "Full-time", label: "Full-time" },
    { value: "Part-time", label: "Part-time" },
    { value: "Occasional", label: "Occasional" },
    { value: "Weekends only", label: "Weekends only" },
    { value: "Nights only", label: "Nights only" },
    { value: "Flexible", label: "Flexible" },
  ];

  const defaultCheckedValues2 = user?.additionalInfo.find((info) => info.key === "avaiForWorking")?.value.option;

  const options3 = [
    { value: "Immediate", label: "Immediate" },
    { value: "Start within 1 month", label: "Start within 1 month" },
    { value: "Flexible start date", label: "Flexible start date" },
  ];

  const defaultCheckedValues3 = user?.additionalInfo.find((info) => info.key === "availability")?.value.option;

  const options4 = [
    { value: "Less than 1 year", label: "Less than 1 year" },
    { value: "1-3 years", label: "1-3 years" },
    { value: "3-5 years", label: "3-5 years" },
    { value: "Over 5 years", label: "Over 5 years" },
  ];

  const defaultCheckedValues4 = user?.additionalInfo.find((info) => info.key === "experience")?.value.option;

  const options5 = [
    "Infants (0-1)",
    "Toddlers (1-3)",
    "Preschoolers (3-5)",
    "School-aged (5+)",
  ];

  /* The certifications list moved to CERTIFICATION_OPTIONS, which follows the
     questionnaire's Q14. The five strings that used to live here matched
     nothing the app has ever stored for this field — the retired flow wrote
     "CPR Certified" and "First Aid Certified" — so a nanny's certifications
     rendered unselected however they got there. The two this form offered and
     the questionnaire does not are kept on the end of that list. */

  const defaultCheckedValues5 = user?.additionalInfo?.find((info) => info.key === "ageGroupsExp")?.value?.option;
  const defaultCheckedValues6 = user?.additionalInfo?.find((info) => info.key === "additionalDetails")?.value?.option;
  // let parsedAgeGroups = nannyProfile?.ageGroupsExp;
  // if (typeof parsedAgeGroups === 'string') { try { parsedAgeGroups = JSON.parse(parsedAgeGroups); } catch (e) { } }
  // const defaultCheckedValues5 = parsedAgeGroups || user?.additionalInfo?.find((info) => info.key === "ageGroupsExp")?.value?.option;

  // let parsedDetails = nannyProfile?.additionalDetails;
  // if (typeof parsedDetails === 'string') { try { parsedDetails = JSON.parse(parsedDetails); } catch (e) { } }
  // const defaultCheckedValues6 = parsedDetails || user?.additionalInfo?.find((info) => info.key === "additionalDetails")?.value?.option;

  const transformObject = (obj) => {
    const additionalInfo = [];
    const keysSet = new Set();
    for (const key in obj) {
      const value = obj[key];
      if (Array.isArray(value) && value.length > 0) {
        if (value.some((item) => item !== undefined) && !keysSet.has(key)) {
          additionalInfo.push({ key: key, value: { option: value } });
          keysSet.add(key);
        }
      }
    }
    const additionalProperties = [
      "language", "avaiForWorking", "availability", "experience", "ageGroupsExp", "additionalDetails",
      "shareExperience", "multiFamilyComfort", "childrenCapacity", "preferredAges", "workSetup",
      "responsibilities", "householdHelp", "hasTransport", "backgroundCheck", "sharedRate", "soloRate", "rateType",
      // "agesCare", "currentSchedule", "forWho", "numChildrenCare", "joinTiming", "together"
    ];
    additionalProperties.forEach((prop) => {
      if (obj[prop] !== undefined && obj[prop] !== null) {
        if (Array.isArray(obj[prop]) && obj[prop].some((item) => item !== undefined) && !keysSet.has(prop)) {
          additionalInfo.push({ key: prop, value: { option: obj[prop] } });
          keysSet.add(prop);
        } else if (typeof obj[prop] === "string" && !keysSet.has(prop)) {
          additionalInfo.push({ key: prop, value: { option: obj[prop] } });
          keysSet.add(prop);
        }
      }
    });
    return { additionalInfo };
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const transformedObject = transformObject(values);
      const salaryExpObject = {
        key: "salaryExp",
        value: {
          firstChild: values.firstChild,
          secChild: values.secChild,
          thirdChild: values.thirdChild,
          fourthChild: values.fourthChild,
          fiveOrMoreChild: values.fiveOrMoreChild,
        },
      };

      const salaryRange = {
        key: "salaryRange",
        value: {
          min: Number(values.firstChild),
          max: Number(values.fiveOrMoreChild),
        },
      };

      const checkedDays = Object.entries(daysState)
        .filter(([_, data]) => data.checked === true)
        .reduce((acc, [day, data]) => {
          acc[day] = {
            checked: true,
            start: data.start ? parseTime(data.start).toISOString() : null,
            end: data.end ? parseTime(data.end).toISOString() : null,
          };
          return acc;
        }, {});

      const selectedDays = Object.entries(checkedDays);
      /*
       * Only the job-seeking path is asked for a weekly schedule — its Q6. The
       * "already with a family" questionnaire never collects one, so requiring
       * it of everyone forced those nannies to invent an answer before the form
       * would let them save anything at all.
       */
      if (isJob && selectedDays.length === 0) {
        setLoading(false);
        return fireToastMessage({ type: "error", message: "At least one day must be selected." });
      }

      const invalidDays = selectedDays
        .filter(([_, { start, end }]) => {
          const parsedStart = parseTime(start);
          const parsedEnd = parseTime(end);
          return !parsedStart || !parsedEnd || !parsedStart.isValid() || !parsedEnd.isValid() || parsedStart.isSame(parsedEnd) || parsedEnd.isBefore(parsedStart);
        })
        .map(([day]) => day);

      if (invalidDays.length > 0) {
        setLoading(false);
        return fireToastMessage({ type: "error", message: `Invalid times for: ${invalidDays.join(", ")}` });
      }

      const specificDaysAndTime = { key: "specificDaysAndTime", value: checkedDays };
      let addData = transformedObject;
      addData?.additionalInfo.push(salaryExpObject, specificDaysAndTime, salaryRange);
      if (values.jobDescription) {
        addData.additionalInfo.push({ key: "jobDescription", value: values.jobDescription });
      }

      const formData = new FormData();
      const finalZipCode = values.zipCode || zipCode;

      if (!finalZipCode) {
        setLoading(false);
        return fireToastMessage({ type: "error", message: "Zip code is missing." });
      }

      if (coordinates) {
        formData.append("location", JSON.stringify(coordinates));
      }
      formData.append("zipCode", finalZipCode);
      if (values.fullName) formData.append("name", values.fullName);
      if (values.email) formData.append("email", values.email);
      if (values.age) formData.append("age", values.age);
      if (values.gender) formData.append("gender", values.gender);
      // We no longer save additionalInfo to the User schema to avoid duplicates and adhere to Single Source of Truth
      if (file) formData.append("imageUrl", file);

      // --- Nanny Profile Specific Data ---
      const nannyFormData = new FormData();
      const nannyFieldsMap = {
        shareExperience: "shareExperience",
        multiFamilyComfort: "multiFamilyComfort",
        childrenCapacity: "childrenCapacity",
        workSetup: "workSetup",
        responsibilities: "responsibilities",
        householdHelp: "householdHelp",
        hasTransport: "hasTransport",
        backgroundCheck: "backgroundCheck",
        sharedRate: "sharedRate",
        soloRate: "soloRate",
        availability: "startAvailability",
        experience: "careExperience",
        jobDescription: "bio",
        // The dynamic fields moved from additionalInfo
        language: "languages",
        ageGroupsExp: "ageGroupsExp",
        certifications: "certifications",
        customCertifications: "customCertifications",
        skills: "skills",
        forWho: "forWho",
        numberOfChildren: "numberOfChildren",
        childrenAges: "childrenAges",
        currentSchedule: "currentSchedule",
        joinTiming: "joinTiming",
        together: "together",
        whereCare: "whereCare",
      };

      const resolvedAges = resolveChildrenAges(values);

      formData.append("goal", userType === "Job" ? "Looking for nanny share job" : "Nanny adding a share");
      nannyFormData.append("hasFamily", userType === "Job" ? false : true);

      /*
       * Only the active path's keys, and only the ones this form actually holds.
       *
       * This loop used to run over every entry regardless of path, so a Flow 1
       * nanny's save wrote forWho, currentSchedule, joinTiming, together and
       * whereCare as empty strings, and a Flow 2 nanny's wiped shareExperience,
       * multiFamilyComfort, childrenCapacity and workSetup. antd keeps the values
       * of unmounted Form.Items, so hiding the other path's controls in Task 3.2
       * was not enough on its own — excluding the keys here is what makes the
       * hiding true in the database. It is also the mechanism behind "family
       * questions only appear in family profiles": a job-seeking nanny should not
       * carry the other path's keys at all, not even empty ones.
       */
      const activeKeys = isJob ? JOB_KEYS : FAMILY_KEYS;

      Object.entries(nannyFieldsMap).forEach(([formField, dbField]) => {
        if (formField === "childrenAges" || formField === "numberOfChildren") return;
        if (!activeKeys.has(dbField)) return;
        const val = values[formField] !== undefined && values[formField] !== null ? values[formField] : "";
        if (Array.isArray(val)) {
          nannyFormData.append(dbField, JSON.stringify(val));
        } else {
          nannyFormData.append(dbField, val);
        }
      });
      if (userType !== "Job") {
        nannyFormData.append("numberOfChildren", resolvedAges.length);
        nannyFormData.append("childrenAges", JSON.stringify(resolvedAges));
      }

      /*
       * The rate, in the two shapes that matter.
       *
       * sharedRate and soloRate are the tokens the profile screens print.
       * budget.sharedRate.{min,max} is the ONLY nanny rate path
       * share.controller.js reads — and this form has never written it. So a
       * nanny who edited her rate did not disappear from narrowed rate searches;
       * she kept matching her OLD band, because budget still held whatever
       * onboarding put there. A silent matching failure rather than a visible one.
       *
       * Written only when the chosen shared rate is one the wizard offers. A
       * profile from the retired flow can hold a WEEKLY token like "800-900", and
       * feeding that through toBudget would claim 800-900 per hour — dropping her
       * out of every narrowed search she currently survives by having no budget
       * at all. Choosing a real rate is what repairs such a profile.
       */
      const sharedIsWizardRate = RATE_OPTIONS.shared.some((o) => o.value === values.sharedRate);
      if (sharedIsWizardRate) {
        nannyFormData.append("rateType", rateType);
        nannyFormData.append("budget", JSON.stringify(toBudget(values.sharedRate, values.soloRate)));
      }
      /*
       * careType, handled outside the map because each path answers it with a
       * different control — and because it is QUERIED, not merely displayed.
       * share.controller.js lowercases the browser's schedule selection and
       * matches it with $in, builds its admin facet list from
       * distinct("careType"), and matches it directly on the share lookup.
       *
       * The job path has its own Availability select. The mirror path has none:
       * its questionnaire derives careType from the schedule question, exactly as
       * toCareType() does in that flow's payload builder. Mapping the hidden
       * control for both paths meant a Flow 2 save wrote this field from whatever
       * antd had retained for a control that was not on screen.
       *
       * Lowercased on the way out for the same reason the questionnaires do it:
       * a Title Case value matches no filter and the profile silently disappears
       * from every schedule-narrowed browse. Rehydration is unaffected, because
       * canonicalise() matches the stored value case-insensitively.
       */
      const careTypeAnswer = isJob ? values.avaiForWorking : values.currentSchedule;
      nannyFormData.append("careType", String(careTypeAnswer || "").toLowerCase());

      /* Flow 1's Q6, and the section is only rendered for that path — so sending
         it from the other one would store a schedule nobody was asked for. */
      if (isJob) nannyFormData.append("specificDays", JSON.stringify(checkedDays));

      /*
       * Flow 1's Q4, as labelled age bands. The mirror flow writes the same key
       * from its own Q8 as point ranges derived from the ages of the children who
       * could join — a different question with a different meaning — so this
       * control's answer must not be sent from that path.
       */
      if (isJob && values.preferredAges) {
        const preferredAgesArray = values.preferredAges.map(ageStr => {
          let min = 0;
          let max = 0;
          if (ageStr.includes("0–1") || ageStr.includes("0-1")) { min = 0; max = 1; }
          else if (ageStr.includes("1–3") || ageStr.includes("1-3")) { min = 1; max = 3; }
          else if (ageStr.includes("3–5") || ageStr.includes("3-5")) { min = 3; max = 5; }
          else if (ageStr.includes("5+")) { min = 5; max = 18; }
          return { label: ageStr, min, max };
        });
        nannyFormData.append("preferredAges", JSON.stringify(preferredAgesArray));
      }

      /* nannyProfile.hourlyRate used to be written here. Nothing in the app
         reads it — every other hourlyRate in the codebase is on a job-listing
         document, a different schema — so it was a dead write, and toBudget now
         produces the shape the filter actually queries. */

      const nannySalaryExpObject = {
        firstChild: values.firstChild,
        secChild: values.secChild,
        thirdChild: values.thirdChild,
        fourthChild: values.fourthChild,
        fiveOrMoreChild: values.fiveOrMoreChild,
      };
      nannyFormData.append("salaryExp", JSON.stringify(nannySalaryExpObject));

      const nannySalaryRangeObject = {
        min: Number(values.firstChild),
        max: Number(values.fiveOrMoreChild),
      };
      nannyFormData.append("salaryRange", JSON.stringify(nannySalaryRangeObject));

      if (file) nannyFormData.append("imageFile", file);

      // Fire both dispatches
      await dispatch(updateNannyProfileThunk(nannyFormData)).unwrap();
      const { status } = await dispatch(editUserThunk(formData)).unwrap();

      if (status === 200) {
        // Fetch fresh data immediately so the UI is perfectly in sync
        const freshData = await dispatch(fetchNannyByIdThunk(user._id)).unwrap();
        setNannyProfile(freshData?.nannyProfile || {});

        fireToastMessage({ success: true, message: "User updated successfully" });
        navigate("/nanny");
      }
    } catch (error) {
      fireToastMessage({ success: false, message: "Failed to update user." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLocation(user?.location?.format_location || "");
    setZipCode(user?.zipCode || "");
  }, [user]);

  return (
    <div className="min-h-screen pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-12 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <NavLink to="/nanny" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-primary" />
            </NavLink>
            <h1 className="Livvic-Bold text-xl md:text-2xl text-primary">Edit Profile</h1>
          </div>
          <div className="flex items-center gap-3">
            <NavLink to="/nanny">
              <button className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full border border-gray-200 text-secondary Livvic-SemiBold hover:bg-gray-50 transition-all">
                <X className="w-4 h-4" /> Discard
              </button>
            </NavLink>
            <button
              onClick={() => form.submit()}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2 rounded-full bg-primary text-primary Livvic-SemiBold shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              {loading ? <Spin size="small" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4 md:mt-8 mb-12">
        <Form onFinish={onFinish} form={form} layout="vertical" autoComplete="off" className="space-y-6 md:space-y-8">

          {/* User Type Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="Livvic-Bold text-lg text-primary mb-2">User Type</h2>
            <p className="text-secondary text-sm mb-6 Livvic">This determines the type of questions we show in your profile.</p>
            <p className="Livvic-SemiBold text-primary mb-4">Which best describes you?</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div
                onClick={() => setUserType('Job')}
                className={`p-6 border rounded-xl cursor-pointer transition-all ${userType === 'Job' ? 'border-[#AEC4FF] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex flex-col h-full relative">
                  <div className="absolute top-0 left-0">
                    {userType === 'Job' ? <CheckCircle2 className="w-6 h-6 text-primary" fill="white" /> : <Circle className="w-6 h-6 text-gray-300" />}
                  </div>
                  <div className="flex flex-col items-center text-center mt-2">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-[#AEC4FF]" />
                    </div>
                    <h3 className="Livvic-SemiBold text-primary mb-2">I'm looking for a nanny share position</h3>
                    <p className="text-sm text-gray-500 Livvic">Get matched with two compatible families and explore nanny share roles.</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setUserType('Family')}
                className={`p-6 border rounded-xl cursor-pointer transition-all ${userType === 'Family' ? 'border-[#AEC4FF] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex flex-col h-full relative">
                  <div className="absolute top-0 left-0">
                    {userType === 'Family' ? <CheckCircle2 className="w-6 h-6 text-green-600" fill="white" /> : <Circle className="w-6 h-6 text-gray-300" />}
                  </div>
                  <div className="flex flex-col items-center text-center mt-2">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="Livvic-SemiBold text-primary mb-2">I already work with a family and want to add a share</h3>
                    <p className="text-sm text-gray-500 Livvic">Add a second family to your current role and earn more through nanny share.</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-primary Livvic-Medium h-fit self-center lg:self-center mt-4 lg:mt-0">
                <Info className="w-5 h-5 shrink-0 text-[#AEC4FF]" />
                <p>Tip: You can update your user type anytime. Your profile and matches will update automatically.</p>
              </div>
            </div>
          </section>

          {/* Profile Photo & Live Preview Grid */}
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
            {/* Profile Photo Section */}
            <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100 lg:w-[320px] shrink-0">
              <h2 className="Livvic-Bold text-lg text-primary mb-6">
                Profile Photo
              </h2>
              <div className="flex flex-col items-center text-center gap-6">
                <div className="relative group">
                  {image ? (
                    <img src={image} className="w-32 h-32 rounded-3xl object-cover shadow-sm transition-transform group-hover:scale-105" alt="profile" />
                  ) : (
                    <div className="w-32 h-32 rounded-3xl bg-[#AEC4FF] flex items-center justify-center text-[#0D134C] text-4xl Livvic-Bold shadow-sm">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <label className="absolute -bottom-2 -right-2 bg-white text-primary w-10 h-10 rounded-full border border-gray-200 shadow-md cursor-pointer hover:scale-110 transition-transform flex items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />
                    <Camera className="w-4 h-4 text-primary" />
                  </label>
                </div>

                <label className="w-full">
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  <div className="w-full py-2.5 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-primary Livvic-SemiBold cursor-pointer hover:bg-gray-50 transition-colors">
                    <Camera className="w-4 h-4" /> Change Photo
                  </div>
                </label>

                <p className="Livvic text-secondary text-sm">Clear, friendly photos help families trust you more.</p>
              </div>
            </section>

            {/* Live Preview Section */}
            <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100 flex-1 flex flex-col min-w-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="Livvic-Bold text-lg text-primary flex items-center gap-2">
                    {showPreview ? (
                      <Eye className="w-5 h-5 text-primary cursor-pointer hover:text-[#AEC4FF] transition-colors" onClick={() => setShowPreview(false)} />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" onClick={() => setShowPreview(true)} />
                    )}
                    Live Preview
                  </h2>
                  <p className="text-secondary text-sm Livvic mt-1">This is how families will see your profile.</p>
                </div>
              </div>

              {showPreview ? (
                <div className="w-full mt-2 pointer-events-none">
                  <NannyProfile
                    name={formValues?.fullName || user?.name}
                    img={image || user?.image}
                    location={{ format_location: location || user?.location?.format_location }}
                    experience={formValues?.experience || nannyProfile?.careExperience}
                    goal={userType === 'Job' ? "Looking for a Nanny Share Position" : "Already work with a family"}
                    rateType={rateType}
                    sharedRate={formValues?.sharedRate || nannyProfile?.sharedRate}
                    soloRate={formValues?.soloRate || nannyProfile?.soloRate}
                    ages={userType === 'Job' ? (formValues?.preferredAges?.map(age => typeof age === 'object' ? age.label : age) || nannyProfile?.preferredAges?.map(age => typeof age === 'object' ? age.label : age)) : ((formValues && resolveChildrenAges(formValues)?.length > 0) ? resolveChildrenAges(formValues) : nannyProfile?.childrenAges)}
                    careType={userType === 'Job' ? (formValues?.avaiForWorking || nannyProfile?.careType || "Nanny Share") : (formValues?.currentSchedule || nannyProfile?.currentSchedule)}
                    schedule={daysState}
                    distance={nannyProfile?.careDistance}
                    start={formValues?.availability || nannyProfile?.startAvailability}
                    hasFamily={userType === 'Family'}
                    childrenCount={formValues?.numberOfChildren || nannyProfile?.numberOfChildren}
                    whereCare={formValues?.whereCare || nannyProfile?.whereCare}
                    status={undefined}
                    handleMatchRequest={() => { }}
                  />
                </div>
              ) : (
                <div className="flex-1 w-full bg-[#f8f9fb] rounded-xl flex items-center justify-center border border-gray-100 p-4 text-gray-400 Livvic-Medium">
                  Preview is hidden. Click the eye icon to view.
                </div>
              )}
            </section>
          </div>

          {/* Basic Information Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="Livvic-Bold text-lg text-primary mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item name="fullName" initialValue={user?.name} label="Full Name">
                <Input className="Livvic-Medium rounded-xl border-gray-200 py-3 focus:border-primary" />
              </Form.Item>

              <Form.Item name="email" initialValue={user?.email} label="Email Address">
                <Input type="email" className="Livvic-Medium rounded-xl border-gray-200 py-3 focus:border-primary" />
              </Form.Item>

              <Form.Item name="location" label="Address" rules={[{ required: true }]}>
                <div className="relative">
                  <Spin spinning={loading} size="small">
                    <Autocomplete
                      apiKey={import.meta.env.VITE_GOOGLE_KEY}
                      style={{
                        width: "100%",
                        borderRadius: "10px",
                        padding: "0.75rem",
                        border: "1px solid #D6DDEB",
                      }}
                      value={location || ""}
                      onPlaceSelected={async (place) => {
                        const address = place.formatted_address;
                        const components = place?.address_components || [];

                        const get = (type) =>
                          components.find((c) => c.types.includes(type))?.long_name || "";

                        const extractedCity =
                          get("locality") || get("administrative_area_level_2");

                        const extractedNeighborhood =
                          get("neighborhood") ||
                          get("sublocality_level_1") ||
                          get("sublocality");

                        const lat = place?.geometry?.location?.lat();
                        const lng = place?.geometry?.location?.lng();

                        const locationObj = {
                          type: "Point",
                          coordinates: [lng, lat],
                          format_location: address,
                          city: extractedCity,
                          neighborhood: extractedNeighborhood,
                        };
                        const displayValue = extractedNeighborhood !== extractedCity ? `${extractedCity}, ${extractedNeighborhood}` : extractedCity;
                        setLocation(displayValue)
                        setCoordinates(locationObj);
                        form.setFieldsValue({
                          location: displayValue,
                        });

                        // Move the zip with the address, or it keeps pointing at where the
                        // user used to live. Google omits postal_code from city-level picks.
                        const placeZip = await zipFromPlace(place);
                        if (placeZip) {
                          setZipCode(placeZip);
                          form.setFieldsValue({ zipCode: placeZip });
                        }
                        setLoading(false);
                      }}
                      onChange={(e) => {
                        setLocation(e.target.value);
                      }}
                      options={{
                        types: ["geocode"],
                        componentRestrictions: { country: "us" },
                      }}
                    />
                  </Spin>
                  <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                </div>
              </Form.Item>

              <Form.Item name="zipCode" label="Zip Code">
                <Input
                  className="Livvic-Medium rounded-xl border-gray-200 py-3"
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </Form.Item>

              <Form.Item name="gender" initialValue={user?.gender} label="Gender">
                <Select className="h-12 w-full rounded-xl border-gray-200" placeholder="Select gender">
                  <Select.Option value="Male">Male</Select.Option>
                  <Select.Option value="Female">Female</Select.Option>
                  <Select.Option value="Other">Other</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="age" initialValue={user?.age} label="Age">
                <Input type="number" className="Livvic-Medium rounded-xl border-gray-200 py-3" />
              </Form.Item>
            </div>
          </section>

          {/* Languages Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="Livvic-Bold text-lg text-primary mb-6 flex items-center gap-2">
              <Languages className="w-5 h-5" /> Languages
            </h2>
            {/* Nine languages and Other, from whichever questionnaire this nanny
                took. The six-item list this replaces meant a nanny who chose
                Japanese, Korean, Tagalog or ASL at onboarding lost it the first
                time she opened this form. */}
            <p className="text-secondary text-sm mb-4 Livvic">{labelFor("languages")}</p>
            <OptionSelector
              options={optionsFor("languages")}
              form={form}
              defaultCheckedValues={defaultCheckedValues}
              name="language"
            />
          </section>

          {/* Weekly Schedule Section */}
          {/* Flow 1's Q6. The mirror questionnaire asks joinTiming and
              startAvailability instead and never collects a day grid. */}
          {asks("specificDays") && (
            <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="Livvic-Bold text-lg text-primary flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Weekly Availability
                </h2>
                <p className="text-secondary text-sm Livvic">Select your working days and hours.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {daysOfWeek.map((day) => (
                  <div key={day} className={`p-4 rounded-2xl border transition-all ${daysState[day].checked ? 'bg-primary/5 border-primary shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <Checkbox checked={daysState[day].checked} onChange={() => handleCheckboxChange(day)}>
                        <span className="Livvic-SemiBold text-primary">{day}</span>
                      </Checkbox>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <TimePicker
                          value={daysState[day].start ? parseTime(daysState[day].start) : null}
                          placeholder="Start"
                          onChange={(time) => handleTimeChange(day, "start", time)}
                          disabled={!daysState[day].checked}
                          format="h:mm A"
                          className="rounded-lg border-gray-200 w-full"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <TimePicker
                          value={daysState[day].end ? parseTime(daysState[day].end) : null}
                          placeholder="End"
                          onChange={(time) => handleTimeChange(day, "end", time)}
                          disabled={!daysState[day].checked}
                          format="h:mm A"
                          className="rounded-lg border-gray-200 w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}



          {/* Nanny Share Pricing Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="Livvic-Bold text-lg text-primary mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Nanny Share Rates
            </h2>
            <p className="text-secondary text-sm mb-6 Livvic">Set your nanny share specific rates for shared care vs solo care.</p>

            {/* The two halves of the wizard's one rate question, worded as it
                words them. Both paths get both: the mirror questionnaire asks
                the same question as its Q19. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item name="sharedRate" label={RATE_LABELS.shared}>
                <Select
                  className="h-12 w-full rounded-xl"
                  placeholder="Select shared rate range"
                  options={rateOptionsWith(RATE_OPTIONS.shared, formValues?.sharedRate)}
                />
              </Form.Item>

              <Form.Item name="soloRate" label={RATE_LABELS.solo}>
                <Select
                  className="h-12 w-full rounded-xl"
                  placeholder="Select solo rate range"
                  options={rateOptionsWith(RATE_OPTIONS.solo, formValues?.soloRate)}
                />
              </Form.Item>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="Livvic-SemiBold text-primary mb-4 text-[16px]">Salary Expectations (Rate Per Child)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <Form.Item name="firstChild" label="1st Child ($)">
                  <Input type="number" className="h-12 w-full rounded-xl border-gray-200" placeholder="e.g. 20" />
                </Form.Item>
                <Form.Item name="secChild" label="2nd Child ($)">
                  <Input type="number" className="h-12 w-full rounded-xl border-gray-200" placeholder="e.g. 25" />
                </Form.Item>
                <Form.Item name="thirdChild" label="3rd Child ($)">
                  <Input type="number" className="h-12 w-full rounded-xl border-gray-200" placeholder="e.g. 30" />
                </Form.Item>
                <Form.Item name="fourthChild" label="4th Child ($)">
                  <Input type="number" className="h-12 w-full rounded-xl border-gray-200" placeholder="e.g. 35" />
                </Form.Item>
                <Form.Item name="fiveOrMoreChild" label="5+ Children ($)">
                  <Input type="number" className="h-12 w-full rounded-xl border-gray-200" placeholder="e.g. 40" />
                </Form.Item>
              </div>
            </div>
          </section>

          {/* Share Compatibility / Current Setup Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            {userType === 'Job' ? (
              <>
                <h2 className="Livvic-Bold text-lg text-primary mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5" /> Nanny Share Compatibility
                </h2>
                <p className="text-secondary text-sm mb-6 Livvic">Configure your preferences and experiences with nanny sharing.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item name="shareExperience" label="Have you worked in a nanny share before?">
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(OPTIONS.q1)}
                    </Select>
                  </Form.Item>

                  <Form.Item name="multiFamilyComfort" label="Are you comfortable caring for children from multiple families?">
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(OPTIONS.q2)}
                    </Select>
                  </Form.Item>

                  <Form.Item name="childrenCapacity" label="What number of children are you most comfortable caring for?">
                    <Select className="h-12 w-full rounded-xl" placeholder="Select capacity">
                      {renderOptions(OPTIONS.q3)}
                    </Select>
                  </Form.Item>

                  <Form.Item name="workSetup" label="Are you okay working in:">
                    <Select className="h-12 w-full rounded-xl" placeholder="Select work setup">
                      {renderOptions(OPTIONS.q5)}
                    </Select>
                  </Form.Item>

                  <Form.Item name="preferredAges" className="col-span-1 md:col-span-2" label="What ages do you prefer to work with?">
                    <Select
                      mode="multiple"
                      className="w-full rounded-xl"
                      placeholder="Select preferred ages"
                      options={toSelectOptions(OPTIONS.q4)}
                    />
                  </Form.Item>
                </div>
              </>
            ) : (
              <>
                <h2 className="Livvic-Bold text-lg text-primary mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5" /> Current Setup
                </h2>
                <p className="text-secondary text-sm mb-6 Livvic">Tell us about the family you currently work with.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Every option below comes from the questionnaire's config
                      rather than a second copy of the same strings, for the
                      reason spelled out at the top of this file: a form that
                      offers different wording from the questionnaire renders
                      the stored answer as unmatched, and the next save drops
                      it. */}
                  <Form.Item name="forWho" label="Who is this nanny share for?">
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(FAMILY_FLOW_OPTIONS.q1)}
                    </Select>
                  </Form.Item>

                  <SelectChildrenAge
                    form={form}
                    opt={[1, 2, 3, 4, 5]}
                    selectedValue={form.getFieldValue("numberOfChildren")}
                    handleSelectChange={(val) => form.setFieldsValue({ numberOfChildren: val })}
                    numberOfChildren={nannyProfile?.numberOfChildren}
                    childrenAges={
                      nannyProfile?.childrenAges?.length
                        ? nannyProfile.childrenAges.map((age) => age.label).join(", ")
                        : ""
                    }
                  />
                  <Form.Item name="numberOfChildren" hidden><Input /></Form.Item>

                  <Form.Item name="whereCare" label="Where would care take place?">
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(FAMILY_FLOW_OPTIONS.q9)}
                    </Select>
                  </Form.Item>

                  <Form.Item name="currentSchedule" label="What schedule are you currently working?">
                    <Select className="h-12 w-full rounded-xl" placeholder="Select schedule">
                      {renderOptions(FAMILY_FLOW_OPTIONS.q5)}
                    </Select>
                  </Form.Item>

                  <Form.Item name="joinTiming" label="When would a second family join?">
                    <Select className="h-12 w-full rounded-xl" placeholder="Select timing">
                      {renderOptions(FAMILY_FLOW_OPTIONS.q6)}
                    </Select>
                  </Form.Item>

                  <Form.Item name="together" label="Would the children be together at the same time?">
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(FAMILY_FLOW_OPTIONS.q7)}
                    </Select>
                  </Form.Item>

                  {/*
                    * The seven hardcoded budget options that used to sit here are
                    * gone. They were the FAMILY question's option strings, stored
                    * in the family field hourlyBudget — so a nanny who already
                    * works with a family answered a family's question, and the
                    * sharedRate/soloRate pair her own questionnaire asks for was
                    * left empty. The rates section above now serves both paths.
                    */}
                </div>
              </>
            )}
          </section>

          {/* Expectations, Roles & Transport Section */}
          {/* Flow 1's Q8-Q11. None of the four is asked by the mirror
              questionnaire, so the whole section belongs to one path. */}
          {asks("responsibilities") && (
            <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="Livvic-Bold text-lg text-primary mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Expectations & Safety
              </h2>
              <p className="text-secondary text-sm mb-6 Livvic">Add trust signals and clarify what chores or responsibilities you support.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item name="hasTransport" label="Do you have your own reliable transportation?">
                  <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                    {renderOptions(OPTIONS.q10)}
                  </Select>
                </Form.Item>

                <Form.Item name="backgroundCheck" label="Are you open to undergoing a background check?">
                  <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                    {renderOptions(OPTIONS.q11)}
                  </Select>
                </Form.Item>

                <Form.Item name="householdHelp" className="col-span-1 md:col-span-2" label="Are you open to helping with household tasks?">
                  <Select className="h-12 w-full rounded-xl" placeholder="Select option">
                    {renderOptions(OPTIONS.q9)}
                  </Select>
                </Form.Item>

                <Form.Item name="responsibilities" className="col-span-1 md:col-span-2" label="What would your role typically include?">
                  <Select
                    mode="multiple"
                    className="w-full rounded-xl"
                    placeholder="Select typical responsibilities"
                    options={toSelectOptions(OPTIONS.q8)}
                  />
                </Form.Item>
              </div>
            </section>
          )}

          {/* Professional Details Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="Livvic-Bold text-lg text-primary mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5" /> Professional Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Writes careType, which the mirror questionnaire derives from its
                  own schedule question instead — so showing it there would give
                  one field two controls. */}
              {asks("careType") && (
                <Form.Item name="avaiForWorking" initialValue={defaultCheckedValues2} label="Availability">
                  <Select className="h-12 w-full rounded-xl" options={options2} />
                </Form.Item>
              )}
              <Form.Item name="availability" label={labelFor("startAvailability")} initialValue={getValidDate(defaultCheckedValues3)}>
                <DatePicker className="h-12 w-full rounded-xl border-gray-200" format="MMMM D, YYYY" />
              </Form.Item>
              <Form.Item name="experience" initialValue={defaultCheckedValues4} label={labelFor("careExperience")}>
                <Select className="h-12 w-full rounded-xl" options={options4} />
              </Form.Item>
            </div>

            <div className="mt-8">
              <label className="Livvic-Bold text-primary mb-4 block flex items-center gap-2">
                <Baby className="w-4 h-4" /> Age Group Experience
              </label>
              <OptionSelector options={options5} defaultCheckedValues={defaultCheckedValues5} form={form} name="ageGroupsExp" />
            </div>

            <div className="mt-8">
              <label className="Livvic-Bold text-primary mb-4 block flex items-center gap-2">
                <FileText className="w-4 h-4" /> {labelFor("bio")}
              </label>
              <Form.Item name="jobDescription" initialValue={user?.additionalInfo.find((i) => i.key === "jobDescription")?.value}>
                <TextArea
                  rows={6}
                  placeholder="Tell families about your approach, skills, and background..."
                  className="rounded-2xl border-gray-200 p-4 Livvic focus:ring-primary/20 transition-all"
                />
              </Form.Item>
            </div>

            <div className="mt-8">
              {/* Flow 1's list carries ECE and TrustLine; the mirror flow's
                  deliberately does not. Offering the wrong one is how a nanny
                  ends up recorded as holding a certification her own
                  questionnaire never asked about. */}
              <label className="Livvic-Bold text-primary mb-4 block">{labelFor("certifications")}</label>
              <OptionSelector
                options={optionsFor("certifications")}
                defaultCheckedValues={nannyProfile?.certifications || defaultCheckedValues6}
                form={form}
                name="certifications"
              />
            </div>

            {/* Flow 1's Q15 and Q16. The mirror questionnaire asks neither. */}
            {asks("customCertifications") && (
              <div className="mt-8">
                <label className="Livvic-Bold text-primary mb-4 block">{labelFor("customCertifications")}</label>
                <Form.Item name="customCertifications" initialValue={nannyProfile?.customCertifications}>
                  <Input placeholder="E.g., Water Safety Instructor" className="Livvic-Medium rounded-xl border-gray-200 py-3 focus:border-primary" />
                </Form.Item>
              </div>
            )}

            {asks("skills") && (
              <div className="mt-8">
                <label className="Livvic-Bold text-primary mb-4 block">{labelFor("skills")}</label>
                <Form.Item name="skills" initialValue={nannyProfile?.skills}>
                  <Input placeholder="E.g., Sign Language, Music" className="Livvic-Medium rounded-xl border-gray-200 py-3 focus:border-primary" />
                </Form.Item>
              </div>
            )}
          </section>

          {/* Bottom Actions for Mobile */}
          <div className="md:hidden flex flex-col gap-3 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary Livvic-Bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Save Changes
            </button>
            <NavLink to="/nanny/profile">
              <button className="w-full bg-white text-secondary border border-gray-200 Livvic-Bold py-4 rounded-2xl">
                Discard Changes
              </button>
            </NavLink>
          </div>
        </Form>
      </div>
    </div>
  );
}
