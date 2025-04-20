//email from Realtime database to actual email
export const encodeEmailForRTDB = (email) => {
  return email.replace(/\./g, ",").replace(/@/g, "_at_");
};
