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

// ── Rate slider ─────────────────────────────────────────────────────────────
function RateSlider({ value = 25, onChange }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm Livvic-SemiBold text-primary mb-2">
        <span>${value}/hr</span>
      </div>
      <Slider
        min={20}
        max={60}
        value={value}
        onChange={onChange}
        trackStyle={[{ backgroundColor: "var(--color-primary, #2D6A4F)" }]}
        handleStyle={[
          { borderColor: "var(--color-primary, #2D6A4F)", backgroundColor: "#fff" },
        ]}
      />
      <div className="flex justify-between text-xs text-gray-400 Livvic mt-1">
        <span>Total hourly rate</span>
        <span className="text-primary Livvic-SemiBold">
          Each family pays ~${Math.round(value * 0.6)}/hr (60%)
        </span>
      </div>
    </div>
  );
}

function Screen4({ formRef }) {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [fileList, setFileList] = useState([]);

  // Field states to sync with form
  const [whereCare, setWhereCare] = useState(null);
  const [flexibility, setFlexibility] = useState(null);
  const [matchFit, setMatchFit] = useState(null);
  const [matchDistance, setMatchDistance] = useState(null);
  const [hasTransport, setHasTransport] = useState(null);
  const [openToBackground, setOpenToBackground] = useState(null);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [certifications, setCertifications] = useState([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (formRef) formRef.current = form;
    form.setFieldsValue({
      whereCare,
      flexibility,
      matchFit,
      matchDistance,
      hasTransport,
      openToBackground,
      hourlyRate,
      certifications
    });
  }, [formRef, form, whereCare, flexibility, matchFit, matchDistance, hasTransport, openToBackground, hourlyRate, certifications]);

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
          Share Details
        </p>
        <p className="text-gray-400 Livvic text-sm">
          Required to start matching with families
        </p>
      </div>

      <Form form={form} autoComplete="off">
        {/* ── Setup ── */}
        <Section emoji="🏠" title="Setup" delay="0ms" visible={visible}>
          <Question label="Where would care take place?">
            <PillGroup
              options={["Current home", "Rotating homes", "Flexible"]}
              value={whereCare}
              onChange={setWhereCare}
            />
          </Question>
          <Question label="How flexible is your schedule for a second family?">
            <PillGroup
              options={["Very flexible", "Somewhat flexible", "Fixed"]}
              value={flexibility}
              onChange={setFlexibility}
            />
          </Question>
        </Section>

        {/* ── Pay ── */}
        <Section emoji="💰" title="Pay" delay="80ms" visible={visible}>
          <Question label="What is your total hourly rate for a nanny share?">
            <RateSlider
              value={hourlyRate}
              onChange={(val) => {
                setHourlyRate(val);
                form.setFieldsValue({ hourlyRate: val });
              }}
            />
          </Question>
        </Section>

        {/* ── Match Preferences ── */}
        <Section emoji="🤝" title="Match Preferences" delay="160ms" visible={visible}>
          <Question label="What type of child would be the best fit?">
            <PillGroup
              options={["Similar age", "Younger", "Older", "Flexible"]}
              value={matchFit}
              onChange={setMatchFit}
            />
          </Question>
          <Question label="How close should the other family be?">
            <PillGroup
              options={["1-2 miles", "3-5 miles", "5-10 miles", "Flexible"]}
              value={matchDistance}
              onChange={setMatchDistance}
            />
          </Question>
        </Section>

        {/* ── Trust Signals ── */}
        <Section emoji="✅" title="Trust Signals" delay="240ms" visible={visible}>
          <Question label="Do you have your own reliable transportation?">
            <PillGroup
              options={["Yes", "No"]}
              value={hasTransport}
              onChange={setHasTransport}
            />
          </Question>
          <Question label="Are you open to undergoing a background check?">
            <PillGroup
              options={["Yes", "No"]}
              value={openToBackground}
              onChange={setOpenToBackground}
            />
          </Question>
        </Section>

        {/* ── Profile ── */}
        <Section emoji="👤" title="Light Profile" delay="320ms" visible={visible}>
          <Question label="Tell us about the family you work for">
            <Form.Item
              name="description"
              rules={[{ required: true, message: "Please tell us a little bit" }]}
            >
              <div className="relative">
                <textarea
                  rows={4}
                  placeholder="Tell us about the family you work for, your experience…"
                  className="w-full px-4 pt-5 pb-3 border border-gray-200 rounded-xl text-sm Livvic text-gray-700 focus:outline-none focus:border-primary resize-none transition-colors"
                  onChange={(e) => form.setFieldsValue({ description: e.target.value })}
                />
                <label className="absolute left-4 top-2 text-xs text-gray-400 Livvic pointer-events-none">
                  Description
                </label>
              </div>
            </Form.Item>
          </Question>

          <Question label="Do you have any certifications? (select all)">
            <PillGroup
              options={["CPR Certified", "First Aid Certified", "Other"]}
              value={certifications}
              onChange={setCertifications}
              multi
            />
          </Question>

          <Question label="Upload a photo (recommended)">
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
    </div>
  );
}

export default Screen4;
