import { useState } from "react";
import Avatar from "react-avatar";

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
      className={avatarClassName}
      size={size}
      color={"#AEC4FF"}
      name={user.name?.split(" ").slice(0, 2).join(" ")}
    />
  );
}
