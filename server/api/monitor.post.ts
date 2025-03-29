import { recordMetric } from "~/server/utils/monitoring";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  await recordMetric(body.metric, body.value, body.labels || {});

  return { success: true };
});
