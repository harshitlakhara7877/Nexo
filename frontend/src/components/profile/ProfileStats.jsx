const ProfileStats = ({
  postsCount = 0,
  followersCount = 0,
  followingCount = 0,
}) => {
  const stats = [
    {
      label: "Posts",
      value: postsCount,
    },
    {
      label: "Followers",
      value: followersCount,
    },
    {
      label: "Following",
      value: followingCount,
    },
  ];

  return (
    <div className="grid grid-cols-3 border-y border-[#EEECE8]">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center justify-center py-5"
        >
          <span className="text-lg font-semibold text-[#1B1C20]">
            {stat.value}
          </span>

          <span className="mt-1 text-xs text-[#686A72]">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ProfileStats;