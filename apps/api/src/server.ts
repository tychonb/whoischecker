import { env } from "@/config/env";
import { startJobInfrastructure } from "@/jobs/bootstrap";
import { createApp } from "@/app";
import { settingsRepository } from "@/services/container";

async function bootstrap() {
  await settingsRepository.ensureDefaults();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });

  if (env.ENABLE_WORKERS || env.ENABLE_SCHEDULER) {
    await startJobInfrastructure();
  }

  return server;
}

void bootstrap();
