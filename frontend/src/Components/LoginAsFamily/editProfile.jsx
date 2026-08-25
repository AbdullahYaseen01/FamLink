import { Form, Input, Select, Spin, Checkbox, TimePicker, DatePicker } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { editUserThunk, updateNannyProfileThunk } from "../Redux/authSlice";
import { fetchNannyByIdThunk } from "../Redux/nannyData";
import { fireToastMessage } from "../../toastContainer";
import Autocomplete from "react-google-autocomplete";
import { formatSentence, toCamelCase } from "../subComponents/toCamelStr";
import { useNavigate, NavLink } from "react-router-dom";
import { ChevronLeft, User as UserIcon, Info, Calendar as CalendarIcon, Clock, Baby, Eye, EyeOff, X, Save, Users, Heart, MapPin } from "lucide-react";
import dayjs from "dayjs";
import { FamilyProfile } from "../subComponents/profileCard";
import { zipFromPlace } from "../../Config/serviceArea";
import { deparseHourlyRate, parseHourlyRate } from "../../Config/helpFunction";
import {
  BUDGET_OPTIONS,
  ERROR_MESSAGES,
  OPTIONS,
  OTHER_LABEL,
} from "../../NewComponents/NannyShare/FamilyWizard/onboardingConfig";
import {
  FAMILY_FIELDS,
  groupFields,
  isRevealed,
  LEGACY_SHARE_TYPE_ALIASES,
  optionsWithStored,
} from "../../Config/profileFields";
import PhotoUploadField from "../../NewComponents/NannyShare/OnboardingKit/fields/PhotoUploadField";
import { FormErrorAnchor, handleFinishFailed, SCROLL_TO_FIRST_ERROR } from "../subComponents/formErrors";

/*
 * Field labels are the wizard's questions, looked up by the field each one
 * writes. This form used to carry its own short captions ("Type of Nanny
 * Share"), which read fine on their own but meant a family saw one wording in
 * the questionnaire and a different one when they came back to change the
 * answer.
 */
const LABEL = Object.fromEntries(FAMILY_FIELDS.map((f) => [f.dbKey, f.label]));
const PLACEHOLDER = Object.fromEntries(
  FAMILY_FIELDS.filter((f) => f.placeholder).map((f) => [f.dbKey, f.placeholder]),
);
/* The whole manifest entry, for the two questions that need more than a label:
   q18's conditional reveal wants its `when` value and its own label. */
const FIELD = Object.fromEntries(FAMILY_FIELDS.map((f) => [f.dbKey, f]));

const requiredRules = (dbKey) => {
  const field = FIELD[dbKey];
  if (!field?.required) return undefined;
  const message = ERROR_MESSAGES[field.qid] || "This field is required";
  if (field.isMulti) {
    return [{ required: true, type: "array", min: 1, message }];
  }
  return [{ required: true, message }];
};

const requiredText = (message) => [{ required: true, whitespace: true, message }];

/*
 * Card titles are the questionnaire's step names, in the questionnaire's order.
 *
 * This form used to invent its own sections — "Nanny Share Preferences" held
 * questions from four different steps, and the schedule question sat in a card
 * of its own at the bottom, three steps away from the rest of step 3. A family
 * answering the wizard and then coming back to edit had to re-find every answer
 * under a heading that never existed during onboarding.
 *
 * FamilyProfileView already groups its rows this way, so driving both from
 * groupFields() means the questionnaire, the profile and this form now agree on
 * what the sections are called and which questions are in them. Renaming a step
 * in onboardingConfig.js retitles all three.
 */
const GROUP_TITLE = Object.fromEntries(
  groupFields(FAMILY_FIELDS).map((g) => [g.step, g.title]),
);

const parseTime = (time) => {
  return time ? dayjs(time) : null;
};

const getValidDate = (dateString) => {
  if (!dateString) return null;
  const d = dayjs(dateString);
  return d.isValid() ? d : null;
};

/* ── Option lists come from the questionnaire, not from a copy of it ─────────
 *
 * Every list below used to be a hand-written block of <Select.Option>s, and it
 * had drifted from what the six-step wizard actually stores: lowercase values
 * against the wizard's Title Case ("montessori" vs "Montessori"), "arts &
 * crafts" vs "Arts and crafts", "meal/snack" vs "meal / snack", an en dash
 * where the wizard writes an em dash. A family who completed the wizard then
 * opened this form and saw five questions render as unmatched antd tags.
 *
 * Reading OPTIONS makes that unrepeatable: one authoritative list, and this
 * form follows it. onboardingConfig.js is a plain data module with no React or
 * wizard imports, so pulling it in here costs nothing.
 */
const renderOptions = (options) =>
  options.map((option) => (
    <Select.Option key={option} value={option}>
      {option}
    </Select.Option>
  ));

/*
 * The wizard's Q17 list, and only that.
 *
 * Three strings used to be appended here — "Seatbelts always", "No food in
 * car", "Screen use in car" — which no questionnaire has ever offered.
 * Leaving them meant a family could save a value the wizard would never show
 * them again, which is the same drift this form's option lists were changed
 * to stop.
 *
 * They are not simply deleted, because a profile already holding one would
 * then render it unmatched and lose it on the next save. optionsWithStored
 * appends anything stored that is no longer offered, so a retired answer stays
 * visible and editable to the one family that has it, and is offered to nobody
 * else.
 */
const houseRuleOptions = (stored) => optionsWithStored(OPTIONS.q17, stored);

/*
 * Q5's counts, as Numbers because that is what handleChildrenChange and the
 * Child{n} rows are keyed on.
 *
 * This offered 1–5 against the questionnaire's 1–4, so a family could set a
 * fifth child here that the wizard would never show them again. A count already
 * stored beyond the offered list is appended rather than dropped — the same
 * reasoning as houseRuleOptions, since silently narrowing the list would make
 * that family lose a child row on their next save.
 */
const childCountOptions = (stored) => {
  const offered = OPTIONS.q5.map(Number);
  const count = Number(stored);
  return count && !offered.includes(count) ? [...offered, count] : offered;
};

/* Q1's three choices, and the one place a Select value is deliberately not
 * what gets stored.
 *
 * nannyShareType is queried, not just displayed: share.controller.js lowercases
 * the browse filter and matches $in, matches the field directly on the share
 * lookup, and builds the admin facet list from distinct("nannyShareType"). This
 * form used to offer six Title Case values ("Full-time care") and write them
 * verbatim, so a profile saved here matched no filter at all.
 *
 * "Other" reveals a free-text input; the typed answer is stored lowercased in
 * nannyShareType with the user's own capitalisation kept in
 * otherShareTypeSpecify — exactly what resolveShareType() does for the wizard.
 */
const SHARE_TYPE_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: OTHER_LABEL, label: "Other" },
];

const isPresetShareType = (value) =>
  SHARE_TYPE_OPTIONS.some((option) => option.value === value && option.value !== OTHER_LABEL);

/* Profiles written by the retired six-option control hold "Full-time care" and
 * "Part-time care". Those two are today's presets under an older name, so map
 * them instead of dropping the family into the Other free text. The four types
 * the questionnaire genuinely retired — Pickup/Drop-off, After-school,
 * Summer/Seasonal, Weekend — do become Other, which is where the wizard puts
 * them too. Aliases live in the shared map so "Flexible" (retired from the
 * family chat) hydrates here the same way it does on the profile. */
const resolveStoredShareType = (stored) => {
  if (!stored) return "";
  const key = String(stored).trim().toLowerCase();
  return LEGACY_SHARE_TYPE_ALIASES[key] ?? key;
};

/* Match a stored answer to its canonical option, ignoring case.
 *
 * Documents written before the wizard hold lowercase ("food allergies"), so
 * without this every one of them would render as an unmatched tag against the
 * Title Case options above — trading one display bug for another. Mirrors the
 * knownOptions lookup the nanny edit form already does.
 */
const canonicalise = (value, options) => {
  if (Array.isArray(value)) return value.map((item) => canonicalise(item, options));
  if (typeof value !== "string") return value;
  const match = options.find(
    (option) => option.toLowerCase().trim() === value.toLowerCase().trim()
  );
  return match ?? value;
};

/* Feed a multi-select an array whatever the document holds.
 *
 * communicationPreference and backupCare are declared [String] but documents
 * predating that change hold a plain string, and .lean() reads hand the raw
 * value back without casting — so both shapes are in the database right now. */
const toArray = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Array.isArray(value) ? value : [value];
};

/* The stored hourlyBudget → the Select value, across all three shapes it has
 * been written in: the parsed {min,max,minShare,maxShare} object, that object
 * stringified by a FormData save, and a bare display string.
 *
 * That last shape is what this form itself used to write — see onFinish — so
 * the prefix fallback is what lets an already-damaged profile preselect
 * correctly and get repaired on its next save.
 */
const budgetSelectValue = (stored) => {
  if (!stored) return undefined;

  const canonical = deparseHourlyRate(stored);
  if (BUDGET_OPTIONS.some((option) => option.value === canonical)) return canonical;

  const raw = typeof stored === "string" ? stored.trim() : "";
  return raw
    ? BUDGET_OPTIONS.find((option) => option.value.startsWith(raw))?.value
    : undefined;
};

import { useCallback, useEffect, useRef, useState } from "react";

export default function EditProfile() {
  const { TextArea } = Input;
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const [nannyProfile, setNannyProfile] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchNannyByIdThunk(user._id))
        .unwrap()
        .then((res) => {
          setNannyProfile(res?.nannyProfile || {});
        })
        // The form falls back to the auth user's own fields, so a failed fetch
        // leaves it usable rather than empty — nothing to report to the user.
        .catch(() => { });
    }
  }, [user?._id, dispatch]);

  const getAdditionalInfo = useCallback((key) => {
    const keyMap = {
      specificDaysAndTime: "specificDays",
      flexible: "flexibility",
      hosting: "hostingPreference",
      prefferedCommunication: "communicationPreference",
      backupAvailable: "backupCare",
      hourlyRateSplit: "hourlyBudget"
    };
    const profileKey = keyMap[key] || key;

    if (nannyProfile && Object.keys(nannyProfile).length > 0) {
      let val = nannyProfile[profileKey];

      if (Array.isArray(val)) {
        val = val.map(item => {
          if (typeof item === 'string' && (item.startsWith('{') || item.startsWith('['))) {
            try { return JSON.parse(item); } catch (e) { return item; }
          }
          return item;
        }).flat();
      } else if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch (e) { }
      }
      return val;
    }

    return Array.isArray(user?.additionalInfo)
      ? user.additionalInfo.find(info => info.key === key)?.value
      : user?.additionalInfo?.[key];
  }, [nannyProfile, user]);

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const formValues = Form.useWatch([], form);

  // Is this multi-select's "Other" pill chosen? Drives the free-text reveals,
  // the same rule the questionnaire uses.
  const hasOther = (field) => (formValues?.[field] || []).includes(OTHER_LABEL);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [selectedChildren, setSelectedChildren] = useState(
    user?.noOfChildren?.length || 0
  );
  const [childrenAges, setChildrenAges] = useState(() => {
    const info = user?.noOfChildren?.info || {};
    const len = user?.noOfChildren?.length || 0;
    return Array.from({ length: len }, (_, i) => info[`Child${i + 1}`] || "");
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const [daysState, setDaysState] = useState(() => {
    return daysOfWeek.reduce((acc, day) => {
      acc[day] = {
        checked: false,
        start: null,
        end: null,
      };
      return acc;
    }, {});
  });

  /* The local deparseHourlyRate that used to live here is gone.
   *
   * It was a drifted copy of the Config/helpFunction export: it keyed off
   * minShare/maxShare only, and its output omitted the "(Each family pays …)"
   * clause. That clause is the whole difference between a label and a value —
   * without it the string could not round-trip through parseHourlyRate, so
   * every save wrote "$25 - $30 per hour" over the wizard's parsed object and
   * the profile lost its per-family split. The shared helper understands all
   * three stored shapes; budgetSelectValue wraps it. */

  useEffect(() => {
    if (user || nannyProfile) {
      const storedShareType = getAdditionalInfo("nannyShareType");
      const storedHasNanny = getAdditionalInfo("hasNanny");
      const normalisedShareType = resolveStoredShareType(storedShareType);
      const shareTypeIsPreset = isPresetShareType(normalisedShareType);

      const shareFields = {
        // A stored type that is neither preset came from Q1's "Other", so the
        // Select shows Other and the free text carries the answer.
        nannyShareType: shareTypeIsPreset
          ? normalisedShareType
          : storedShareType
            ? OTHER_LABEL
            : undefined,
        otherShareTypeSpecify: shareTypeIsPreset
          ? ""
          : getAdditionalInfo("otherShareTypeSpecify") || storedShareType || "",
        hasNanny: storedHasNanny === true
          ? OPTIONS.q2[0]
          : storedHasNanny === false
            ? OPTIONS.q2[1]
            : canonicalise(storedHasNanny, OPTIONS.q2),
        shareLocation: canonicalise(getAdditionalInfo("shareLocation"), OPTIONS.q18),
        specifyNearbyWorkplace: getAdditionalInfo("specifyNearbyWorkplace"),
        flexible: canonicalise(getAdditionalInfo("flexible"), OPTIONS.q9),
        nannyshareStart: getValidDate(getAdditionalInfo("nannyshareStart")),
        urgency: canonicalise(getAdditionalInfo("urgency"), OPTIONS.q4),
        hosting: canonicalise(getAdditionalInfo("hosting"), OPTIONS.q13),
        hourlyRateSplit: budgetSelectValue(getAdditionalInfo("hourlyRateSplit")),
        prefferedCommunication: toArray(
          canonicalise(getAdditionalInfo("prefferedCommunication"), OPTIONS.q20)
        ),
        communicationSpecify: getAdditionalInfo("communicationSpecify"),
        backupAvailable: toArray(
          canonicalise(getAdditionalInfo("backupAvailable"), OPTIONS.q21)
        ),
        backupCareSpecify: getAdditionalInfo("backupCareSpecify"),
        careDescription: getAdditionalInfo("careDescription"),
        openNotes: getAdditionalInfo("openNotes"),
        allergiesHealth: toArray(
          canonicalise(getAdditionalInfo("allergiesHealth"), OPTIONS.q7)
        ),
        allergiesHealthSpecify: getAdditionalInfo("allergiesHealthSpecify"),
        childResponsibilities: toArray(
          canonicalise(getAdditionalInfo("childResponsibilities"), OPTIONS.q10)
        ),
        householdAddOns: toArray(
          canonicalise(getAdditionalInfo("householdAddOns"), OPTIONS.q12)
        ),
        parentingStyle: toArray(
          canonicalise(getAdditionalInfo("parentingStyle"), OPTIONS.q15)
        ),
        parentingStyleSpecify: getAdditionalInfo("parentingStyleSpecify"),
        preferredNannyLanguages: toArray(
          canonicalise(getAdditionalInfo("preferredNannyLanguages"), OPTIONS.q16)
        ),
        preferredNannyLanguagesSpecify: getAdditionalInfo("preferredNannyLanguagesSpecify"),
        houseRules: toArray(
          canonicalise(
            getAdditionalInfo("houseRules"),
            houseRuleOptions(getAdditionalInfo("houseRules")),
          )
        ),
        houseRulesSpecify: getAdditionalInfo("houseRulesSpecify"),
        dailyRoutine: toArray(canonicalise(getAdditionalInfo("dailyRoutine"), OPTIONS.q11)),
        pets: toArray(canonicalise(getAdditionalInfo("pets"), OPTIONS.q14)),
        petsSpecify: getAdditionalInfo("petsSpecify"),
        childrenSchools: getAdditionalInfo("childrenSchools")
      };

      const numChildren = getAdditionalInfo("numberOfChildren") || user?.noOfChildren?.length || 0;
      const ages = getAdditionalInfo("childrenAges");

      if (numChildren) {
        setSelectedChildren(Number(numChildren));
        shareFields.totalChild = Number(numChildren);
      }

      if (ages && Array.isArray(ages) && ages.length > 0) {
        const agesMapped = ages.map(a => typeof a === 'object' ? a.label : String(a));
        setChildrenAges(agesMapped);

        agesMapped.forEach((ageStr, i) => {
          let initialNum = ageStr;
          let initialUnit = "years";
          if (typeof ageStr === "string") {
            if (ageStr.includes("month") || ageStr.includes("mo")) {
              initialNum = ageStr.replace(/[^0-9]/g, '');
              initialUnit = "months";
            } else {
              initialNum = ageStr.replace(/[^0-9]/g, '');
            }
          }
          shareFields[`Child${i + 1}`] = initialNum;
          shareFields[`ChildUnit${i + 1}`] = initialUnit;
        });
      } else if (user?.noOfChildren?.info) {
        const info = user.noOfChildren.info;
        const len = Number(numChildren);
        const mappedAges = Array.from({ length: len }, (_, i) => info[`Child${i + 1}`] || "");
        setChildrenAges(mappedAges);

        mappedAges.forEach((ageStr, i) => {
          let initialNum = String(ageStr);
          let initialUnit = "years";
          if (typeof ageStr === "string" && (ageStr.includes("month") || ageStr.includes("mo"))) {
            initialNum = ageStr.replace(/[^0-9]/g, '');
            initialUnit = "months";
          } else if (typeof ageStr === "string") {
            initialNum = ageStr.replace(/[^0-9]/g, '');
          }
          shareFields[`Child${i + 1}`] = initialNum;
          shareFields[`ChildUnit${i + 1}`] = initialUnit;
        });
      }

      form.setFieldsValue(shareFields);

      const specificDaysAndTime = getAdditionalInfo("specificDaysAndTime");
      if (specificDaysAndTime) {
        setDaysState(daysOfWeek.reduce((acc, day) => {
          const specificDay = specificDaysAndTime?.[day];
          acc[day] = {
            checked: !!specificDay?.checked,
            start: specificDay?.start || null,
            end: specificDay?.end || null,
          };
          return acc;
        }, {}));
      }
    }
  }, [user, nannyProfile, form, getAdditionalInfo]);

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
  };

  const [imageUrl, setImageUrl] = useState(user?.imageUrl);
  const [file, setFile] = useState(null);
  const objectUrlRef = useRef("");

  useEffect(() => {
    if (user) {
      const addr = user?.location?.format_location || "";
      setLocation(addr);
      setZipCode(user?.zipCode || "");
      if (user?.location) {
        setCoordinates(
          user?.location
        );
      }
    }
  }, [user, form]);

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
  };

  const handleChildrenChange = (value) => {
    setSelectedChildren(value);
    setChildrenAges((prevAges) => {
      const updatedAges = [...prevAges];
      if (value > updatedAges.length) {
        return [...updatedAges, ...Array(value - updatedAges.length).fill("")];
      } else {
        return updatedAges.slice(0, value);
      }
    });
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();

      if (coordinates) {
        formData.append("location", JSON.stringify(coordinates));
      }

      // Never send an empty zip: the backend would overwrite the stored one,
      // and the dashboard falls back to it when a user has no coordinates.
      const finalZipCode = values.zipCode || zipCode || user?.zipCode;
      if (finalZipCode) {
        formData.append("zipCode", finalZipCode);
      }
      if (values.fullName) formData.append("name", values.fullName);
      if (values.email) formData.append("email", values.email);
      if (values.age) formData.append("age", values.age);
      if (values.gender) formData.append("gender", values.gender);
      if (values.description) formData.append("aboutMe", values.description);

      const childrenInfo = {};
      for (let i = 1; i <= selectedChildren; i++) {
        const ageKey = `Child${i}`;
        if (values[ageKey]) {
          childrenInfo[ageKey] = values[ageKey];
        }
      }

      const noOfChildren = {
        length: Object.keys(childrenInfo).length,
        info: childrenInfo,
      };
      formData.append("noOfChildren", JSON.stringify(noOfChildren));

      // Handle Schedule
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

      const nannyShareFields = [
        "nannyShareType", "hasNanny", "shareLocation", "specifyNearbyWorkplace",
        "careDescription", "flexible", "nannyshareStart", "urgency", "hosting",
        "hourlyRateSplit", "prefferedCommunication", "communicationSpecify",
        "backupAvailable", "backupCareSpecify", "openNotes",
        "allergiesHealth", "allergiesHealthSpecify",
        "childResponsibilities", "householdAddOns",
        "parentingStyle", "parentingStyleSpecify",
        "preferredNannyLanguages", "preferredNannyLanguagesSpecify",
        "houseRules", "houseRulesSpecify", "dailyRoutine", "pets", "petsSpecify",
        "childrenSchools"
      ];

      if (values.services?.length > 0) {
        const camelCaseServices = values.services.map((s) =>
          typeof s === "string" ? toCamelCase(s) : s
        );
        formData.append("services", JSON.stringify(camelCaseServices));
      }

      // --- Family Profile Specific Data for backend schema ---
      const keyMap = {
        flexible: "flexibility",
        hosting: "hostingPreference",
        prefferedCommunication: "communicationPreference",
        backupAvailable: "backupCare",
        hourlyRateSplit: "hourlyBudget"
      };

      // Q1: "Other" means the typed answer is the share type. Lowercased because
      // nannyShareType is queried; the user's own capitalisation is preserved in
      // otherShareTypeSpecify. Mirrors resolveShareType() in onboardingPayload.js.
      const typedShareType = (values.otherShareTypeSpecify || "").trim();
      const resolvedShareType = values.nannyShareType === OTHER_LABEL
        ? typedShareType.toLowerCase()
        : (values.nannyShareType || "");

      // A "specify" answer only counts while its group still has Other selected.
      // antd preserves the value of an unmounted Form.Item, so without this a
      // user who picks Other, types, then deselects it would still send the text.
      const specifyOwner = {
        communicationSpecify: "prefferedCommunication",
        backupCareSpecify: "backupAvailable",
        allergiesHealthSpecify: "allergiesHealth",
        parentingStyleSpecify: "parentingStyle",
        preferredNannyLanguagesSpecify: "preferredNannyLanguages",
        houseRulesSpecify: "houseRules",
        petsSpecify: "pets",
      };

      const familyFormData = new FormData();
      nannyShareFields.forEach(field => {
        const val = values[field] !== undefined && values[field] !== null ? values[field] : "";
        const backendKey = keyMap[field] || field;
        const owner = specifyOwner[field];
        if (owner) {
          const groupHasOther = (values[owner] || []).includes(OTHER_LABEL);
          familyFormData.append(backendKey, groupHasOther ? val : "");
        } else if (field === "nannyShareType") {
          familyFormData.append(backendKey, resolvedShareType);
        } else if (field === "hasNanny") {
          // First word, so either spelling of the option resolves. The old exact
          // match against one hard-coded sentence returned false for everything
          // else, including the wizard's em-dash phrasing.
          const firstWord = String(val).trim().split(" ")[0].toLowerCase();
          familyFormData.append(backendKey, val === true || firstWord === "yes");
        } else if (field === "hourlyRateSplit") {
          // Store the parsed object, never the label. Appending the label here is
          // what silently replaced {min,max,minShare,maxShare} with a string on
          // every save — and share.controller.js reads hourlyBudget.minShare, so
          // the profile then matched every rate band instead of its own.
          //
          // Nothing selected means leave the stored budget alone: sending {} would
          // be the same overwrite in a different shape.
          if (!val) return;
          familyFormData.append(backendKey, JSON.stringify(parseHourlyRate(String(val))));
        } else if (Array.isArray(val)) {
          familyFormData.append(backendKey, JSON.stringify(val));
        } else if (field === "nannyshareStart" && val && typeof val.toISOString === "function") {
          familyFormData.append(backendKey, val.toISOString());
        } else {
          familyFormData.append(backendKey, val);
        }
      });
      familyFormData.append("otherShareTypeSpecify",
        values.nannyShareType === OTHER_LABEL ? typedShareType : "");
      familyFormData.append("specificDays", JSON.stringify(checkedDays));
      familyFormData.append("specificDaysAndTime", JSON.stringify(checkedDays));

      const numChildren = values.totalChild || selectedChildren;
      familyFormData.append("numberOfChildren", numChildren);

      const agesArray = [];
      for (let i = 1; i <= numChildren; i++) {
        if (values[`Child${i}`]) {
          const unit = values[`ChildUnit${i}`] || "years";
          const numValue = Number(values[`Child${i}`]);
          agesArray.push({
            label: `${numValue} ${unit}`,
            value: unit === "months" ? parseFloat((numValue / 12).toFixed(4)) : numValue,
            unit: unit
          });
        }
      }
      if (agesArray.length > 0) {
        familyFormData.append("childrenAges", JSON.stringify(agesArray));
      }

      // Handle photo upload - file is already in state from PhotoUploadField
      if (file) {
        familyFormData.append("imageFile", file);
        formData.append("imageUrl", file);
      }

      const nannyResult = await dispatch(updateNannyProfileThunk(familyFormData)).unwrap();
      await dispatch(editUserThunk(formData)).unwrap();

      if (nannyResult?.data?.photoWarning) {
        fireToastMessage({
          type: "error",
          message:
            "Your profile was updated, but the photo could not be uploaded. You can try again from Edit Profile.",
        });
      } else {
        fireToastMessage({
          success: true,
          message: "Profile updated successfully!",
        });
      }

      // Small delay to let the toast be seen before navigating
      setTimeout(() => {
        navigate("/dashboard");
      }, 600);
    } catch (error) {
      console.error("Update Error:", error);
      fireToastMessage({
        type: "error",
        message: error?.message || "Failed to update profile. Please check your information.",
      });
    } finally {
      setLoading(false);
    }
  };


  const options5 = [
    "Nanny",
    "Private Educator",
    "Swim Instructor",
    "Specialized Caregiver",
    "Sports Coaches",
    "Music Instructor",
    "House Manager",
  ];
  const formattedServiceLabels = user?.services?.map((s) => formatSentence(s)) || [];

  return (
    <div className="min-h-screen pb-24 bg-gray-50/30">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-12 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <NavLink to="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-[#001243]" />
            </NavLink>
            <div className="flex flex-col">
              <h1 className="Livvic-Bold text-xl md:text-2xl text-[#001243]">Edit Profile</h1>
              <p className="text-gray-500 text-sm md:text-base Livvic-Medium mt-1">Keep your family information up to date</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NavLink to="/dashboard">
              <button className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full border border-gray-200 text-gray-500 Livvic-SemiBold hover:bg-gray-50 transition-all cursor-pointer bg-transparent">
                <X className="w-4 h-4" /> Discard
              </button>
            </NavLink>
            <button
              onClick={() => form.submit()}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2 rounded-full bg-[#AEC4FF] text-[#001243] Livvic-SemiBold shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer border-none"
            >
              {loading ? <Spin size="small" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 mt-4 md:mt-8 mb-12">
        <Form
          id="editProfileForm"
          onFinish={onFinish}
          onFinishFailed={handleFinishFailed}
          autoComplete="off"
          form={form}
          layout="vertical"
          scrollToFirstError={SCROLL_TO_FIRST_ERROR}
          className="edit-profile-form"
        >
          <div className="flex flex-col xl:flex-row gap-6 mb-8 items-stretch">
            {/* Profile Photo */}
            <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100 w-full xl:w-[320px] shrink-0 text-center flex flex-col justify-center">
              <h3 className="text-lg Livvic-Bold text-[#001243] mb-6">Profile Photo</h3>
              <div className="mt-6">
                <PhotoUploadField
                  previewUrl={imageUrl}
                  onSelect={handlePhotoChange}
                  onRemove={() => handlePhotoChange(null)}
                />
              </div>
              <p className="text-gray-400 text-xs md:text-sm Livvic-Medium mt-4 leading-relaxed px-2 md:px-4">
                Upload a clear photo of your family. This helps nannies feel more connected to you.
              </p>
            </section>

            {/* Live Preview Section */}
            <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100 flex-1 flex flex-col min-w-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="Livvic-Bold text-lg text-[#001243] flex items-center gap-2">
                    {showPreview ? (
                      <Eye className="w-5 h-5 text-[#001243] cursor-pointer hover:text-[#AEC4FF] transition-colors" onClick={() => setShowPreview(false)} />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" onClick={() => setShowPreview(true)} />
                    )}
                    Live Preview
                  </h2>
                  <p className="text-gray-400 text-sm Livvic-Medium mt-1">This is how nannies will see your profile.</p>
                </div>
              </div>

              <div className="relative flex-1 w-full mt-2">
                <div className={`w-full pointer-events-none ${showPreview ? "block" : "invisible"}`}>
                  <FamilyProfile
                    name={formValues?.fullName || user?.name}
                    userId={user?._id}
                    id={user?._id}
                    sharedRate={formValues?.hourlyRateSplit || budgetSelectValue(nannyProfile?.hourlyBudget) || "N/A"}
                    soloRate={"N/A"}
                    ages={childrenAges}
                    childrenCount={selectedChildren || nannyProfile?.numberOfChildren}
                    hasNanny={formValues?.hasNanny === OPTIONS.q2[0] ? true : formValues?.hasNanny === OPTIONS.q2[1] ? false : nannyProfile?.hasNanny}
                    img={imageUrl || user?.imageUrl}
                    careType={
                      formValues?.nannyShareType === OTHER_LABEL
                        ? (formValues?.otherShareTypeSpecify || "").trim().toLowerCase() ||
                          nannyProfile?.nannyShareType
                        : formValues?.nannyShareType || nannyProfile?.nannyShareType
                    }
                    schedule={daysState}
                    location={{ format_location: location || user?.location?.format_location }}
                    hosting={formValues?.hosting || nannyProfile?.hostingPreference}
                    start={formValues?.nannyshareStart || nannyProfile?.nannyshareStart}
                    shareLocation={formValues?.shareLocation || nannyProfile?.shareLocation}
                  />
                </div>
                {!showPreview && (
                  <div className="absolute inset-0 w-full h-full bg-[#f8f9fb] rounded-xl flex items-center justify-center border border-gray-100 p-4 text-gray-400 Livvic-Medium">
                    Preview is hidden. Click the eye icon to view.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Form Fields - Main Column */}
          <div className="space-y-8 w-full">

            {/* Card 1: Basic Information */}
            <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                <UserIcon size={20} className="text-[#AEC4FF]" />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item
                  label={<span className="Livvic-SemiBold text-gray-500">Full Name</span>}
                  name="fullName"
                  initialValue={user?.name}
                  rules={requiredText("Full name is required")}
                >
                  <Input
                    className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium focus:border-[#AEC4FF] focus:ring-0"
                    placeholder="Enter your full name"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="Livvic-SemiBold text-gray-500">Email Address</span>}
                  name="email"
                  initialValue={user?.email}
                  rules={[
                    { required: true, message: "Email is required" },
                    { type: "email", message: "Enter a valid email address" },
                  ]}
                >
                  <Input
                    type="email"
                    className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium focus:border-[#AEC4FF] focus:ring-0"
                    placeholder="Enter your email address"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="Livvic-SemiBold text-gray-500">Address</span>}
                  name="location"
                  initialValue={user?.location?.format_location}
                  rules={[{ required: true, message: "Address is required" }]}
                >
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
                </Form.Item>

                <Form.Item
                  label={<span className="Livvic-SemiBold text-gray-500">Zip Code</span>}
                  name="zipCode"
                  initialValue={user?.zipCode || zipCode}
                  rules={requiredText("Zip code is required")}
                >
                  <Input
                    className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium focus:border-[#AEC4FF] focus:ring-0"
                    placeholder="Enter zip code"
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="Livvic-SemiBold text-gray-500">Gender</span>}
                  name="gender"
                  initialValue={user?.gender}
                >
                  <Select
                    className="w-full h-[50px] Livvic-Medium"
                    placeholder="Select gender"
                  >
                    <Select.Option value="Male">Male</Select.Option>
                    <Select.Option value="Female">Female</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label={<span className="Livvic-SemiBold text-gray-500">Age</span>}
                  name="age"
                  initialValue={user?.age}
                >
                  <Input
                    type="number"
                    className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium focus:border-[#AEC4FF]"
                    placeholder="Enter your age"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Card 2: About Your Family — user.aboutMe, an account field the
                questionnaire never asks, so it keeps its own heading above the
                five step cards rather than being folded into one of them. */}
            <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                <Info size={20} className="text-[#AEC4FF]" />
                About Your Family
              </h3>
              <Form.Item
                name="description"
                initialValue={user?.aboutMe}
              >
                <TextArea
                  rows={6}
                  className="rounded-2xl border-gray-200 p-4 Livvic-Medium focus:border-[#AEC4FF] resize-none"
                  placeholder="Tell nannies about your family, your values, and what you're looking for..."
                />
              </Form.Item>
            </div>

            {/* ── Step 1 ─────────────────────────────────────────────────── */}
            <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                <Users size={20} className="text-[#AEC4FF]" />
                {GROUP_TITLE[1]}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.nannyShareType}</span>} name="nannyShareType" rules={requiredRules("nannyShareType")}>
                  <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select type">
                    {SHARE_TYPE_OPTIONS.map((option) => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {formValues?.nannyShareType === OTHER_LABEL && (
                  <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Describe the share you need</span>} name="otherShareTypeSpecify" rules={requiredText("Please describe the share you need")}>
                    <Input className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium" placeholder="e.g. Weekend nanny share" />
                  </Form.Item>
                )}

                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.hasNanny}</span>} name="hasNanny" rules={requiredRules("hasNanny")}>
                  <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select option">
                    {renderOptions(OPTIONS.q2)}
                  </Select>
                </Form.Item>

                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.nannyshareStart}</span>} name="nannyshareStart" rules={requiredRules("nannyshareStart")}>
                  <DatePicker className="w-full h-[50px] rounded-xl border-gray-200 Livvic-Medium" format="MMMM D, YYYY" />
                </Form.Item>

                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.urgency}</span>} name="urgency" rules={requiredRules("urgency")}>
                  <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select urgency">
                    {renderOptions(OPTIONS.q4)}
                  </Select>
                </Form.Item>
              </div>
            </div>

            {/* ── Step 2 ─────────────────────────────────────────────────── */}
            <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                <Baby size={20} className="text-[#AEC4FF]" />
                {GROUP_TITLE[2]}
              </h3>

              <Form.Item
                label={<span className="Livvic-SemiBold text-gray-500">{LABEL.numberOfChildren}</span>}
                name="totalChild"
                initialValue={selectedChildren}
                rules={requiredRules("numberOfChildren")}
              >
                <Select
                  onChange={handleChildrenChange}
                  className="w-full h-[50px] Livvic-Medium"
                  placeholder="How many children?"
                >
                  {childCountOptions(selectedChildren).map((num) => (
                    <Select.Option key={num} value={num}>{num}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {childrenAges.map((age, index) => {
                  let initialNum = age;
                  let initialUnit = "years";
                  if (typeof age === "string") {
                    if (age.includes("month") || age.includes("mo")) {
                      initialNum = age.replace(/[^0-9]/g, '');
                      initialUnit = "months";
                    } else {
                      initialNum = age.replace(/[^0-9]/g, '');
                    }
                  }

                  return (
                    <Form.Item
                      key={index}
                      label={<span className="Livvic-SemiBold text-gray-500">Age of Child {index + 1}</span>}
                      className="mb-0"
                    >
                      <div className="flex gap-2">
                        <Form.Item
                          name={`Child${index + 1}`}
                          initialValue={initialNum}
                          className="mb-0 flex-1"
                          rules={[{ required: true, message: "Please enter an age greater than 0 for every child." }]}
                        >
                          <Input
                            type="number"
                            className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium"
                            placeholder="Age"
                          />
                        </Form.Item>
                        <Form.Item
                          name={`ChildUnit${index + 1}`}
                          initialValue={initialUnit}
                          className="mb-0"
                        >
                          <Select className="h-[48px] min-w-[100px] rounded-xl Livvic-Medium">
                            <Select.Option value="years">Years</Select.Option>
                            <Select.Option value="months">Months</Select.Option>
                          </Select>
                        </Form.Item>
                      </div>
                    </Form.Item>
                  );
                })}
              </div>

              {/*
                * Q6. Collected at onboarding and shown on the profile, but this
                * form had no input for it — so a family could never correct a
                * school name once it was wrong. The placeholder comes from the
                * wizard's own question rather than a second copy of it.
                */}
              <Form.Item
                label={<span className="Livvic-SemiBold text-gray-500">{LABEL.childrenSchools}</span>}
                name="childrenSchools"
                className="mt-6"
              >
                <Input
                  className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium"
                  placeholder={PLACEHOLDER.childrenSchools}
                />
              </Form.Item>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.allergiesHealth}</span>} name="allergiesHealth" rules={requiredRules("allergiesHealth")}>
                  <Select mode="multiple" className="w-full h-[50px] Livvic-Medium" placeholder="Select allergies">
                    {renderOptions(OPTIONS.q7)}
                  </Select>
                </Form.Item>

                {hasOther("allergiesHealth") && (
                  <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Other allergy or health need</span>} name="allergiesHealthSpecify">
                    <Input className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium" placeholder="Please specify" />
                  </Form.Item>
                )}
              </div>
            </div>

            {/* ── Step 3 ─────────────────────────────────────────────────── */}
            <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                <CalendarIcon size={20} className="text-[#AEC4FF]" />
                {GROUP_TITLE[3]}
              </h3>

              {/* Q8. The questionnaire asks the days and times first in this
                  step, so they lead the card instead of sitting in one of their
                  own three sections further down the page. */}
              <p className="Livvic-SemiBold text-gray-500 mb-4">
                {LABEL.specificDays} <span className="text-red-500">*</span>
              </p>
              <Form.Item
                name="_scheduleRequired"
                className="mb-0"
                rules={[{
                  validator: async () => {
                    if (!Object.values(daysState).some((day) => day.checked)) {
                      throw new Error(ERROR_MESSAGES.q8);
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
                      daysState[day].checked
                        ? 'border-[#AEC4FF] bg-[#FFF8FA]'
                        : invalid
                          ? 'border-red-300 bg-red-50/60'
                          : 'border-gray-100 bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                      <Checkbox
                        checked={daysState[day].checked}
                        onChange={() => handleCheckboxChange(day)}
                        className="scale-110"
                      />
                      <span className={`Livvic-Bold text-lg ${daysState[day].checked ? 'text-[#001243]' : 'text-gray-400'}`}>
                        {day}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <TimePicker
                        value={daysState[day].start ? parseTime(daysState[day].start) : null}
                        placeholder="Start Time"
                        onChange={(time) => handleTimeChange(day, "start", time)}
                        disabled={!daysState[day].checked}
                        format="h:mm A"
                        className="rounded-xl border-gray-200 py-2 Livvic-Medium w-32"
                        suffixIcon={<Clock size={14} />}
                      />
                      <span className="text-gray-300">to</span>
                      <TimePicker
                        value={daysState[day].end ? parseTime(daysState[day].end) : null}
                        placeholder="End Time"
                        onChange={(time) => handleTimeChange(day, "end", time)}
                        disabled={!daysState[day].checked}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.flexibility}</span>} name="flexible" rules={requiredRules("flexibility")}>
                  <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select flexibility">
                    {renderOptions(OPTIONS.q9)}
                  </Select>
                </Form.Item>

                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.childResponsibilities}</span>} name="childResponsibilities" rules={requiredRules("childResponsibilities")}>
                  <Select mode="multiple" className="w-full h-[50px] Livvic-Medium" placeholder="Select responsibilities">
                    {renderOptions(OPTIONS.q10)}
                  </Select>
                </Form.Item>

                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.dailyRoutine}</span>} name="dailyRoutine">
                  <Select mode="multiple" className="w-full h-[50px] Livvic-Medium" placeholder="Select routines">
                    {renderOptions(OPTIONS.q11)}
                  </Select>
                </Form.Item>

                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.householdAddOns}</span>} name="householdAddOns">
                  <Select mode="multiple" className="w-full h-[50px] Livvic-Medium" placeholder="Select household tasks">
                    {renderOptions(OPTIONS.q12)}
                  </Select>
                </Form.Item>
              </div>
            </div>

            {/* ── Step 4 ─────────────────────────────────────────────────── */}
            <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                <Heart size={20} className="text-[#AEC4FF]" />
                {GROUP_TITLE[4]}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.hostingPreference}</span>} name="hosting" rules={requiredRules("hostingPreference")}>
                  <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select hosting">
                    {renderOptions(OPTIONS.q13)}
                  </Select>
                </Form.Item>

                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.pets}</span>} name="pets" rules={requiredRules("pets")}>
                  <Select mode="multiple" className="w-full h-[50px] Livvic-Medium" placeholder="Select pets">
                    {renderOptions(OPTIONS.q14)}
                  </Select>
                </Form.Item>

                {hasOther("pets") && (
                  <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Other pets</span>} name="petsSpecify">
                    <Input className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium" placeholder="Please specify" />
                  </Form.Item>
                )}

                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.parentingStyle}</span>} name="parentingStyle">
                  <Select mode="multiple" className="w-full h-[50px] Livvic-Medium" placeholder="Select style">
                    {renderOptions(OPTIONS.q15)}
                  </Select>
                </Form.Item>

                {hasOther("parentingStyle") && (
                  <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Other parenting style</span>} name="parentingStyleSpecify">
                    <Input className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium" placeholder="Please specify" />
                  </Form.Item>
                )}

                {/* The questionnaire asks this (Q16) and nothing here could edit
                    it, so a family could set a language preference once and never
                    change it. */}
                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.preferredNannyLanguages}</span>} name="preferredNannyLanguages">
                  <Select mode="multiple" className="w-full h-[50px] Livvic-Medium" placeholder="Select languages">
                    {renderOptions(OPTIONS.q16)}
                  </Select>
                </Form.Item>

                {hasOther("preferredNannyLanguages") && (
                  <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Other language</span>} name="preferredNannyLanguagesSpecify">
                    <Input className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium" placeholder="Please specify" />
                  </Form.Item>
                )}

                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.houseRules}</span>} name="houseRules">
                  <Select mode="multiple" className="w-full h-[50px] Livvic-Medium" placeholder="Select rules">
                    {renderOptions(houseRuleOptions(formValues?.houseRules))}
                  </Select>
                </Form.Item>

                {hasOther("houseRules") && (
                  <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Other house rule</span>} name="houseRulesSpecify">
                    <Input className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium" placeholder="Please specify" />
                  </Form.Item>
                )}
              </div>
            </div>

            {/* ── Step 5 ─────────────────────────────────────────────────────
                The photo (Q23) belongs to this step in the questionnaire, but it
                stays in the panel beside the Live Preview at the top of the page:
                seeing the card update as you change the picture is the whole
                point of that pairing, and the nanny form is laid out the same
                way. Every other Q18–Q22 answer is here. */}
            <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                <MapPin size={20} className="text-[#AEC4FF]" />
                {GROUP_TITLE[5]}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.shareLocation}</span>} name="shareLocation" rules={requiredRules("shareLocation")}>
                  <Select mode="multiple" className="w-full h-[50px] Livvic-Medium" placeholder="Select locations">
                    {renderOptions(OPTIONS.q18)}
                  </Select>
                </Form.Item>

                {/* Revealed by the "Near my workplace" choice, exactly as in the
                    questionnaire. It used to render unconditionally, so a family
                    who never picked that location was still asked for a work
                    address. Its label is the wizard's placeholder — the only
                    user-visible description that input has. */}
                {isRevealed(formValues?.shareLocation, FIELD.shareLocation.reveal.when) && (
                  <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{FIELD.shareLocation.reveal.label}</span>} name="specifyNearbyWorkplace">
                    <Input className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium" placeholder="Enter work location" />
                  </Form.Item>
                )}

                {/* Stores the same labelled string the questionnaire stores, so
                    parseHourlyRate can turn it back into the four numbers the
                    browse filter reads. The two-line display comes from the
                    wizard's own budget cards. */}
                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.hourlyBudget}</span>} name="hourlyRateSplit" rules={requiredRules("hourlyBudget")}>
                  <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select budget">
                    {BUDGET_OPTIONS.map((option) => (
                      <Select.Option key={option.value} value={option.value}>
                        {`${option.total} · ${option.per}`}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.communicationPreference}</span>} name="prefferedCommunication" rules={requiredRules("communicationPreference")}>
                  <Select mode="multiple" className="w-full h-[50px] Livvic-Medium" placeholder="Select communication">
                    {renderOptions(OPTIONS.q20)}
                  </Select>
                </Form.Item>

                {hasOther("prefferedCommunication") && (
                  <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Other communication preference</span>} name="communicationSpecify">
                    <Input className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium" placeholder="Please specify" />
                  </Form.Item>
                )}

                <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.backupCare}</span>} name="backupAvailable">
                  <Select mode="multiple" className="w-full h-[50px] Livvic-Medium" placeholder="Select backup">
                    {renderOptions(OPTIONS.q21)}
                  </Select>
                </Form.Item>

                {hasOther("backupAvailable") && (
                  <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Other backup option</span>} name="backupCareSpecify">
                    <Input className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium" placeholder="Please specify" />
                  </Form.Item>
                )}
              </div>

              <Form.Item label={<span className="Livvic-SemiBold text-gray-500">{LABEL.openNotes}</span>} name="openNotes" initialValue={getAdditionalInfo("openNotes")} className="mt-4">
                <TextArea rows={4} className="rounded-2xl border-gray-200 p-4 Livvic-Medium" placeholder="Anything else another family should know?" />
              </Form.Item>
            </div>

            {/* ── Additional details ─────────────────────────────────────────
                careDescription belongs to no questionnaire step — it is kept
                because real profiles hold it, not because anything asks it. The
                profile view gives it the same heading. */}
            <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
                <Info size={20} className="text-[#AEC4FF]" />
                Additional details
              </h3>

              <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Care Description</span>} name="careDescription" initialValue={getAdditionalInfo("careDescription")}>
                <TextArea rows={4} className="rounded-2xl border-gray-200 p-4 Livvic-Medium" placeholder="Describe the type of care you're looking for..." />
              </Form.Item>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
