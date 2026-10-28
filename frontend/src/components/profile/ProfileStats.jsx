const ProfileStats = ({
  postsCount = 0,
  followersCount = 0,
  followingCount = 0,
  onFollowersClick,
  onFollowingClick,
}) => {
  const stats = [
    {
      label: "Posts",
      value: postsCount,
      onClick: null,
    },
    {
      label: "Followers",
      value: followersCount,
      onClick: onFollowersClick,
    },
    {
      label: "Following",
      value: followingCount,
      onClick: onFollowingClick,
    },
  ];

  return (
    <div className="grid grid-cols-3 border-y border-[#EEECE8] dark:border-[#262626]">
      {stats.map((stat) => {
        const isClickable = Boolean(stat.onClick);
        const Content = (
          <div
            className={`flex flex-col items-center justify-center py-5 transition ${
              isClickable ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : ""
            }`}
          >
            <span className="text-lg font-semibold text-[#1B1C20] dark:text-white">
              {stat.value}
            </span>

            <span className="mt-1 text-xs text-[#686A72] dark:text-neutral-400">
              {stat.label}
            </span>
          </div>
        );

        if (isClickable) {
          return (
            <button
              key={stat.label}
              type="button"
              onClick={stat.onClick}
              className="w-full focus:outline-none"
            >
              {Content}
            </button>
          );
        }

        return <div key={stat.label}>{Content}</div>;
      })}
    </div>
  );
};

export default ProfileStats;