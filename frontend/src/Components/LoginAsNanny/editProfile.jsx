import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Form, Input, Checkbox, Select, TimePicker, Spin, DatePicker } from "antd";
import { useDispatch, useSelector } from "react-redux";
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
  Home,
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
import { OPTIONS, ERROR_MESSAGES as JOB_ERROR_MESSAGES, EXCLUSIVE as JOB_EXCLUSIVE, WORK_SETUP_ALIASES } from "../../NewComponents/NannyShare/NannyShareWizard/onboardingConfig";
import {
  NANNY_FAMILY_FIELDS,
  NANNY_FAMILY_LEGACY_FIELDS,
  NANNY_JOB_FIELDS,
  NANNY_JOB_LEGACY_FIELDS,
  byDbKey,
  dbKeysOf,
  optionsWithStored,
  toArray,
  toSingleton,
  toSingletonArray,
} from "../../Config/profileFields";
import PhotoUploadField from "../../NewComponents/NannyShare/OnboardingKit/fields/PhotoUploadField";
import TagInputField from "../../NewComponents/NannyShare/OnboardingKit/fields/TagInputField";
import SharedRateCards from "../../NewComponents/NannyShare/OnboardingKit/fields/SharedRateCards";
import SoloRateRangeField from "../../NewComponents/NannyShare/OnboardingKit/fields/SoloRateRangeField";
import { FormErrorAnchor, handleFinishFailed, SCROLL_TO_FIRST_ERROR } from "../subComponents/formErrors";

/*
 * Every nannyProfile key each path writes, including the extra keys one question
 * fans out to. Computed from the manifest rather than hand-listed, so a question
 * added to a flow lands on the right side of the split without anyone
 * remembering to update a second list.
 */
const JOB_KEYS = dbKeysOf([...NANNY_JOB_FIELDS, ...NANNY_JOB_LEGACY_FIELDS]);
const FAMILY_KEYS = dbKeysOf([...NANNY_FAMILY_FIELDS, ...NANNY_FAMILY_LEGACY_FIELDS]);
import {
  CONDITIONAL as FAMILY_FLOW_CONDITIONAL,
  ERROR_MESSAGES as FAMILY_FLOW_ERROR_MESSAGES,
  EXCLUSIVE as FAMILY_FLOW_EXCLUSIVE,
  OPTIONS as FAMILY_FLOW_OPTIONS,
  WHERE_CARE_ALIASES,
} from "../../NewComponents/NannyShare/NannyFamilyWizard/onboardingConfig";
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
  ]),
];

/*
 * Match a stored answer to its canonical option: legacy alias first, then an
 * exact-ignoring-case lookup, then the value untouched.
 *
 * Returning the value unchanged when nothing matches is deliberate — free text
 * (skills, custom certifications) goes through the same helper.
 */
const canonicalise = (value, options = ALL_WIZARD_OPTIONS, aliases = LEGACY_ANSWER_ALIASES) => {
  if (Array.isArray(value)) return value.map((item) => canonicalise(item, options, aliases));
  if (typeof value !== "string") return value;

  const key = value.trim().toLowerCase();
  const aliased = aliases[key];
  if (aliased) return aliased;

  return options.find((option) => option.toLowerCase().trim() === key) ?? value;
};

const splitList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (!value || typeof value !== "string") return [];
  return value.split(/[,|\n]/).map((item) => item.trim()).filter(Boolean);
};

const joinList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join(", ");
  return typeof value === "string" ? value.trim() : "";
};

const dayEntry = (source, day) => {
  if (!source || typeof source !== "object") return null;
  const titled = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  return source[day] ?? source[day.toLowerCase()] ?? source[titled] ?? null;
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

  const previewChildrenAges = resolveChildrenAges(formValues || {}, { silent: true });
  const previewJobCareType = (() => {
    const raw = formValues?.avaiForWorking || nannyProfile?.careType;
    if (!raw || /nanny\s*share/i.test(String(raw))) return undefined;
    return raw;
  })();

  const rateEntry = activeByKey.get("sharedRate");
  const RATE_LABELS = {
    shared: rateEntry?.sharedLabel || "Shared-care rate",
    solo: rateEntry?.soloLabel || "Solo rate",
  };
  const fieldLabel = (text) => (
    <span className="Livvic-SemiBold text-gray-500">{text}</span>
  );
  const labelFor = (dbKey) => fieldLabel(activeByKey.get(dbKey)?.label || "");
  const optionsFor = (dbKey) => activeByKey.get(dbKey)?.options || [];
  const placeholderFor = (dbKey) => activeByKey.get(dbKey)?.placeholder || "";
  const requiredRules = (dbKey, { array } = {}) => {
    const field = activeByKey.get(dbKey);
    if (!field?.required) return undefined;
    const messages = isJob ? JOB_ERROR_MESSAGES : FAMILY_FLOW_ERROR_MESSAGES;
    const message = messages[field.qid] || "This field is required";
    if (array || field.isMulti) {
      return [{ required: true, type: "array", min: 1, message }];
    }
    return [{ required: true, message }];
  };
  const requiredText = (message) => [{ required: true, whitespace: true, message }];
  /* Section titles come from the active wizard's step names, not a second
     vocabulary. The family form already groups this way; driving both paths
     from the manifest means renaming a step in onboardingConfig.js retitles
     this form too. */
  const groupFor = (dbKey) => activeByKey.get(dbKey)?.group || "";
  /* The question a "Yes" reveals: its field, its options and the label to put
     on it. Read from the manifest so the form reveals exactly what the wizard
     reveals, on exactly the same answer. */
  const revealOf = (dbKey) => activeByKey.get(dbKey)?.reveal || null;
  const isRevealed = (dbKey) => {
    const reveal = revealOf(dbKey);
    return Boolean(reveal) && formValues?.[dbKey] === reveal.when;
  };

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchNannyByIdThunk(user._id))
        .unwrap()
        .then((res) => {
          setNannyProfile(res?.nannyProfile || {});
          if (res?.nannyProfile?.imageFile) {
            setImageUrl((prev) => prev || res?.nannyProfile?.imageFile);
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
  const jobDescription = user?.additionalInfo.find((i) => i.key === "jobDescription")?.value;

  const [daysState, setDaysState] = useState(() => {
    return daysOfWeek.reduce((acc, day) => {
      const specificDay = dayEntry(specificDaysAndTime, day);
      acc[day] = {
        checked: specificDay?.checked === true,
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
        if (nannyProfile && Object.keys(nannyProfile).length > 0 && nannyProfile[profileKey] !== undefined) {
          val = nannyProfile[profileKey];
        } else {
          val = fallback?.option !== undefined ? fallback.option : fallback;
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
        language: toArray(getInfo("language", "languages")) || toArray(defaultCheckedValues),

        avaiForWorking: getInfo("avaiForWorking", "careType"),
        availability: getValidDate(getInfo("availability", "startAvailability")),
        experience: getInfo("experience", "careExperience"),
        additionalDetails: getInfo("additionalDetails", "additionalDetails"),
        jobDescription: nannyProfile?.bio || jobDescription,
        certifications: isJob
          ? splitList([
              ...(toArray(getInfo("certifications", "certifications")) || []),
              getInfo("certificationsSpecify", "certificationsSpecify"),
            ]).filter((value) => String(value).toLowerCase() !== "other")
          : toArray(getInfo("certifications", "certifications")),
        certificationsSpecify: getInfo("certificationsSpecify", "certificationsSpecify"),
        languagesSpecify: getInfo("languagesSpecify", "languagesSpecify"),
        customCertifications: splitList(getInfo("customCertifications", "customCertifications")),
        skills: splitList(getInfo("skills", "skills")),

        // Onboarding / Nanny Share Fields
        shareExperience: getInfo("shareExperience", "shareExperience"),
        multiFamilyComfort: getInfo("multiFamilyComfort", "multiFamilyComfort"),
        childrenCapacity: getInfo("childrenCapacity", "childrenCapacity"),
        /* Stored as [{label, min, max}]; the Select works in labels. Canonicalised
           because the retired flow wrote the parenthetical form. */
        preferredAges: canonicalise(
          getInfo("preferredAges", "preferredAges")?.map(a => typeof a === 'object' ? a.label : a)
        ) || undefined,
        workSetup: canonicalise(getInfo("workSetup", "workSetup"), OPTIONS.q5, {
          ...LEGACY_ANSWER_ALIASES,
          ...WORK_SETUP_ALIASES,
        }),
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
        whereCare: canonicalise(getInfo("whereCare", "whereCare"), FAMILY_FLOW_OPTIONS.q9, {
          ...LEGACY_ANSWER_ALIASES,
          ...WHERE_CARE_ALIASES,
        }),

        /* Flow 2's step 1-5 answers, none of which this form could show before. */
        agesCare: toArray(getInfo("agesCare", "agesCare")),
        flexibility: getInfo("flexibility", "flexibility"),
        matchDistance: getInfo("matchDistance", "matchDistance"),
        matchFit: getInfo("matchFit", "matchFit"),
        schoolDaycare: getInfo("schoolDaycare", "schoolDaycare"),
        childrenSchools: splitList(getInfo("childrenSchools", "childrenSchools")),
        allergies: splitList(getInfo("allergies", "allergies")),
        typicalDay: getInfo("typicalDay", "typicalDay"),
        routinesPreferences: getInfo("routinesPreferences", "routinesPreferences"),
        expectations: getInfo("expectations", "expectations"),
        /* Asked as a single select, stored as a one-element array. Unwrap so
           the Select holds "Flexible", not ["Flexible"] — wrapping that again
           on save is what produced [[ 'Flexible' ]] and the CastError. */
        communicationChoice: toSingleton(
          getInfo("communicationPreference", "communicationPreference"),
        ),
        matchMattersMost: getInfo("matchMattersMost", "matchMattersMost"),
        hasPets: getInfo("hasPets", "hasPets"),
        petTypes: toArray(getInfo("petTypes", "petTypes")),
        petTypesSpecify: getInfo("petTypesSpecify", "petTypesSpecify"),
        okayWithPets: getInfo("okayWithPets", "okayWithPets"),
        openNotes: getInfo("openNotes", "openNotes"),
        openToChildren: nannyProfile?.openToChildren
          ? String(nannyProfile.openToChildren)
          : undefined,
      });

      let parsedSpecificDays = nannyProfile?.specificDays;
      if (typeof parsedSpecificDays === 'string') {
        try {
          parsedSpecificDays = JSON.parse(parsedSpecificDays);
        } catch (e) { }
      }

      const sourceDays = parsedSpecificDays || specificDaysAndTime;

      setDaysState(daysOfWeek.reduce((acc, day) => {
        const specificDay = dayEntry(sourceDays, day);
        acc[day] = {
          checked: specificDay?.checked === true,
          start: specificDay?.start || null,
          end: specificDay?.end || null,
        };
        return acc;
      }, {}));
    }
  }, [user, form, daysOfWeek, specificDaysAndTime, defaultCheckedValues, jobDescription, nannyProfile]);

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
    form.setFields([{ name: "_scheduleRequired", errors: [] }]);
  }, [form]);

  const handleTimeChange = (day, field, time) => {
    setDaysState((prevState) => ({
      ...prevState,
      [day]: {
        ...prevState[day],
        [field]: time ? time.toISOString() : null,
      },
    }));
    form.setFields([{ name: "_scheduleRequired", errors: [] }]);
  };

  const [imageUrl, setImageUrl] = useState(user?.imageUrl);
  const [file, setFile] = useState(null);
  const objectUrlRef = useRef("");

  useEffect(() => {
    setImageUrl(user?.imageUrl || "");
  }, [user?.imageUrl]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const revokePhotoPreview = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
  };

  const handlePhotoChange = (nextFile) => {
    revokePhotoPreview();
    if (nextFile) {
      const nextUrl = URL.createObjectURL(nextFile);
      objectUrlRef.current = nextUrl;
      setImageUrl(nextUrl);
      setFile(nextFile);
    } else {
      setImageUrl(user?.imageUrl || "");
      setFile(null);
    }
    form.setFields([{ name: "_photoRequired", errors: [] }]);
  };

  /*
   * LEGACY. careType is asked by no questionnaire: the mirror flow derives it
   * from its own schedule question, and the intake writes it from the sheet. So
   * there is no config list to import here, and three of these six values
   * ("Occasional", "Weekends only", "Nights only") are offered by nothing else
   * in the app. Kept per decision 7 because profiles hold them.
   */
  const options2 = [
    { value: "Full-time", label: "Full-time" },
    { value: "Part-time", label: "Part-time" },
    { value: "Occasional", label: "Occasional" },
    { value: "Weekends only", label: "Weekends only" },
    { value: "Nights only", label: "Nights only" },
    { value: "Flexible", label: "Flexible" },
  ];

  const defaultCheckedValues2 = user?.additionalInfo.find((info) => info.key === "avaiForWorking")?.value.option;


  const defaultCheckedValues3 = user?.additionalInfo.find((info) => info.key === "availability")?.value.option;


  const defaultCheckedValues4 = user?.additionalInfo.find((info) => info.key === "experience")?.value.option;

  const defaultCheckedValues6 = user?.additionalInfo?.find((info) => info.key === "additionalDetails")?.value?.option;

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
      "language", "avaiForWorking", "availability", "experience", "additionalDetails",
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
      addData?.additionalInfo.push(specificDaysAndTime);
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
        certifications: "certifications",
        certificationsSpecify: "certificationsSpecify",
        languagesSpecify: "languagesSpecify",
        customCertifications: "customCertifications",
        skills: "skills",
        forWho: "forWho",
        numberOfChildren: "numberOfChildren",
        childrenAges: "childrenAges",
        currentSchedule: "currentSchedule",
        joinTiming: "joinTiming",
        together: "together",
        whereCare: "whereCare",

        /* Flow 2's remaining answers. All are family-only keys, so the payload
           scoping in Task 3.3 suppresses every one of them on a job save without
           needing a second list here. */
        agesCare: "agesCare",
        flexibility: "flexibility",
        matchDistance: "matchDistance",
        matchFit: "matchFit",
        schoolDaycare: "schoolDaycare",
        allergies: "allergies",
        typicalDay: "typicalDay",
        routinesPreferences: "routinesPreferences",
        expectations: "expectations",
        matchMattersMost: "matchMattersMost",
        hasPets: "hasPets",
        okayWithPets: "okayWithPets",
        openNotes: "openNotes",
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
        if (formField === "skills" || formField === "customCertifications" || formField === "allergies") {
          nannyFormData.append(dbField, joinList(val));
          return;
        }
        if (Array.isArray(val)) {
          nannyFormData.append(dbField, JSON.stringify(val));
        } else {
          nannyFormData.append(dbField, val);
        }
      });
      if (userType !== "Job") {
        nannyFormData.append("numberOfChildren", resolvedAges.length);
        nannyFormData.append("childrenAges", JSON.stringify(resolvedAges));

        /*
         * Q8 — the children who could JOIN, kept separate from Q2's children
         * already in her care, and the source of the only numeric age signal
         * this flow has.
         *
         * preferredAges is derived from these rows as point ranges. The age
         * filter passes through only profiles where BOTH childrenAges and
         * preferredAges are empty, and this flow fills childrenAges — so
         * without preferredAges these nannies fail the filter outright rather
         * than falling through it.
         */
        nannyFormData.append("openToChildren", Number(values.openToChildren) || 0);

        /* A one-element array, never a bare string: .lean() readers bypass
           Mongoose casting and would see a third shape alongside the legacy
           strings and the family questionnaire's real arrays. */
        nannyFormData.append(
          "communicationPreference",
          JSON.stringify(toSingletonArray(values.communicationChoice)),
        );

        /* Both conditionals send a value only while the answer that reveals them
           is still selected. The wizard clears them too; this is the second line
           of defence, because antd keeps the value of an unmounted Form.Item. */
        const schoolAnswered = values.schoolDaycare === FAMILY_FLOW_CONDITIONAL.q14;
        nannyFormData.append("childrenSchools", schoolAnswered ? joinList(values.childrenSchools) : "");

        const petsAnswered = values.hasPets === FAMILY_FLOW_CONDITIONAL.q23;
        const petTypes = petsAnswered ? values.petTypes || [] : [];
        nannyFormData.append("petTypes", JSON.stringify(petTypes));
        nannyFormData.append(
          "petTypesSpecify",
          petTypes.includes(OTHER_LABEL) ? values.petTypesSpecify || "" : "",
        );
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
      if (careTypeAnswer) {
        nannyFormData.append("careType", String(careTypeAnswer).toLowerCase());
      }

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

      if (file) nannyFormData.append("imageFile", file);

      const nannyResult = await dispatch(updateNannyProfileThunk(nannyFormData)).unwrap();
      const { status } = await dispatch(editUserThunk(formData)).unwrap();

      if (status === 200) {
        // Fetch fresh data immediately so the UI is perfectly in sync
        const freshData = await dispatch(fetchNannyByIdThunk(user._id)).unwrap();
        setNannyProfile(freshData?.nannyProfile || {});

        if (nannyResult?.data?.photoWarning) {
          fireToastMessage({
            type: "error",
            message:
              "Your profile was updated, but the photo could not be uploaded. You can try again from Edit Profile.",
          });
        } else {
          fireToastMessage({ success: true, message: "User updated successfully" });
        }
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
        <Form
          onFinish={onFinish}
          onFinishFailed={handleFinishFailed}
          form={form}
          layout="vertical"
          autoComplete="off"
          scrollToFirstError={SCROLL_TO_FIRST_ERROR}
          className="edit-profile-form space-y-6 md:space-y-8"
        >

          {/* Profile Photo & Live Preview Grid */}
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
            {/* Profile Photo Section */}
            <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100 lg:w-[320px] shrink-0">
              <h2 className="text-xl Livvic-Bold text-[#001243] mb-6">
                Profile Photo {isJob && <span className="text-red-500">*</span>}
              </h2>
              <Form.Item
                name="_photoRequired"
                className="mb-0"
                rules={isJob ? [{
                  validator: async () => {
                    if (!imageUrl && !file && !user?.imageUrl) {
                      throw new Error(JOB_ERROR_MESSAGES.q18);
                    }
                  },
                }] : undefined}
              >
                <FormErrorAnchor>
                  {(invalid) => (
              <div className="flex flex-col text-center gap-4">
                <PhotoUploadField
                  previewUrl={imageUrl}
                  invalid={invalid}
                  onSelect={handlePhotoChange}
                  onRemove={() => handlePhotoChange(null)}
                />
                <p className="Livvic text-secondary text-sm">Clear, friendly photos help families trust you more.</p>
              </div>
                  )}
                </FormErrorAnchor>
              </Form.Item>
            </section>

            {/* Live Preview Section */}
            <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100 flex-1 flex flex-col min-w-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl Livvic-Bold text-[#001243] flex items-center gap-2">
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
                    img={imageUrl || user?.imageUrl}
                    location={{ format_location: location || user?.location?.format_location }}
                    experience={formValues?.experience || nannyProfile?.careExperience}
                    goal={userType === 'Job' ? "Looking for a Nanny Share Position" : "Already work with a family"}
                    rateType={rateType}
                    sharedRate={formValues?.sharedRate || nannyProfile?.sharedRate}
                    soloRate={formValues?.soloRate || nannyProfile?.soloRate}
                    ages={userType === 'Job' ? (formValues?.preferredAges?.map(age => typeof age === 'object' ? age.label : age) || nannyProfile?.preferredAges?.map(age => typeof age === 'object' ? age.label : age)) : (previewChildrenAges?.length > 0 ? previewChildrenAges : nannyProfile?.childrenAges)}
                    careType={userType === 'Job' ? previewJobCareType : (formValues?.currentSchedule || nannyProfile?.currentSchedule)}
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

          {/* User Type Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl Livvic-Bold text-[#001243] mb-2">User Type</h2>
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
                    {userType === 'Family' ? <CheckCircle2 className="w-6 h-6 text-primary" fill="white" /> : <Circle className="w-6 h-6 text-gray-300" />}
                  </div>
                  <div className="flex flex-col items-center text-center mt-2">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                      <User className="w-6 h-6 text-[#AEC4FF]" />
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

          {/* Basic Information Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#AEC4FF]" /> Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item name="fullName" initialValue={user?.name} label="Full Name" rules={requiredText("Full name is required")}>
                <Input className="Livvic-Medium rounded-xl border-gray-200 py-3 focus:border-primary" />
              </Form.Item>

              <Form.Item
                name="email"
                initialValue={user?.email}
                label="Email Address"
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Enter a valid email address" },
                ]}
              >
                <Input type="email" className="Livvic-Medium rounded-xl border-gray-200 py-3 focus:border-primary" />
              </Form.Item>

              <Form.Item name="location" label="Address" rules={[{ required: true, message: "Address is required" }]}>
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


            </div>
          </section>

          {/* Share Compatibility / Current Setup Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            {userType === 'Job' ? (
              <>
                <h2 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#AEC4FF]" /> {groupFor("shareExperience")}
                </h2>
                <p className="text-secondary text-sm mb-6 Livvic">Configure your preferences and experiences with nanny sharing.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item name="shareExperience" label={labelFor("shareExperience")} rules={requiredRules("shareExperience")}>
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(OPTIONS.q1)}
                    </Select>
                  </Form.Item>

                  <Form.Item name="multiFamilyComfort" label={labelFor("multiFamilyComfort")} rules={requiredRules("multiFamilyComfort")}>
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(OPTIONS.q2)}
                    </Select>
                  </Form.Item>

                  <Form.Item name="childrenCapacity" label={labelFor("childrenCapacity")} rules={requiredRules("childrenCapacity")}>
                    <Select className="h-12 w-full rounded-xl" placeholder="Select capacity">
                      {renderOptions(OPTIONS.q3)}
                    </Select>
                  </Form.Item>

                  <Form.Item name="workSetup" label={labelFor("workSetup")} rules={requiredRules("workSetup")}>
                    <Select className="h-12 w-full rounded-xl" placeholder="Select work setup">
                      {renderOptions(OPTIONS.q5)}
                    </Select>
                  </Form.Item>

                  <Form.Item className="col-span-1 md:col-span-2" label={labelFor("preferredAges")} required={Boolean(requiredRules("preferredAges"))}>
                    <OptionSelector
                      form={form}
                      name="preferredAges"
                      options={optionsWithStored(
                        OPTIONS.q4,
                        (nannyProfile?.preferredAges || []).map((a) => (typeof a === "object" ? a.label : a)),
                      )}
                      defaultCheckedValues={
                        toArray(
                          (nannyProfile?.preferredAges || []).map((a) => (typeof a === "object" ? a.label : a)),
                        ) || []
                      }
                      required={Boolean(requiredRules("preferredAges"))}
                      requiredMessage={JOB_ERROR_MESSAGES.q4}
                    />
                  </Form.Item>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#AEC4FF]" /> {groupFor("forWho")}
                </h2>
                <p className="text-secondary text-sm mb-6 Livvic">Tell us about the family you currently work with.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <SelectChildrenAge
                      part="count"
                      form={form}
                      opt={[1, 2, 3, 4, 5]}
                      selectedValue={formValues?.numberOfChildren}
                      handleSelectChange={(val) => form.setFieldsValue({ numberOfChildren: val })}
                      numberOfChildren={nannyProfile?.numberOfChildren}
                      childrenAges={
                        nannyProfile?.childrenAges?.length
                          ? nannyProfile.childrenAges.map((age) => age.label).join(", ")
                          : ""
                      }
                    />
                    <Form.Item name="numberOfChildren" hidden noStyle><Input /></Form.Item>
                  </div>
                  <Form.Item name="forWho" label={labelFor("forWho")} rules={requiredRules("forWho")}>
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(FAMILY_FLOW_OPTIONS.q1)}
                    </Select>
                  </Form.Item>
                </div>

                <div className="mt-4">
                  <SelectChildrenAge
                    part="ages"
                    form={form}
                    opt={[1, 2, 3, 4, 5]}
                    selectedValue={formValues?.numberOfChildren}
                    handleSelectChange={(val) => form.setFieldsValue({ numberOfChildren: val })}
                    numberOfChildren={nannyProfile?.numberOfChildren}
                    childrenAges={
                      nannyProfile?.childrenAges?.length
                        ? nannyProfile.childrenAges.map((age) => age.label).join(", ")
                        : ""
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Form.Item className="col-span-1 md:col-span-2" label={labelFor("agesCare")} required={Boolean(requiredRules("agesCare"))}>
                    <OptionSelector
                      form={form}
                      name="agesCare"
                      options={optionsWithStored(optionsFor("agesCare"), nannyProfile?.agesCare)}
                      defaultCheckedValues={toArray(nannyProfile?.agesCare) || []}
                      required={Boolean(requiredRules("agesCare"))}
                      requiredMessage={FAMILY_FLOW_ERROR_MESSAGES.q3}
                    />
                  </Form.Item>

                  <Form.Item name="currentSchedule" label={labelFor("currentSchedule")} rules={requiredRules("currentSchedule")}>
                    <Select className="h-12 w-full rounded-xl" placeholder="Select schedule">
                      {renderOptions(FAMILY_FLOW_OPTIONS.q5)}
                    </Select>
                  </Form.Item>

                  <Form.Item name="joinTiming" label={labelFor("joinTiming")} rules={requiredRules("joinTiming")}>
                    <Select className="h-12 w-full rounded-xl" placeholder="Select timing">
                      {renderOptions(FAMILY_FLOW_OPTIONS.q6)}
                    </Select>
                  </Form.Item>

                  <Form.Item name="together" label={labelFor("together")} rules={requiredRules("together")}>
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


          {/*
            * Flow 2's steps 2 to 5, which this form has never asked about.
            *
            * Fifteen questions — the ages she can take on, flexibility, distance,
            * age fit, school, allergies, the typical day, routines, expectations,
            * communication, what matters in a match, pets both ways, and open
            * notes — were collected at onboarding and then invisible and
            * uneditable. Allergies and pets are the sharp ones: a stale answer
            * there is a safety problem, not a cosmetic one.
            *
            * Grouped and titled by the wizard's own step names, and gated on the
            * path that asks them, so a job-seeking nanny never sees any of it.
            */}
          {!isJob && (
            <>
              <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#AEC4FF]" /> {groupFor("openToChildren")}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item name="openToChildren" label={labelFor("openToChildren")} rules={requiredRules("openToChildren")} className="mb-0">
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(optionsFor("openToChildren"))}
                    </Select>
                  </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Form.Item name="whereCare" label={labelFor("whereCare")} rules={requiredRules("whereCare")}>
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(optionsFor("whereCare"))}
                    </Select>
                  </Form.Item>

                  <Form.Item name="flexibility" label={labelFor("flexibility")} rules={requiredRules("flexibility")}>
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(optionsFor("flexibility"))}
                    </Select>
                  </Form.Item>

                  <Form.Item name="matchDistance" label={labelFor("matchDistance")} rules={requiredRules("matchDistance")}>
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(optionsFor("matchDistance"))}
                    </Select>
                  </Form.Item>
                </div>
              </section>

              <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                  <Baby className="w-5 h-5 text-[#AEC4FF]" /> {groupFor("matchFit")}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item name="matchFit" label={labelFor("matchFit")} rules={requiredRules("matchFit")}>
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(optionsFor("matchFit"))}
                    </Select>
                  </Form.Item>

                  <Form.Item name="schoolDaycare" label={labelFor("schoolDaycare")} rules={requiredRules("schoolDaycare")}>
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(optionsFor("schoolDaycare"))}
                    </Select>
                  </Form.Item>

                  {/* Revealed by the same answer the wizard reveals it on. */}
                  {isRevealed("schoolDaycare") && (
                    <Form.Item
                      name="childrenSchools"
                      className="col-span-1 md:col-span-2"
                      label={revealOf("schoolDaycare")?.label}
                    >
                      <TagInputField />
                    </Form.Item>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-6">
                  <Form.Item name="allergies" label={labelFor("allergies")} className="mb-0">
                    <TagInputField placeholder={placeholderFor("allergies")} />
                  </Form.Item>

                  <Form.Item name="typicalDay" label={labelFor("typicalDay")} className="mb-0">
                    <TextArea rows={4} className="rounded-2xl border-gray-200 p-4 Livvic" placeholder={placeholderFor("typicalDay")} />
                  </Form.Item>

                  <Form.Item name="routinesPreferences" label={labelFor("routinesPreferences")} className="mb-0">
                    <TextArea rows={3} className="rounded-2xl border-gray-200 p-4 Livvic" placeholder={placeholderFor("routinesPreferences")} />
                  </Form.Item>
                </div>
              </section>

              <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#AEC4FF]" /> {groupFor("expectations")}
                </h2>

                <Form.Item name="expectations" label={labelFor("expectations")}>
                  <TextArea rows={4} className="rounded-2xl border-gray-200 p-4 Livvic" placeholder={placeholderFor("expectations")} />
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Asked as one choice, stored as a one-element array — the
                      schema path is [String] because the family questionnaire asks
                      the same question as a multi-select. */}
                  <Form.Item name="communicationChoice" label={labelFor("communicationPreference")} rules={requiredRules("communicationPreference")}>
                    <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                      {renderOptions(optionsFor("communicationPreference"))}
                    </Select>
                  </Form.Item>
                </div>

                <Form.Item name="matchMattersMost" label={labelFor("matchMattersMost")}>
                  <TextArea rows={3} className="rounded-2xl border-gray-200 p-4 Livvic" placeholder={placeholderFor("matchMattersMost")} />
                </Form.Item>
              </section>
            </>
          )}

          {/* Weekly Schedule Section */}
          {/* Flow 1's Q6. The mirror questionnaire asks joinTiming and
              startAvailability instead and never collects a day grid. */}
          {asks("specificDays") && (
            <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#AEC4FF]" /> {groupFor("specificDays")}
              </h2>
              <p className="Livvic-SemiBold text-gray-500 mb-4">
                {labelFor("specificDays")} <span className="text-red-500">*</span>
              </p>
              <Form.Item
                name="_scheduleRequired"
                className="mb-0"
                rules={[{
                  validator: async () => {
                    const checked = Object.entries(daysState).filter(([, data]) => data?.checked);
                    if (!checked.length) {
                      throw new Error(JOB_ERROR_MESSAGES.q6);
                    }
                    const invalid = checked.filter(([, data]) => {
                      const start = parseTime(data.start);
                      const end = parseTime(data.end);
                      return !start || !end || !start.isValid() || !end.isValid() || start.isSame(end) || end.isBefore(start);
                    });
                    if (invalid.length) {
                      throw new Error(`Invalid times for: ${invalid.map(([day]) => day).join(", ")}`);
                    }
                  },
                }]}
              >
                <FormErrorAnchor>
                  {(invalid) => (
              <div className="space-y-4">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    data-day-card
                    className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition-all ${
                      daysState[day]?.checked
                        ? "border-[#AEC4FF] bg-[#FFF8FA]"
                        : invalid
                          ? "border-red-300 bg-red-50/60"
                          : "border-gray-100 bg-gray-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                      <Checkbox
                        checked={!!daysState[day]?.checked}
                        onChange={() => handleCheckboxChange(day)}
                        className="scale-110"
                      />
                      <span className={`Livvic-Bold text-lg ${daysState[day]?.checked ? "text-[#001243]" : "text-gray-400"}`}>
                        {day}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <TimePicker
                        value={daysState[day]?.start ? parseTime(daysState[day].start) : null}
                        placeholder="Start Time"
                        onChange={(time) => handleTimeChange(day, "start", time)}
                        disabled={!daysState[day]?.checked}
                        format="h:mm A"
                        className="rounded-xl border-gray-200 py-2 Livvic-Medium w-32"
                        suffixIcon={<Clock size={14} />}
                      />
                      <span className="text-gray-300">to</span>
                      <TimePicker
                        value={daysState[day]?.end ? parseTime(daysState[day].end) : null}
                        placeholder="End Time"
                        onChange={(time) => handleTimeChange(day, "end", time)}
                        disabled={!daysState[day]?.checked}
                        format="h:mm A"
                        className="rounded-xl border-gray-200 py-2 Livvic-Medium w-32"
                        suffixIcon={<Clock size={14} />}
                      />
                    </div>
                  </div>
                ))}
              </div>
                  )}
                </FormErrorAnchor>
              </Form.Item>
            </section>
          )}



          {/* Expectations, Roles & Transport Section */}
          {/* Flow 1's Q8-Q11. None of the four is asked by the mirror
              questionnaire, so the whole section belongs to one path. */}
          {asks("responsibilities") && (
            <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#AEC4FF]" /> {groupFor("responsibilities")}
              </h2>
              <p className="text-secondary text-sm mb-6 Livvic">Add trust signals and clarify what chores or responsibilities you support.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item name="hasTransport" label={labelFor("hasTransport")} rules={requiredRules("hasTransport")}>
                  <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                    {renderOptions(OPTIONS.q10)}
                  </Select>
                </Form.Item>

                <Form.Item name="backgroundCheck" label={labelFor("backgroundCheck")} rules={requiredRules("backgroundCheck")}>
                  <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                    {renderOptions(OPTIONS.q11)}
                  </Select>
                </Form.Item>

                <Form.Item name="householdHelp" className="col-span-1 md:col-span-2" label={labelFor("householdHelp")} rules={requiredRules("householdHelp")}>
                  <Select className="h-12 w-full rounded-xl" placeholder="Select option">
                    {renderOptions(OPTIONS.q9)}
                  </Select>
                </Form.Item>

                <Form.Item className="col-span-1 md:col-span-2" label={labelFor("responsibilities")} required={Boolean(requiredRules("responsibilities"))}>
                  <OptionSelector
                    form={form}
                    name="responsibilities"
                    options={optionsWithStored(OPTIONS.q8, nannyProfile?.responsibilities)}
                    defaultCheckedValues={toArray(nannyProfile?.responsibilities) || []}
                    required={Boolean(requiredRules("responsibilities"))}
                    requiredMessage={JOB_ERROR_MESSAGES.q8}
                  />
                </Form.Item>
              </div>
            </section>
          )}

          {/* Languages — same place as family Preferences: before rates and location/notes. */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
              <Languages className="w-5 h-5 text-[#AEC4FF]" /> Languages
            </h2>
            <p className="text-secondary text-sm mb-4 Livvic">{labelFor("languages")}</p>
            <OptionSelector
              options={optionsWithStored(optionsFor("languages"), nannyProfile?.languages)}
              form={form}
              defaultCheckedValues={toArray(nannyProfile?.languages) || toArray(defaultCheckedValues) || []}
              name="language"
            />

            {(formValues?.language || []).some((value) => String(value).toLowerCase() === OTHER_LABEL.toLowerCase()) && (
              <Form.Item name="languagesSpecify" className="mt-4">
                <Input
                  placeholder="Please specify..."
                  className="Livvic-Medium rounded-xl border-gray-200 py-3 focus:border-primary"
                />
              </Form.Item>
            )}
          </section>

          {/* Rates — family keeps budget with the late location card; both nanny
              flows ask rates in the same relative slot, after languages. */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#AEC4FF]" /> {isJob ? groupFor("sharedRate") : "Nanny Share Rates"}
            </h2>
            <p className="text-secondary text-sm mb-6 Livvic">Set your nanny share rates for shared care and solo.</p>

            <div className="flex flex-col gap-6">
              <Form.Item name="sharedRate" label={RATE_LABELS.shared} rules={requiredRules("sharedRate")} className="mb-0">
                <SharedRateCards options={rateOptionsWith(RATE_OPTIONS.shared, formValues?.sharedRate)} />
              </Form.Item>
              <Form.Item name="soloRate" label={RATE_LABELS.solo} rules={requiredRules("sharedRate")} className="mb-0">
                <SoloRateRangeField />
              </Form.Item>
            </div>
          </section>

          {!isJob && (
            <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                <Home className="w-5 h-5 text-[#AEC4FF]" /> {groupFor("hasPets")}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item name="hasPets" label={labelFor("hasPets")} rules={requiredRules("hasPets")}>
                  <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                    {renderOptions(optionsFor("hasPets"))}
                  </Select>
                </Form.Item>

                <Form.Item name="okayWithPets" label={labelFor("okayWithPets")} rules={requiredRules("okayWithPets")}>
                  <Select className="h-12 w-full rounded-xl" placeholder="Select answer">
                    {renderOptions(optionsFor("okayWithPets"))}
                  </Select>
                </Form.Item>

                {isRevealed("hasPets") && (
                  <Form.Item
                    className="col-span-1 md:col-span-2"
                    label={fieldLabel(revealOf("hasPets")?.label)}
                  >
                    <OptionSelector
                      form={form}
                      name="petTypes"
                      options={optionsWithStored(
                        revealOf("hasPets")?.options || [],
                        nannyProfile?.petTypes,
                      )}
                      defaultCheckedValues={toArray(nannyProfile?.petTypes) || []}
                    />
                  </Form.Item>
                )}

                {isRevealed("hasPets") && (formValues?.petTypes || []).includes(OTHER_LABEL) && (
                  <Form.Item
                    name="petTypesSpecify"
                    className="col-span-1 md:col-span-2"
                    label="Please specify"
                  >
                    <Input className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium" />
                  </Form.Item>
                )}
              </div>

              <Form.Item name="openNotes" label={labelFor("openNotes")} className="mt-6">
                <TextArea rows={3} className="rounded-2xl border-gray-200 p-4 Livvic" placeholder={placeholderFor("openNotes")} />
              </Form.Item>
            </section>
          )}

          {/* Professional Details Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#AEC4FF]" /> Professional Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item name="availability" label={labelFor("startAvailability")} initialValue={getValidDate(defaultCheckedValues3)} rules={requiredRules("startAvailability")}>
                <DatePicker
                  className="h-12 w-full rounded-xl border-gray-200"
                  format="MMMM D, YYYY"
                  disabledDate={(current) => current && current < dayjs().startOf("day")}
                />
              </Form.Item>
              <Form.Item name="experience" initialValue={defaultCheckedValues4} label={labelFor("careExperience")} rules={requiredRules("careExperience")}>
                {/* Both questionnaires standardised on the same four strings. This
                    control offered "Over 5 years" where they write "5+ years", so an
                    onboarded answer rendered unmatched and was replaced on the next
                    save. */}
                <Select
                  className="h-12 w-full rounded-xl"
                  options={toSelectOptions(optionsFor("careExperience"))}
                />
              </Form.Item>
              {/* Writes careType, which the mirror questionnaire derives from its
                  own schedule question instead — so showing it there would give
                  one field two controls. */}
              {asks("careType") && Boolean(nannyProfile?.careType) && (
                <Form.Item name="avaiForWorking" initialValue={defaultCheckedValues2} label="Care Type">
                  <Select className="h-12 w-full rounded-xl" options={options2} />
                </Form.Item>
              )}
            </div>

            <div className="mt-8">
              <label className="Livvic-Bold text-primary mb-4 block flex items-center gap-2">
                <FileText className="w-4 h-4" /> {labelFor("bio")} {activeByKey.get("bio")?.required && <span className="text-red-500">*</span>}
              </label>
              <Form.Item name="jobDescription" initialValue={user?.additionalInfo.find((i) => i.key === "jobDescription")?.value} rules={requiredRules("bio")}>
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
              {isJob ? (
                <Form.Item name="certifications" className="mb-0">
                  <TagInputField placeholder={placeholderFor("certifications")} />
                </Form.Item>
              ) : (
                <>
              <OptionSelector
                options={optionsWithStored(
                  optionsFor("certifications"),
                  nannyProfile?.certifications,
                )}
                defaultCheckedValues={toArray(nannyProfile?.certifications) || []}
                form={form}
                name="certifications"
                exclusive={FAMILY_FLOW_EXCLUSIVE.q26}
              />

              {(formValues?.certifications || []).some((value) => String(value).toLowerCase() === OTHER_LABEL.toLowerCase()) && (
                <Form.Item name="certificationsSpecify" className="mt-4">
                  <Input
                    placeholder="Please specify..."
                    className="Livvic-Medium rounded-xl border-gray-200 py-3 focus:border-primary"
                  />
                </Form.Item>
              )}
                </>
              )}
            </div>

            {/* Flow 1's Q15 and Q16. The mirror questionnaire asks neither. */}
            {asks("customCertifications") && (
              <div className="mt-8">
                <label className="Livvic-Bold text-primary mb-4 block">{labelFor("customCertifications")}</label>
                <Form.Item name="customCertifications">
                  <TagInputField placeholder={placeholderFor("customCertifications")} />
                </Form.Item>
              </div>
            )}

            {asks("skills") && (
              <div className="mt-8">
                <label className="Livvic-Bold text-primary mb-4 block">{labelFor("skills")}</label>
                <Form.Item name="skills">
                  <TagInputField placeholder={placeholderFor("skills")} />
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
