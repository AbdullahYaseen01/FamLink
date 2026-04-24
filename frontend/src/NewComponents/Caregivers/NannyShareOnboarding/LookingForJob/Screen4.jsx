import React, { useEffect, useState } from "react";
import { Form, Input, Slider, Upload } from "antd";
import { PlusOutlined } from "@ant-design/icons";

// ── Reusable pill selector ──────────────────────────────────────────────────
function PillGroup({ options, value = [], onChange, multi = false }) {
  const toggle = (opt) => {
    if (multi) {
      const next = value.includes(opt)
        ? value.filter((v) => v !== opt)
        : [...value, opt];
      onChange?.(next);
    } else {
      onChange?.(value === opt ? null : opt);
    }
  };

  const isSelected = (opt) =>
    multi ? value.includes(opt) : value === opt;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className="px-4 py-2 rounded-full text-sm Livvic-SemiBold border transition-all duration-150 active:scale-95"
          style={
            isSelected(opt)
              ? {
                  backgroundColor: "var(--color-primary, #2D6A4F)",
                  color: "#fff",
                  borderColor: "var(--color-primary, #2D6A4F)",
                }
              : {
                  backgroundColor: "#fff",
                  color: "#374151",
                  borderColor: "#E5E7EB",
                }
          }
        >
          {isSelected(opt) ? "✓ " : ""}
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────────────
function Section({ emoji, title, children, delay = "0ms", visible }) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease ${delay}, transform 0.5s ease ${delay}`,
      }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4"
    >
      <p className="Livvic-Bold text-primary text-lg mb-4">
        {emoji} {title}
      </p>
      {children}
    </div>
  );
}

function Question({ label, children }) {
  return (
    <div className="mb-4">
      <p className="Livvic-SemiBold text-gray-700 text-sm mb-2">{label}</p>
      {children}
    </div>
  );
}

// ── Day + Time picker ───────────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = ["Morning", "Afternoon", "Evening"];

function DayTimePicker({ value = {}, onChange }) {
  const toggle = (day, time) => {
    const current = value[day] || [];
    const next = current.includes(time)
      ? current.filter((t) => t !== time)
      : [...current, time];
    onChange?.({ ...value, [day]: next });
  };

  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-xs Livvic">
        <thead>
          <tr>
            <th className="text-left text-gray-400 pb-2 font-normal w-16" />
            {TIMES.map((t) => (
              <th key={t} className="text-gray-400 pb-2 font-normal text-center">
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => (
            <tr key={day}>
              <td className="py-1 text-gray-600 Livvic-SemiBold">{day}</td>
              {TIMES.map((time) => {
                const selected = (value[day] || []).includes(time);
                return (
                  <td key={time} className="py-1 text-center">
                    <button
                      type="button"
                      onClick={() => toggle(day, time)}
                      className="w-8 h-8 rounded-lg border transition-all duration-150 active:scale-90 mx-auto block"
                      style={
                        selected
                          ? {
                              backgroundColor: "var(--color-primary, #2D6A4F)",
                              borderColor: "var(--color-primary, #2D6A4F)",
                            }
                          : { backgroundColor: "#F9FAFB", borderColor: "#E5E7EB" }
                      }
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Rate slider ─────────────────────────────────────────────────────────────
function RateSlider({ value = [18, 25], onChange }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm Livvic-SemiBold text-primary mb-2">
        <span>${value[0]}/hr</span>
        <span>${value[1]}/hr</span>
      </div>
      <Slider
        range
        min={10}
        max={60}
        value={value}
        onChange={onChange}
        trackStyle={[{ backgroundColor: "var(--color-primary, #2D6A4F)" }]}
        handleStyle={[
          { borderColor: "var(--color-primary, #2D6A4F)", backgroundColor: "#fff" },
          { borderColor: "var(--color-primary, #2D6A4F)", backgroundColor: "#fff" },
        ]}
      />
      <div className="flex justify-between text-xs text-gray-400 Livvic mt-1">
        <span>Per caregiver</span>
        <span className="text-primary Livvic-SemiBold">
          Each family pays ~${Math.round((value[0] + value[1]) / 2 / 2)}/hr split
        </span>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
const Screen4 = ({ formRef, onSubmit }) => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);

  // field state
  const [workedShare, setWorkedShare] = useState(null);
  const [comfortableMulti, setComfortableMulti] = useState(null);
  const [numChildren, setNumChildren] = useState(null);
  const [ageGroups, setAgeGroups] = useState([]);
  const [homeType, setHomeType] = useState(null);
  const [availability, setAvailability] = useState({});
  const [startWhen, setStartWhen] = useState(null);
  const [roles, setRoles] = useState([]);
  const [householdTasks, setHouseholdTasks] = useState(null);
  const [transport, setTransport] = useState(null);
  const [bgCheck, setBgCheck] = useState(null);
  const [rate, setRate] = useState([18, 25]);
  const [certs, setCerts] = useState([]);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (formRef) formRef.current = form;
  }, [formRef, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const payload = {
        ...values,
        workedShare,
        comfortableMulti,
        numChildren,
        ageGroups,
        homeType,
        availability,
        startWhen,
        roles,
        householdTasks,
        transport,
        bgCheck,
        rate,
        certs,
      };
      onSubmit?.(payload);
    });
  };

  return (
    <div className="pb-32 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-16px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
        className="text-center mb-6"
      >
        <p className="text-primary Livvic-Bold text-4xl mb-1">
          Complete Your Profile
        </p>
        <p className="text-gray-400 Livvic text-sm">
          Required to start matching with families
        </p>
      </div>

      <Form form={form} autoComplete="off">

        {/* ── Share Compatibility ── */}
        <Section emoji="🤝" title="Share Compatibility" delay="0ms" visible={visible}>
          <Question label="Have you worked in a nanny share before?">
            <PillGroup
              options={["Yes", "No"]}
              value={workedShare}
              onChange={setWorkedShare}
            />
          </Question>
          <Question label="Are you comfortable caring for children from multiple families?">
            <PillGroup
              options={["Yes", "No"]}
              value={comfortableMulti}
              onChange={setComfortableMulti}
            />
          </Question>
          <Question label="What number of children are you most comfortable caring for?">
            <PillGroup
              options={["1–2", "2–3", "3–4", "Flexible"]}
              value={numChildren}
              onChange={setNumChildren}
            />
          </Question>
          <Question label="What ages do you prefer to work with? (select all)">
            <PillGroup
              options={["Infants (0–1)", "Toddlers (1–3)", "Preschool (3–5)", "School-age (5+)"]}
              value={ageGroups}
              onChange={setAgeGroups}
              multi
            />
          </Question>
          <Question label="Are you okay working in:">
            <PillGroup
              options={["One home", "Rotating homes", "Either"]}
              value={homeType}
              onChange={setHomeType}
            />
          </Question>
        </Section>

        {/* ── Availability ── */}
        <Section emoji="📅" title="Availability" delay="80ms" visible={visible}>
          <Question label="Select your working days and times">
            <DayTimePicker value={availability} onChange={setAvailability} />
          </Question>
          <Question label="When are you available to start?">
            <PillGroup
              options={["Immediately", "Within 2 weeks", "Within a month", "Flexible"]}
              value={startWhen}
              onChange={setStartWhen}
            />
          </Question>
        </Section>

        {/* ── Role & Expectations ── */}
        <Section emoji="📋" title="Role & Expectations" delay="160ms" visible={visible}>
          <Question label="What would your role typically include? (select all)">
            <PillGroup
              options={[
                "Childcare",
                "Meal/snack prep",
                "Educational activities",
                "Outdoor play",
                "Transportation",
                "Homework help",
                "Nap/bedtime routines",
              ]}
              value={roles}
              onChange={setRoles}
              multi
            />
          </Question>
          <Question label="Are you open to helping with household tasks?">
            <PillGroup
              options={[
                "Yes — both child-related and family-related",
                "Child-related tasks only",
                "No — childcare only",
              ]}
              value={householdTasks}
              onChange={setHouseholdTasks}
            />
          </Question>
        </Section>

        {/* ── Trust Signals ── */}
        <Section emoji="✅" title="Trust Signals" delay="240ms" visible={visible}>
          <Question label="Do you have your own reliable transportation?">
            <PillGroup
              options={["Yes", "No"]}
              value={transport}
              onChange={setTransport}
            />
          </Question>
          <Question label="Are you open to undergoing a background check?">
            <PillGroup
              options={["Yes", "No"]}
              value={bgCheck}
              onChange={setBgCheck}
            />
          </Question>
        </Section>

        {/* ── Pay ── */}
        <Section emoji="💰" title="Pay" delay="320ms" visible={visible}>
          <Question label="What is your total hourly rate for a nanny share?">
            <RateSlider value={rate} onChange={setRate} />
          </Question>
        </Section>

        {/* ── Profile ── */}
        <Section emoji="👤" title="Profile" delay="400ms" visible={visible}>
          {/* Bio */}
          <Question label="Write a short bio">
            <Form.Item
              name="bio"
              rules={[{ required: true, message: "Please write a short bio" }]}
            >
              <div className="relative">
                <textarea
                  rows={4}
                  placeholder="Tell families a little about yourself…"
                  className="w-full px-4 pt-5 pb-3 border border-gray-200 rounded-xl text-sm Livvic text-gray-700 focus:outline-none focus:border-primary resize-none transition-colors"
                  onChange={(e) => form.setFieldsValue({ bio: e.target.value })}
                />
                <label className="absolute left-4 top-2 text-xs text-gray-400 Livvic pointer-events-none">
                  Bio
                </label>
              </div>
            </Form.Item>
          </Question>

          {/* Certifications */}
          <Question label="Do you have any certifications? (select all)">
            <PillGroup
              options={[
                "CPR Certified",
                "First Aid Certified",
                "Early Childhood Education (ECE)",
                "TrustLine Registered",
                "Other",
              ]}
              value={certs}
              onChange={setCerts}
              multi
            />
          </Question>

          {/* Additional certs */}
          <Question label="Add any additional certifications or training (optional)">
            <Form.Item name="additionalCerts">
              <div className="relative">
                <input
                  placeholder=" "
                  type="text"
                  className="w-full px-4 pt-6 pb-2 border border-gray-200 rounded-xl text-sm Livvic text-gray-700 focus:outline-none focus:border-primary transition-colors"
                  onChange={(e) =>
                    form.setFieldsValue({ additionalCerts: e.target.value })
                  }
                />
                <label className="absolute left-4 top-2 text-xs text-gray-400 Livvic pointer-events-none">
                  Additional certifications
                </label>
              </div>
            </Form.Item>
          </Question>

          {/* Special skills */}
          <Question label="List any special skills (optional)">
            <Form.Item name="specialSkills">
              <div className="relative">
                <input
                  placeholder=" "
                  type="text"
                  className="w-full px-4 pt-6 pb-2 border border-gray-200 rounded-xl text-sm Livvic text-gray-700 focus:outline-none focus:border-primary transition-colors"
                  onChange={(e) =>
                    form.setFieldsValue({ specialSkills: e.target.value })
                  }
                />
                <label className="absolute left-4 top-2 text-xs text-gray-400 Livvic pointer-events-none">
                  Special skills
                </label>
              </div>
            </Form.Item>
          </Question>

          {/* Photo upload */}
          <Question label="Upload a photo">
            <Upload
              listType="picture-circle"
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
              beforeUpload={() => false}
              maxCount={1}
            >
              {fileList.length === 0 && (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <PlusOutlined />
                  <span className="text-xs Livvic mt-1">Photo</span>
                </div>
              )}
            </Upload>
          </Question>
        </Section>

      </Form>

      {/* Sticky submit */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.5s ease 500ms",
        }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 shadow-lg"
      >
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-4 rounded-xl Livvic-SemiBold text-white text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--color-primary, #2D6A4F)" }}
          >
            Complete Profile
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Screen4;