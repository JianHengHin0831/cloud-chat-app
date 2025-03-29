export const encodeUsernameForRTDB = (username) => {
  return username.replace(/\./g, ",").replace(/\s/g, "_");
};
