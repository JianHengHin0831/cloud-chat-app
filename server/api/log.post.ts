import { logEvent } from "~/server/utils/monitoring";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  logEvent(body.event, body.details, body.severity || "INFO");

  return { success: true };
});
