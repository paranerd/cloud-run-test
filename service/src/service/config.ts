import { Config } from '../model';
import { realtimeDatabase } from './realtime-db';

class ConfigService {
  private cachedConfig: Config | undefined;
  async getConfig() {
    if (!this.cachedConfig) {
      const config = await realtimeDatabase.getConfig();
      if (!config) {
        throw new Error('Could not find the configuration object.');
      }
      this.cachedConfig = config;
      setTimeout(() => (this.cachedConfig = undefined), 5 * 60 * 1000);
    }
    return this.cachedConfig;
  }

  async getArchiveAge() {
    return (await this.getConfig()).archiveAge;
  }

  async getSupportedEvents() {
    return (await this.getConfig()).supportedEvents;
  }

  async getVisitorSplit() {
    return (await this.getConfig()).visitorSplit;
  }

  async getReductionMatrix() {
    return (await this.getConfig()).reductionMatrix;
  }

  async getServiceUrl() {
    return (await this.getConfig()).serviceUrl;
  }

  async setToken(token: string) {
    const config = await this.getConfig();
    config.token = token;
    this.cachedConfig = undefined;
    realtimeDatabase.saveConfig(config);
  }
  async getToken() {
    const config = await this.getConfig();
    return config.token;
  }
}
export const config = new ConfigService();
