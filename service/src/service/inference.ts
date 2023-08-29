import { PredictionServiceClient } from '@google-cloud/aiplatform';
import axios from 'axios';

import { GoogleAuth } from 'google-auth-library';
import { Visitor } from '../model';
import { config } from './config';
import { visitors } from './visitors';

class InferenceService {
  private readonly endpoint =
    'projects/631212990321/locations/us-central1/endpoints/6533458620942647296';
  private readonly ai = new PredictionServiceClient({
    apiEndpoint: 'us-central1-aiplatform.googleapis.com',
  });

  async predictPurchasePropensity(visitor: Visitor) {
    const supportedEvents = await config.getSupportedEvents();
    //const token = await config.getToken();
    console.log(
      'InferenceService.predictPurchasePropensity#events',
      JSON.stringify(supportedEvents)
    );
    const counts = supportedEvents.map((event) => ({
      [event]: '' + visitors.getEventCount(event, visitor),
    }));
    const instance = counts.reduce(
      (instance, count) => ({ ...instance, ...count }),
      { client_id: visitor.clientId } as Record<string, any>
    );

    console.log(
      'InferenceService.predictPurchasePropensity#instance',
      JSON.stringify(instance)
    );

    const auth = new GoogleAuth();
    const token = await auth.getAccessToken();

    const response = await axios.post(
      'https://us-central1-aiplatform.googleapis.com/v1/projects/behavioral-couponing/locations/us-central1/endpoints/6533458620942647296:predict',
      JSON.stringify({ instances: [instance] }),
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = response.data;
    const scores = data.predictions[0].scores as number[];
    const classes = data.predictions[0].classes as string[];
    console.log(response.status, response.data);

    return scores[classes.findIndex((cls) => cls === 'true')] * 1000;
  }
}
export const inference = new InferenceService();
