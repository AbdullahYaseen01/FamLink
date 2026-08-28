import Ra from "../../subComponents/rate";
import Avatar from "react-avatar";

export default function Reviews({
  img,
  points,
  name,
  size,
  para,
  hr,
  created,
}) {
  return (
    <div className="space-y-2 snap-start rounded-3xl border-2 border-[#EEEEEE] p-6 w-[335px] h-[218px] flex-shrink-0 flex flex-col justify-between overflow-y-auto hide-scrollbar">
      <div className="flex flex-col gap-2">
        <Ra points={points} size={size} />
        <p className="text-sm Livvic-Medium text-[#555555]">{para}</p>
        {/* {hr && <hr className="my-5" />} */}
      </div>
      <div>
        <div className="flex gap-2">
          {img ? (
            <img
              className="object-contain w-9 h-9 rounded-full"
              src={img}
              alt="img"
            />
          ) : (
            <Avatar
              className="object-contain w-9 h-9 rounded-full"
              size="40"
              color={"#F2F4FE"}
              name={
                name
                  ?.split(" ") // Split by space
                  .slice(0, 2) // Take first 1–2 words
                  .join(" ") // Re-join them
              }
            />
          )}
          <div className="flex flex-col">
            <p className="text-sm Livvic-SemiBold">{name}</p>
            <p className="text-xs Livvic-Medium text-[#666666]">
              {" "}
              {new Date(created).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
