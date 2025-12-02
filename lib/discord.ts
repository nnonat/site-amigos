export const getAvatar = (user: any) => {
  if (!user.avatar) return "/default.png";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`;
};