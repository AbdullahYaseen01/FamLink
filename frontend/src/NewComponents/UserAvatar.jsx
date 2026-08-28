import { useState } from "react";
import Avatar from "react-avatar";
import { AVATAR_BG } from "../Config/avatar";

export default function UserAvatar({ user, className, size, avatarClassName }) {
  const [imgError, setImgError] = useState(false);

  if (user.imageUrl && !imgError) {
    return (
      <img
        style={{ borderRadius: "100px" }}
        src={user.imageUrl}
        alt="avatar"
        className={className}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <Avatar
      className={`${avatarClassName || ""} Livvic-Bold`}
      size={size}
      color={AVATAR_BG}
      fgColor={"#001243"} // text-primary — react-avatar sets initials via inline color, so a class can't override it
      name={user.name?.split(" ").slice(0, 2).join(" ")}
    />
  );
}
