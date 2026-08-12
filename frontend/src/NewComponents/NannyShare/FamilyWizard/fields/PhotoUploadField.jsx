import { useRef } from "react";
import { Upload } from "lucide-react";
import { fireToastMessage } from "../../../../toastContainer";

/*
 * Q23. The full-width dashed upload area from the spec — not the 96px circle the
 * caregiver CompleteProfile steps use.
 *
 * The preview URL is an object URL owned by the container (it holds the File, so
 * it also owns the URL's lifetime and revokes it). The mockup reads the file
 * with FileReader.readAsDataURL, which parks a multi-MB base64 string in state
 * and re-renders the card on it; createObjectURL is a handle instead.
 */

const MAX_BYTES = 10 * 1024 * 1024;

export default function PhotoUploadField({
  previewUrl = "",
  onSelect,
  onRemove,
  maxBytes = MAX_BYTES,
}) {
  const inputRef = useRef(null);

  function handleChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxBytes) {
      fireToastMessage({
        type: "error",
        message: `That photo is ${(file.size / 1024 / 1024).toFixed(1)}MB. Please choose one under ${Math.round(maxBytes / 1024 / 1024)}MB.`,
      });
      /* Clear the input so picking the same oversized file again still fires a
         change event, and so state and the input never disagree. */
      event.target.value = "";
      return;
    }

    onSelect(file);
  }

  function handleRemove(event) {
    /* The remove button sits below the area, not inside it, but stopping
       propagation keeps it safe if it is ever moved inside. */
    event.stopPropagation();
    if (inputRef.current) inputRef.current.value = "";
    onRemove();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`group w-full rounded-[14px] transition-colors focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(174,196,255,0.20)] ${
          previewUrl
            ? "border-[1.5px] border-solid border-[#C8D8FF] p-0 overflow-hidden"
            : "border-2 border-dashed border-[#E8ECF4] px-5 py-8 bg-[#F4F6FB] hover:border-[#AEC4FF] hover:bg-[#EEF3FF]"
        }`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile photo preview"
            className="w-full max-h-[280px] object-cover rounded-[12px]"
          />
        ) : (
          <span className="flex flex-col items-center gap-2.5">
            <span className="w-12 h-12 rounded-[12px] bg-[#EEF3FF] border border-[#C8D8FF] flex items-center justify-center text-[#001243]">
              <Upload className="w-[22px] h-[22px]" strokeWidth={1.5} />
            </span>
            <span className="text-[13.5px] Livvic-Bold text-[#001243]">
              Click to upload a photo
            </span>
            <span className="text-[11.5px] Livvic-Medium text-[#9CA3AF]">
              JPG, PNG or HEIC · Max 10MB
            </span>
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {previewUrl && (
        <button
          type="button"
          onClick={handleRemove}
          className="mt-3 inline-flex items-center rounded-full border-[1.5px] border-transparent px-4 py-1.5 text-[12px] Livvic-SemiBold text-[#DC2626] transition-colors hover:border-[#DC2626] hover:bg-[#FEF2F2] focus:outline-none focus-visible:border-[#DC2626]"
        >
          Remove photo
        </button>
      )}
    </div>
  );
}
