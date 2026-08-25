import { useNavigate } from "react-router-dom";
import CustomButton from "../Button";

/*
 * What a profile view shows when the id in the URL belongs to the other role.
 *
 * Both view pages read the same `selectedNanny` slice, and neither used to check
 * what it had been handed — so which page rendered was decided entirely by the
 * URL the caller chose. `profileCard.jsx`, `ChatInterfaceRequests.jsx`,
 * `SharedProfilePage.jsx` and `SharedProfileReturn.jsx` all build those links,
 * and a single wrong one rendered a family's sections against a nanny's data:
 * every row empty, the hero badge asserting the wrong role, and nothing on the
 * page saying anything was amiss.
 *
 * Deliberately worded as a mismatch rather than "not found". The profile does
 * exist; it is this page that cannot show it.
 */
export default function ProfileNotFound({ expected }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-lg Livvic-SemiBold text-gray-800">
        This profile isn&apos;t a {expected} profile.
      </p>
      <p className="text-[15px] Livvic text-[#64748B] max-w-[420px]">
        The link you followed points at this page, but the profile behind it belongs
        to someone else&apos;s role — so there is nothing here to show.
      </p>
      <CustomButton btnText="Go back" action={() => navigate(-1)} className="bg-white border" />
    </div>
  );
}
